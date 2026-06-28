from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/{conversation_id}", response_model=List[schemas.Message])
def get_messages(conversation_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify user is member of conversation
    member = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).order_by(models.Message.created_at.asc()).all()
    
    updated = False
    for msg in messages:
        if msg.sender_id != current_user.id and msg.status != models.MessageStatus.READ:
            msg.status = models.MessageStatus.READ
            updated = True
            
    if updated:
        db.commit()

    return messages

@router.post("/", response_model=schemas.Message)
def send_message(msg: schemas.MessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    member = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == msg.conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    new_msg = models.Message(
        conversation_id=msg.conversation_id,
        sender_id=current_user.id,
        content=msg.content,
        type=msg.type,
        status=models.MessageStatus.SENT,
        reply_to=msg.reply_to
    )
    db.add(new_msg)
    
    # Update conversation updated_at
    conv = db.query(models.Conversation).filter(models.Conversation.id == msg.conversation_id).first()
    if conv:
        from datetime import datetime
        conv.updated_at = datetime.utcnow()
        
    db.commit()
    db.refresh(new_msg)
    
    # In a real app, this is where we would trigger the WebSocket broadcast
    # For now, WebSockets will be handled in a separate manager or endpoint

    return new_msg
