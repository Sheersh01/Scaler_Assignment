from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List
import models, schemas, database, auth
import datetime

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/", response_model=List[schemas.Conversation])
def get_conversations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Find all conversations the user is a member of
    user_convs = db.query(models.ConversationMember.conversation_id).filter(
        models.ConversationMember.user_id == current_user.id
    ).subquery()

    conversations = db.query(models.Conversation).filter(
        models.Conversation.id.in_(user_convs)
    ).order_by(models.Conversation.updated_at.desc()).all()
    
    for conv in conversations:
        unread_count = 0
        for msg in conv.messages:
            if msg.sender_id != current_user.id and msg.status != models.MessageStatus.READ:
                unread_count += 1
        conv.unread_count = unread_count

    return conversations

@router.post("/", response_model=schemas.Conversation)
def create_conversation(conv: schemas.ConversationCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if conv.type == models.ConversationType.DIRECT:
        if not conv.contact_username:
            raise HTTPException(status_code=400, detail="Contact username required for direct conversation")
        
        contact_user = db.query(models.User).filter(models.User.username == conv.contact_username).first()
        if not contact_user:
            raise HTTPException(status_code=404, detail="Contact user not found")
        
        if contact_user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot create a direct conversation with yourself")

        # Check if conversation already exists
        existing_convs = db.query(models.Conversation).join(models.ConversationMember).filter(
            models.Conversation.type == models.ConversationType.DIRECT,
            models.ConversationMember.user_id.in_([current_user.id, contact_user.id])
        ).group_by(models.Conversation.id).having(func.count(models.ConversationMember.id) == 2).all()

        # Due to group_by/having sqlite compatibility, alternative check:
        for c in existing_convs:
            members = [m.user_id for m in c.members]
            if current_user.id in members and contact_user.id in members:
                return c

        new_conv = models.Conversation(
            type=models.ConversationType.DIRECT,
            created_by=current_user.id
        )
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)

        # Add members
        db.add(models.ConversationMember(conversation_id=new_conv.id, user_id=current_user.id))
        db.add(models.ConversationMember(conversation_id=new_conv.id, user_id=contact_user.id))
        db.commit()
        db.refresh(new_conv)
        return new_conv

    elif conv.type == models.ConversationType.GROUP:
        if not conv.group_name:
            raise HTTPException(status_code=400, detail="Group name required")
        
        new_conv = models.Conversation(
            type=models.ConversationType.GROUP,
            created_by=current_user.id
        )
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)

        # Add admin
        db.add(models.ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role=models.UserRole.ADMIN))
        
        # Add group info
        db.add(models.Group(conversation_id=new_conv.id, name=conv.group_name))
        
        db.commit()
        db.refresh(new_conv)
        return new_conv

@router.get("/{conversation_id}", response_model=schemas.Conversation)
def get_conversation(conversation_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    is_member = any(m.user_id == current_user.id for m in conv.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
    unread_count = 0
    for msg in conv.messages:
        if msg.sender_id != current_user.id and msg.status != models.MessageStatus.READ:
            unread_count += 1
    conv.unread_count = unread_count

    return conv

@router.post("/{conversation_id}/members", response_model=schemas.ConversationMember)
def add_group_member(conversation_id: int, username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conv.type != models.ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Can only add members to a group")

    # Check if admin
    admin_member = next((m for m in conv.members if m.user_id == current_user.id and m.role == models.UserRole.ADMIN), None)
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    new_user = db.query(models.User).filter(models.User.username == username).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="User to add not found")

    if any(m.user_id == new_user.id for m in conv.members):
        raise HTTPException(status_code=400, detail="User is already a member")

    new_member = models.ConversationMember(conversation_id=conv.id, user_id=new_user.id, role=models.UserRole.MEMBER)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return new_member

@router.delete("/{conversation_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_group_member(conversation_id: int, user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conv.type != models.ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Can only remove members from a group")

    # Check if requester is admin or if they are removing themselves
    admin_member = next((m for m in conv.members if m.user_id == current_user.id and m.role == models.UserRole.ADMIN), None)
    if not admin_member and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Only admins can remove other members")

    member_to_remove = next((m for m in conv.members if m.user_id == user_id), None)
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="User is not a member of this group")

    # Ensure we don't remove the last admin if there are other members
    if member_to_remove.role == models.UserRole.ADMIN:
        other_admins = [m for m in conv.members if m.role == models.UserRole.ADMIN and m.user_id != user_id]
        if not other_admins and len(conv.members) > 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin. Promote someone else first.")

    db.delete(member_to_remove)
    db.commit()
    return None
