import os
import sys
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash

def seed():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    try:
        print("Creating users...")
        users_data = [
            {"username": "alice", "phone": "1111111111", "display_name": "Alice Smith", "is_online": True},
            {"username": "bob", "phone": "2222222222", "display_name": "Bob Jones", "is_online": False},
            {"username": "charlie", "phone": "3333333333", "display_name": "Charlie Brown", "is_online": True},
            {"username": "dave", "phone": "4444444444", "display_name": "Dave Williams", "is_online": False},
            {"username": "eve", "phone": "5555555555", "display_name": "Eve Davis", "is_online": True},
        ]

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
        
        for i, name in enumerate(first_names):
            users_data.append({
                "username": f"{name.lower()}{i}",
                "phone": f"+1{random.randint(100000000, 999999999)}",
                "display_name": name,
                "is_online": random.choice([True, False])
            })
        
        users = {}
        for u in users_data:
            user = models.User(
                username=u["username"],
                phone=u["phone"],
                display_name=u["display_name"],
                password_hash=get_password_hash("password123"),
                is_online=u["is_online"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            users[u["username"]] = user
            
        print("Creating contacts...")
        db.add(models.Contact(owner_id=users["alice"].id, contact_id=users["bob"].id))
        db.add(models.Contact(owner_id=users["alice"].id, contact_id=users["charlie"].id))
        db.add(models.Contact(owner_id=users["bob"].id, contact_id=users["alice"].id))
        db.commit()

        print("Creating Direct Conversation between Alice and Bob...")
        conv_ab = models.Conversation(type=models.ConversationType.DIRECT, created_by=users["alice"].id)
        db.add(conv_ab)
        db.commit()
        db.refresh(conv_ab)
        
        db.add(models.ConversationMember(conversation_id=conv_ab.id, user_id=users["alice"].id))
        db.add(models.ConversationMember(conversation_id=conv_ab.id, user_id=users["bob"].id))
        db.commit()

        msg1 = models.Message(conversation_id=conv_ab.id, sender_id=users["alice"].id, content="Hey Bob! How are you?", status=models.MessageStatus.READ, created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2))
        msg2 = models.Message(conversation_id=conv_ab.id, sender_id=users["bob"].id, content="Hey Alice, I'm doing great! Working on that assignment.", status=models.MessageStatus.READ, created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1))
        msg3 = models.Message(conversation_id=conv_ab.id, sender_id=users["alice"].id, content="Awesome! Let me know if you need help 🚀", status=models.MessageStatus.DELIVERED, created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=5))
        
        db.add_all([msg1, msg2, msg3])
        db.commit()

        print("Creating Group Conversation...")
        conv_group = models.Conversation(type=models.ConversationType.GROUP, created_by=users["charlie"].id)
        db.add(conv_group)
        db.commit()
        db.refresh(conv_group)

        group_info = models.Group(conversation_id=conv_group.id, name="Project Team 💻")
        db.add(group_info)
        
        for uname in ["alice", "bob", "charlie", "dave"]:
            role = models.UserRole.ADMIN if uname == "charlie" else models.UserRole.MEMBER
            db.add(models.ConversationMember(conversation_id=conv_group.id, user_id=users[uname].id, role=role))
        db.commit()

        gmsg1 = models.Message(conversation_id=conv_group.id, sender_id=users["charlie"].id, content="Welcome to the project group everyone! 🎉", status=models.MessageStatus.READ, created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1))
        gmsg2 = models.Message(conversation_id=conv_group.id, sender_id=users["dave"].id, content="Glad to be here!", status=models.MessageStatus.READ, created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=12))
        gmsg3 = models.Message(conversation_id=conv_group.id, sender_id=users["alice"].id, content="When is our first meeting?", status=models.MessageStatus.DELIVERED, created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=30))
        
        db.add_all([gmsg1, gmsg2, gmsg3])
        db.commit()

        print("Database seeding completed successfully! ✅")
        print("You can now login with any username (e.g., 'alice', 'bob') and password 'password123'.")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
