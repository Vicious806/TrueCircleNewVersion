# FriendMeet - Social Dining Application

## Overview

FriendMeet is a social dining platform that connects food lovers to make new friends over meals. The application allows users to create and join meetups of different sizes (1-on-1, 3 people, or group), chat with participants, and coordinate dining experiences at restaurants and cafes.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React with TypeScript using Vite for development and bundling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket integration for live chat functionality
- **Authentication**: Replit Auth with OpenID Connect integration
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling

### Deployment Strategy
The application is configured for Replit's autoscale deployment with:
- Development server running on port 5000
- Production build process using Vite and esbuild
- PostgreSQL database integration
- Session-based authentication with secure cookies

## Key Components

### Database Schema
- **Users Table**: Stores user profiles with Replit Auth integration, including profile images, bio, interests, and location
- **Meetups Table**: Contains meetup details including type (1v1/3people/group), restaurant/cafe information, scheduling, and participant limits
- **Meetup Participants**: Junction table managing user participation in meetups
- **Chat Messages**: Real-time messaging system for meetup coordination
- **Sessions**: Secure session storage for authentication

### Frontend Architecture
- **Component-based React**: Modular UI components using shadcn/ui
- **State Management**: React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: WebSocket client for live chat functionality

### Backend Services
- **RESTful API**: Express routes for CRUD operations on meetups, users, and messages
- **WebSocket Server**: Real-time chat implementation with participant-only access
- **Authentication Middleware**: Session-based auth with Replit integration
- **Database Layer**: Drizzle ORM with connection pooling using Neon serverless

## Data Flow

1. **User Authentication**: Users sign in via Replit Auth, creating or updating their profile in PostgreSQL
2. **Meetup Discovery**: Users browse available meetups with filtering by type, interests, location, and schedule
3. **Meetup Creation**: Authenticated users create new meetups with details like restaurant/cafe preferences and participant limits
4. **Participation Management**: Users can join/leave meetups with automatic participant count updates
5. **Real-time Chat**: WebSocket connections enable live messaging between meetup participants
6. **Data Persistence**: All user actions are persisted to PostgreSQL with optimistic UI updates

## External Dependencies

### Core Framework Dependencies
- **React & TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web framework
- **Drizzle ORM**: Type-safe database operations
- **@neondatabase/serverless**: PostgreSQL connection with serverless compatibility

### UI and Styling
- **@radix-ui Components**: Accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for components

### Authentication & Real-time
- **Replit Auth (OpenID Connect)**: User authentication and session management
- **WebSocket (ws)**: Real-time communication for chat functionality
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Fast development server and build tool
- **esbuild**: Fast JavaScript bundler for production
- **React Query**: Server state management and caching

## Deployment Strategy

### Development Environment
- Runs on Replit with hot module replacement
- Uses Vite dev server for fast development cycles
- PostgreSQL database automatically provisioned
- WebSocket development support

### Production Deployment
- Builds optimized bundles using Vite (frontend) and esbuild (backend)
- Serves static files from Express server
- Uses Replit's autoscale infrastructure
- Session storage persisted in PostgreSQL
- Environment variables for database and authentication configuration

### Security Considerations
- Session-based authentication with secure HTTP-only cookies
- CSRF protection through SameSite cookie settings
- Input validation using Zod schemas
- SQL injection prevention through Drizzle ORM parameterized queries
- Age verification enforcement (18+ only platform)

## Changelog

Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Replaced Replit Auth with custom username/email/password authentication system. Added user registration with 18+ age verification checkbox, unique username constraints, and email verification (auto-verified in development). Created two-column authentication page with login/registration forms.
- June 26, 2025. Updated ProfileModal to only allow editing location and bio fields since names are collected during registration. Removed age verification from profile editing as it's required during signup.
- June 26, 2025. Added profile picture icon in header that opens profile editing modal. Users can now edit username (with uniqueness validation), bio, profile picture URL, and interests. Profile picture displays in header when set.
- June 26, 2025. Replaced profile picture URL input with file upload functionality. Users can now upload image files directly from their device (PNG, JPG, etc.) with validation for file type and size (2MB limit). Images are converted to base64 data URLs for storage. Fixed server payload limit to handle image uploads.
- June 26, 2025. Updated app scope to include both restaurants and cafes. Modified UI text throughout application to reflect this broader dining scope. Added "Cafe & Coffee" option to dining preferences.
- June 26, 2025. Fixed React hook errors and authentication issues preventing app startup. Improved meetup type icons: added UserCheck for 1-on-1, fixed spacing for 3-people icon with overlapping effect, and simplified group icon to use clean Users icon.
- June 26, 2025. Transformed app from manual meetup creation to intelligent smart matching system. Added comprehensive first-time user survey with 5 strategic questions about conversation topics, communication style, social energy, location preferences, and activities. Created smart matching algorithm that uses survey data to pair compatible users based on preferences and personality traits rather than manual meetup joining.

## User Preferences

Preferred communication style: Simple, everyday language.
App scope: Meetups are for both restaurants and cafes (not just restaurants).
Minimum distance setting: 10 miles minimum for all smart matching requests.
Smart matching requirement: Only match users with same meetup type (1v1 with 1v1, 3-people with 3-people, group with group).