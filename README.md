# Signal Clone - Secure Messaging Platform

![Frontend Screenshot](screenshots/frontend_screenshot.png)

A fully functional clone of the Signal messaging application focusing on modern design, responsive user experience, and core real-time messaging workflows. Built with **FastAPI** on the backend and **Next.js** on the frontend.

## 🌟 Key Features Implemented

### 1. 🔐 Authentication & Security
- Secure user registration and login system.
- Implementation of **JWT (JSON Web Tokens)** for session management.
- Passwords are securely hashed using **Bcrypt** before being stored in the database.

### 2. 📱 Fully Responsive Design
- The application boasts a flawless, native-like responsive design.
- **Desktop/Tablet View**: Utilizes a classic 3-pane layout (Global Navigation, Sidebar List, Active Chat Window).
- **Mobile View**: Intelligently switches to a single-pane view. The global navigation shifts to a bottom tab bar, and opening a chat expands it to full screen with a native-style "Back" button to return to the chat list.

### 3. 💬 Real-time Messaging & Rich Media
- Instant message delivery powered by **WebSockets**.
- **Emoji Picker Integration**: Native-style emoji keyboard that doesn't load images over network for maximum performance.
- **Live Read Receipts**: Messages instantly show read indicators (double checks) the moment the recipient views the chat.
- **Live Unread Badges**: The sidebar actively displays and updates unread message counts in real-time without requiring a page refresh.
- **Live Typing Indicators**: See exactly when someone is typing a message to you.
- **Live Online Status**: The chat header actively checks the database to display whether the user you are talking to is currently online.

### 4. 🎨 Themes & Customization
- **Dark Mode**: Fully implemented dynamic Dark Mode support powered by native CSS variables.
- The theme settings persist locally and instantly invert the app's entire UI for nighttime viewing.

### 5. 👥 Contact & Group Management
- **Global Search**: Find any registered user seamlessly via a unified search bar.
- **Group Chats**: Create and manage groups with multiple participants.

### 6. 📡 Scalable Backend Architecture
- **Modular FastAPI**: Clean separation of concerns with dedicated routers for auth, contacts, conversations, and messages.
- **WebSocket Manager**: A robust manager that handles active connections, routes messages to the correct clients, and broadcasts events like `NEW_MESSAGE`, `MESSAGE_READ`, and `TYPING`.

---

## 🛠 Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python framework)
- **Database**: SQLite (Easily swappable to PostgreSQL for production)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Authentication**: JWT, Bcrypt
- **Real-time**: WebSockets

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **State Management**: Zustand (For Auth and WebSocket state)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## 🏗 Database Schema

- **users:** `id`, `username`, `phone`, `display_name`, `avatar`, `password_hash`, `last_seen`, `is_online`, `created_at`
- **contacts:** `id`, `owner_id`, `contact_id`, `nickname`, `created_at`
- **conversations:** `id`, `type` (DIRECT | GROUP), `created_by`, `created_at`, `updated_at`
- **conversation_members:** `id`, `conversation_id`, `user_id`, `role`, `joined_at`, `last_read_message_id`
- **groups:** `conversation_id`, `name`, `avatar`
- **messages:** `id`, `conversation_id`, `sender_id`, `content`, `type`, `status`, `reply_to`, `created_at`, `deleted_at`

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **Python** (v3.10 or higher)

### 1. Backend Setup
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
# source venv/bin/activate
```

Install exactly the required dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=sqlite:///./sql_app.db
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3000
CORS_ORIGINS=http://localhost:3000
```

Start the backend server:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Seed the Database (Highly Recommended)
To instantly populate the app with fake users, contacts, and group chats so you can test it immediately:
```bash
# While still in the backend directory
python seed.py
```
*Note: You can then log into the frontend using the username `alice` and password `password123` to see a fully populated chat interface!*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install Node dependencies:
```bash
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Start the development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to view the application!

---

## 🌍 Production Deployment Guide

### Deploying the Backend (Render.com)
1. Push your code to a GitHub repository.
2. Go to **Render.com** and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to `pip install -r requirements.txt`.
6. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port 10000`.
7. Expand **Environment Variables** and add the following:
   - `PYTHON_VERSION`: `3.11.9` *(Crucial to prevent build errors on Render)*
   - `DATABASE_URL`: `sqlite:///./sql_app.db`
   - `SECRET_KEY`: `signal_clone_secret_key`
   - `CORS_ORIGINS`: `*` *(Update this to your frontend URL once deployed)*
8. Select the **Free** instance type and click **Deploy**.

### Deploying the Frontend (Vercel)
1. Go to **Vercel.com** and click **Add New Project**.
2. Connect the exact same GitHub repository.
3. Vercel will automatically detect that it's a Next.js project. Make sure the Root Directory is set to `frontend`.
4. Open the **Environment Variables** section and add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com` *(Do NOT include a trailing slash)*
   - `NEXT_PUBLIC_WS_URL`: `wss://your-backend-url.onrender.com` *(Make sure to use `wss://` for secure websockets!)*
5. Click **Deploy**.

**Final Step**: Once Vercel finishes deploying, copy your live Vercel URL, go back to your Render backend Environment Variables, and update `CORS_ORIGINS` to match your Vercel URL (e.g., `https://my-signal-clone.vercel.app`).

---

## 🎭 Assumptions & Mocks
- **Authentication:** Standard JWT token-based authentication is used instead of real phone-based OTP verification.
- **Encryption:** End-to-end encryption is bypassed; messages are stored as plaintext to focus on core chat UX as per assignment rules.
- **Placeholders:** Settings pages, Video/Audio calls are kept as UI placeholders per the PRD instructions.
- **WebSockets:** A basic broadcast manager is used. It works seamlessly for a single server instance.

## 📞 Contact
**Maintainers**: Sheersh Saxena  
**Project URL**: https://github.com/Sheersh01/Scaler_Assignment
