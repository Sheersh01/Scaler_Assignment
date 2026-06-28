from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import ConversationType, MessageStatus, MessageType, UserRole

class UserBase(BaseModel):
    username: str
    phone: str
    display_name: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    last_seen: datetime
    is_online: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ContactBase(BaseModel):
    nickname: Optional[str] = None

class ContactCreate(ContactBase):
    contact_username: str

class Contact(ContactBase):
    id: int
    owner_id: int
    contact_id: int
    created_at: datetime
    contact: User

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    type: ConversationType

class ConversationCreate(BaseModel):
    type: ConversationType
    contact_username: Optional[str] = None
    group_name: Optional[str] = None

class GroupInfo(BaseModel):
    name: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationMember(BaseModel):
    id: int
    user_id: int
    role: UserRole
    joined_at: datetime
    user: User

    class Config:
        from_attributes = True

class Conversation(ConversationBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMember] = []
    group_info: Optional[GroupInfo] = None
    last_message: Optional['Message'] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str
    type: MessageType = MessageType.TEXT

class MessageCreate(MessageBase):
    conversation_id: int
    reply_to: Optional[int] = None

class Message(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    status: MessageStatus
    reply_to: Optional[int]
    created_at: datetime
    deleted_at: Optional[datetime]
    sender: Optional[User] = None

    class Config:
        from_attributes = True

try:
    Conversation.model_rebuild()
except AttributeError:
    Conversation.update_forward_refs()
