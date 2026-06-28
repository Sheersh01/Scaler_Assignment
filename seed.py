import asyncio
import sys
sys.path.insert(0, './backend')
from database import SessionLocal, engine
import models
from auth import get_password_hash
import datetime

models.Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if we already have users
    if db.query(models.User).first():
        print("Database already seeded")
        return

    users = [
        {"username": "alice", "phone": "+1234567890", "display_name": "Alice", "password": "password"},
        {"username": "bob", "phone": "+1987654321", "display_name": "Bob", "password": "password"},
        {"username": "charlie", "phone": "+1122334455", "display_name": "Charlie", "password": "password"},
        {"username": "diana", "phone": "+1555666777", "display_name": "Diana", "password": "password"}
    ]
    
    db_users = []
    for u in users:
        db_user = models.User(
            username=u["username"],
            phone=u["phone"],
            display_name=u["display_name"],
            password_hash=get_password_hash(u["password"])
        )
        db.add(db_user)
        db_users.append(db_user)
        
    db.commit()

    # Create contacts
    # Alice knows Bob and Charlie
    db.add(models.Contact(owner_id=db_users[0].id, contact_id=db_users[1].id))
    db.add(models.Contact(owner_id=db_users[0].id, contact_id=db_users[2].id))
    # Bob knows Alice and Diana
    db.add(models.Contact(owner_id=db_users[1].id, contact_id=db_users[0].id))
    db.add(models.Contact(owner_id=db_users[1].id, contact_id=db_users[3].id))
    
    db.commit()
    print("Database seeded successfully")

if __name__ == "__main__":
    seed_db()
