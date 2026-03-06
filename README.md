# Real-Time Communication System with Async Processing

A scalable real-time communication platform built with **React**, **Django**, and **Node.js WebSockets**.

The system supports real-time messaging, voice notes, video notes, voice/video calls, and status updates.
It uses an asynchronous architecture to handle real-time communication and background processing efficiently.

---

# Architecture Overview

The system separates responsibilities across services to improve performance and scalability.

* **React** → Frontend user interface
* **Django (Python)** → REST API, authentication, business logic
* **Node.js** → WebSocket server for real-time communication and media streaming
* **Redis** → Message broker between services
* **PostgreSQL / MongoDB** → Database
* **Cloud Storage (S3 / Cloudinary)** → Media storage

```text
React Frontend
      |
      | HTTP API
      v
Django Backend (Python)
- Authentication
- Database operations
- Media uploads
- Business logic
      |
      | Redis Pub/Sub
      v
Node.js WebSocket Server
- Real-time messaging
- Voice/video call streaming
- Notifications
- Online presence
      |
      v
Connected Clients
```

---

# Features

## Messaging

* Real-time private messaging
* Group messaging
* Typing indicators
* Message delivery updates

## Media Messaging

* Voice notes
* Video notes
* Image sharing
* File uploads

## Voice Calls

* Real-time audio communication
* Live audio streaming via WebSockets

## Video Calls

* Real-time video communication
* Media streaming handled by the WebSocket server

## Status Updates

* Post image or video status
* View other users’ status
* Automatic expiration after 24 hours

## Presence System

* Online/offline users
* Activity updates

## Async Processing

Background tasks handled asynchronously.

Examples:

* Media processing
* Status expiration cleanup
* Notification handling
* Analytics tasks

---

# Project Structure

```text
real-time-system/

backend/
│
├── django_api/
│   ├── manage.py
│   ├── config/
│   └── apps/
│       ├── users/
│       ├── chat/
│       └── status/
│
├── websocket_server/
│   ├── server.js
│   ├── socket/
│   │   ├── chat.socket.js
│   │   └── call.socket.js
│   └── redisClient.js
│
frontend/
│
└── react-app/
```

---

# Technology Stack

Frontend

* React
* WebSocket client
* MediaRecorder API

Backend

* Django
* Django REST Framework
* Node.js
* Redis

Database

* PostgreSQL or MongoDB

Infrastructure

* Nginx
* Docker (optional)
* Cloud storage (AWS S3 / Cloudinary)

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/real-time-system.git
cd real-time-system
```

---

# Backend Setup (Django)

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

Linux / macOS

```bash
source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

Start Django server:

```bash
python manage.py runserver
```

---

# WebSocket Server Setup

Navigate to the WebSocket server:

```bash
cd websocket_server
```

Install dependencies:

```bash
npm install
```

Start server:

```bash
node server.js
```

---

# Frontend Setup

Navigate to frontend directory:

```bash
cd frontend/react-app
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm start
```

---

# Environment Variables

Create a `.env` file in the backend directory.

Example configuration:

```text
DJANGO_SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
REDIS_URL=redis://localhost:6379
WEBSOCKET_SERVER=ws://localhost:4000
MEDIA_STORAGE_URL=your_storage_url
```

---

# Real-Time Communication Flow

1. User sends message from React.
2. React calls Django REST API.
3. Django stores the message in the database.
4. Django publishes a message event to Redis.
5. Node.js WebSocket server receives the event.
6. Node broadcasts the message instantly to connected clients.

---

# Voice / Video Call Flow

1. User initiates a call from the frontend.
2. WebSocket server sends an **incoming call event** to the receiver.
3. Receiver accepts or rejects the call.
4. Audio/video streams are transmitted through the WebSocket server.
5. Server distributes media data to the connected participants.

---

# Media Upload Flow

1. User records voice/video notes.
2. React uploads media to Django API.
3. Media stored in cloud storage.
4. URL saved in database.
5. Notification sent via WebSocket.

---

# Future Improvements

* Push notifications
* Message reactions
* Group voice/video calls
* Media compression
* End-to-end encryption
* Scalable microservices architecture

---

# Contribution

Contributions are welcome.

1. Fork repository
2. Create feature branch
3. Commit changes
4. Submit pull request

---

# License

MIT License

---

# Author

Lifted Simon
