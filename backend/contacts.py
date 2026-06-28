from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/", response_model=List[schemas.Contact])
def get_contacts(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    contacts = db.query(models.Contact).filter(models.Contact.owner_id == current_user.id).all()
    return contacts

@router.get("/search", response_model=List[schemas.User])
def search_users(q: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    users = db.query(models.User).filter(
        (models.User.username.ilike(f"%{q}%")) | 
        (models.User.display_name.ilike(f"%{q}%"))
    ).filter(models.User.id != current_user.id).limit(10).all()
    return users

@router.post("/", response_model=schemas.Contact)
def add_contact(contact: schemas.ContactCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    contact_user = db.query(models.User).filter(models.User.username == contact.contact_username).first()
    if not contact_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if contact_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")

    existing_contact = db.query(models.Contact).filter(
        models.Contact.owner_id == current_user.id,
        models.Contact.contact_id == contact_user.id
    ).first()
    
    if existing_contact:
        raise HTTPException(status_code=400, detail="Contact already exists")

    new_contact = models.Contact(
        owner_id=current_user.id,
        contact_id=contact_user.id,
        nickname=contact.nickname
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    contact = db.query(models.Contact).filter(
        models.Contact.id == contact_id, 
        models.Contact.owner_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}
