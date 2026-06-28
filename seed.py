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

    import random
    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", 
        "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", 
        "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", 
        "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", 
        "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", 
        "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Carol", 
        "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa", "Timothy", "Deborah"
    ]
    
    users = []
    for i, name in enumerate(first_names):
        users.append({
            "username": f"{name.lower()}{i}",
            "phone": f"+1{random.randint(100000000, 999999999)}",
            "display_name": name,
            "password": "password"
        })
    
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
