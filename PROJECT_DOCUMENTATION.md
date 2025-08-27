# Real-Time Chat Application - Complete Project Documentation

## 📋 Project Overview

This is a comprehensive real-time chat application backend built with NestJS that provides instant messaging capabilities similar to WhatsApp, Telegram, or Discord. The application enables users to communicate in real-time through text messages, share files, manage group conversations, and build social connections through a friendship system.

### 🎯 Project Goals
- Provide seamless real-time communication between users
- Support both one-on-one and group conversations
- Enable file sharing and media exchange
- Implement social features like friend requests
- Ensure secure authentication and data privacy
- Scale efficiently for multiple concurrent users

## 🚀 Core Features

### 1. User Authentication & Management
- **User Registration**: Email-based registration with verification
- **User Login**: JWT-based authentication system
- **Profile Management**: Update username, email, and profile images
- **Password Reset**: Secure password recovery via email
- **Email Verification**: Account activation through email verification

### 2. Real-Time Messaging
- **Instant Messaging**: WebSocket-based real-time message delivery
- **Message Types**: Support for text messages and file attachments
- **Message Status**: Read receipts and delivery confirmations
- **Typing Indicators**: Real-time typing status notifications
- **Message History**: Persistent message storage with pagination

### 3. File Sharing System
- **Multi-Format Support**: Images, videos, documents, and other file types
- **File Upload**: Secure file upload with size and type validation
- **File Storage**: Organized file storage with unique naming
- **File Access**: Secure file serving with proper access controls
- **File Limits**: 50MB maximum file size with type restrictions

### 4. Group Chat Management
- **Group Creation**: Create group chats with multiple members
- **Member Management**: Add/remove members from groups
- **Admin Controls**: Assign and manage group administrators
- **Group Messaging**: Broadcast messages to all group members
- **Group Information**: Group details and member lists

### 5. Friendship System
- **Friend Requests**: Send and receive friend requests
- **Request Management**: Accept, decline, or cancel friend requests
- **Friends List**: View and manage friends list
- **Social Connections**: Build and maintain social relationships
- **Friend Discovery**: Find and connect with other users

### 6. Online Status & Presence
- **Real-Time Status**: Live online/offline status tracking
- **Connection Management**: Track user connections and disconnections
- **Status Broadcasting**: Notify friends of status changes
- **Presence Indicators**: Visual indicators for user availability

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   WebSocket     │    │   REST API      │
│   (Web/Mobile)  │◄──►│   Connection    │◄──►│   Endpoints     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Chat Gateway  │    │   Controllers   │
                       │   (Socket.IO)   │    │   (HTTP)        │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                └───────────┬───────────┘
                                            ▼
                                   ┌─────────────────┐
                                   │   Services      │
                                   │   (Business     │
                                   │    Logic)       │
                                   └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │   Database      │
                                   │   (MySQL)       │
                                   └─────────────────┘
```

## 📊 Database Design

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /user/auth/register          - Register new user
POST   /user/auth/login             - Login user
GET    /user/auth/current-user      - Get current user profile
PUT    /user                        - Update user profile
POST   /user/upload-image           - Upload profile image
POST   /user/auth/forgot-password   - Request password reset
POST   /user/auth/reset-password    - Reset password with token
```

### Chat Endpoints
```
GET    /chat/rooms                  - Get user's chat rooms
GET    /chat/messages               - Get messages with pagination
POST   /chat/send-message           - Send text message
POST   /chat/upload-file            - Upload file message
```

### Group Chat Endpoints
```
POST   /chat/group                  - Create new group
POST   /chat/group/add-member       - Add member to group
POST   /chat/group/add-admin        - Add admin to group
DELETE /chat/group/remove-member    - Remove member from group
```

### Friendship Endpoints
```
POST   /friendship/send-request     - Send friend request
POST   /friendship/accept-request   - Accept friend request
POST   /friendship/decline-request  - Decline friend request
GET    /friendship/requests         - Get pending requests
GET    /friendship/friends          - Get friends list
```



## 🔄 User Flow

### 1. Registration & Login
1. User registers with email → verifies account  
2. Logs in with email & password  
3. Receives JWT token for secure access  

### 2. Profile Setup
- Update profile details & avatar  
- Profile becomes discoverable  

### 3. Social Connections
- Search for users  
- Send **friend request**  
- Recipient can accept, decline, or ignore  

### 4. Friends List & Presence
- Accepted friends appear in list  
- Real-time **online/offline indicators**  

### 5. One-on-One Chat
- Friends can initiate private chat  
- Messages exchanged in real time:
  - Text  
  - Files  
- Typing indicators & read receipts  

### 6. Group Chats
- Create group with multiple friends  
- Add/remove members  
- Assign admins  
- Group-wide real-time chat  

### 7. Manage Friendships
- Remove friends anytime  
- Friendships are bidirectional  
- Discover new friends via search  

---


This documentation provides a complete overview of the real-time chat application, covering all features, technical implementation, and integration guidelines. It serves as a single source of truth for developers, product managers, and stakeholders to understand the project scope and capabilities.
