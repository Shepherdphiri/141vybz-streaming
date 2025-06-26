# VoiceConnect - WebRTC Voice Chat Application

## Overview

VoiceConnect is a real-time voice communication application built with React, Express, and WebRTC. It enables users to make voice calls to each other using unique user IDs, featuring WebSocket-based signaling for connection establishment and call management.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with WebSocket support for real-time communication
- **Database**: PostgreSQL with Drizzle ORM for data modeling and migrations
- **Real-time Communication**: WebRTC for peer-to-peer voice calls with WebSocket signaling
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling
- **Deployment**: Configured for Replit with autoscale deployment

### Technology Stack
- **Runtime**: Node.js 20
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + WebSocket (ws library)
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Audio Processing**: Web Audio API for audio visualization

## Key Components

### Frontend Architecture
- **React Router**: Wouter for client-side routing
- **Component Library**: shadcn/ui for consistent UI components
- **Hooks**: Custom hooks for WebSocket, WebRTC, and audio device management
- **Audio Features**: Real-time audio visualization and device selection
- **Responsive Design**: Mobile-first approach with responsive components

### Backend Architecture
- **Express Server**: RESTful API with WebSocket upgrade support
- **WebSocket Server**: Real-time signaling for WebRTC connections
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Session Management**: User connection tracking and call state management
- **Error Handling**: Centralized error handling middleware

### Database Schema
- **Users Table**: User authentication and management (id, username, password)
- **Calls Table**: Call history and metadata (caller, callee, duration, status, timestamp)
- **Validation**: Zod schemas for type-safe data validation

### WebRTC Implementation
- **Signaling**: Custom WebSocket protocol for offer/answer exchange
- **ICE Handling**: STUN/TURN server coordination for NAT traversal
- **Audio Management**: Microphone access, muting, and audio device selection
- **Call States**: Comprehensive call state management (idle, calling, connected, ended)

## Data Flow

### Call Initiation Flow
1. User enters target User ID and clicks "Start Call"
2. Frontend establishes WebRTC peer connection
3. Signaling message sent via WebSocket to target user
4. Target user receives incoming call notification
5. Accept/reject decision propagated back through signaling
6. WebRTC connection established for direct audio communication

### WebSocket Signaling Protocol
- **Message Types**: offer, answer, ice-candidate, call-request, call-response, call-end
- **User Registration**: Automatic user registration on WebSocket connection
- **Message Routing**: Server routes messages between connected users
- **Connection Management**: Automatic cleanup on disconnection

### Database Operations
- **Call Logging**: All call attempts and completions logged to database
- **User Management**: Basic user storage (currently using in-memory store)
- **Analytics**: Call duration and status tracking for usage insights

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connectivity
- **ws**: WebSocket server implementation
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives

### Audio/Media Dependencies
- **Web Audio API**: Browser-native audio processing
- **MediaDevices API**: Camera/microphone access
- **WebRTC API**: Peer-to-peer communication

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Fast JavaScript bundling for production

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20 with PostgreSQL 16 module
- **Build Process**: Vite frontend build + ESBuild backend bundle
- **Port Configuration**: Internal port 5000, external port 80
- **Auto-scaling**: Configured for automatic scaling based on demand

### Production Build
- **Frontend**: Static asset generation to `dist/public`
- **Backend**: Bundled server code to `dist/index.js`
- **Database**: Migration-based schema management with Drizzle
- **Environment Variables**: DATABASE_URL for PostgreSQL connection

### Development Workflow
- **Hot Reload**: Vite HMR for frontend, tsx for backend development
- **Database Migrations**: `npm run db:push` for schema updates
- **Type Safety**: Shared types between frontend and backend via `shared/` directory

## Changelog

```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```