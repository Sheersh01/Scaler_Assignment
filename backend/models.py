from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from database import Base

class ConversationType(enum.Enum):
    DIRECT = "DIRECT"
    GROUP = "GROUP"

class MessageStatus(enum.Enum):
    SENDING = "SENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"

class MessageType(enum.Enum):
    TEXT = "TEXT"
    SYSTEM = "SYSTEM"

class UserRole(enum.Enum):
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    display_name = Column(String)
    avatar = Column(String, nullable=True)
    password_hash = Column(String)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    is_online = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    contact_id = Column(Integer, ForeignKey("users.id"), index=True)
    nickname = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id])
    contact = relationship("User", foreign_keys=[contact_id])

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ConversationType))
    created_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    members = relationship("ConversationMember", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")
    group_info = relationship("Group", back_populates="conversation", uselist=False)

    @property
    def last_message(self):
        if self.messages:
            return sorted(self.messages, key=lambda m: m.created_at)[-1]
        return None

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_read_message_id = Column(Integer, nullable=True)

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User")

class Group(Base):
    __tablename__ = "groups"

    conversation_id = Column(Integer, ForeignKey("conversations.id"), primary_key=True)
    name = Column(String)
    avatar = Column(String, nullable=True)

    conversation = relationship("Conversation", back_populates="group_info")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(String)
    type = Column(Enum(MessageType), default=MessageType.TEXT)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    reply_to = Column(Integer, ForeignKey("messages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    deleted_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
