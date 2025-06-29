# TrueCircle - College Student Saturday Meetups

## Overview

TrueCircle is a social dining platform exclusively for college students (ages 18-24) to meet every Saturday for meals. The application uses smart matching to connect students for 1-on-1 or group meetups at restaurants and cafes, with scheduling options for brunch (11 AM), lunch (1 PM), or dinner (6 PM).

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
- June 26, 2025. Removed romantic/dating elements (hearts, pink colors) and replaced with professional social networking design. Added venue-based matching system - users select restaurant or cafe preference as required field, and smart matching only pairs people with same venue type preferences. Reordered form to prioritize venue selection before date/time.
- June 26, 2025. Removed preferred area/location field from smart matching form to simplify user experience. Implemented comprehensive blue theme throughout entire application - updated CSS variables, gradients, and component colors to maintain consistent professional blue/indigo color scheme across all UI elements.
- June 26, 2025. Implemented location input system with address/GPS detection modal for area-based matching. Added comprehensive match result system showing users detailed match information, compatibility scores, participant details, and suggested meetup logistics. Created dedicated matches page for viewing all user matches with group chat integration foundation.
- June 26, 2025. Implemented pinned header system for group chats with editable location, date, and time coordination fields. Users can collaboratively set meetup details (restaurant/cafe location, date, time) that remain visible at top of chat during conversations. Includes save/cancel functionality, visual feedback, and persistent display to prevent coordination details from being forgotten.
- June 26, 2025. Transformed chat interface into Discord-style format with profile pictures, usernames, timestamps, and date separators. Added clickable username popups showing detailed profile information including bio, location, join date, and profile picture. Messages now display in left-aligned format with hover effects and comprehensive user information access.
- June 26, 2025. Optimized matching system for speed and simplicity: restricted to one-on-one matching only, requires just one shared survey answer for compatibility, limited scheduling to Fridays only with 1:00 PM and 5:30 PM time slots. Removed complex compatibility scoring algorithm to achieve sub-100ms matching performance.
- June 26, 2025. Implemented anonymous group chat system where users appear as "Anonymous 1", "Anonymous 2", etc. to protect privacy during coordination. Added smart Friday availability logic that keeps Friday options open after Thursday 8am cutoff if people are waiting for matches (1+ for 1v1, 1-2 for groups) to prevent users from being stranded.
- June 26, 2025. Updated matching requirements: 1v1 matching requires at least one shared survey answer for compatibility, while group matching has no survey requirements and focuses purely on logistics (date, time, venue type) for more diverse group dynamics.
- June 26, 2025. Enhanced matching system with shared interest requirement: 1v1 matching requires at least one shared survey answer to ensure meaningful conversation starters. Added shared interest detection and display in 1v1 chats (e.g., "Both enjoy talking about travel"). Chat interface now shows anonymous users for groups ("Anonymous 1", "Anonymous 2") and "You"/"Other person" labels for 1v1 conversations.
- June 27, 2025. Implemented comprehensive age range matching system for both 1v1 and group meetups. Added draggable dual-handle slider (18-50+) positioned above venue selection. Users can set age preferences that filter potential matches while maintaining shared interest requirements for 1v1 conversations. Age field integrated into registration and profile editing.
- June 27, 2025. Implemented real email verification system using Gmail SMTP (truecirclesocial@gmail.com). Registration now requires actual date of birth input with 18+ validation and sends professional verification emails. Users must verify their email before logging in. System calculates actual age from birth date and enforces strict age matching in smart matching algorithm.
- June 27, 2025. Transformed email verification from link-based to verification code-based system. Users now receive 6-digit codes via email that expire in 15 minutes. Added verification code input form to frontend with code-focused UI design. Improved email template styling and deliverability. System fully functional with Gmail SMTP integration.
- June 27, 2025. Fixed smart matching request validation error by updating time options to use proper enum values ("lunch", "dinner") instead of raw time strings ("1pm", "5:30pm"). Verification code system and smart matching both fully operational.
- June 27, 2025. Implemented comprehensive group matching system that prioritizes filling existing groups before creating new ones. Groups match based on venue type (restaurant/cafe), date, time, and age range compatibility. Users with "no preference" age settings can join any compatible group. Maximum group size enforced at 4 people. System separates 1v1 matching (requires shared interests) from group matching (logistics-focused only).
- June 27, 2025. Updated 1v1 age slider to jump 3 years per tick for faster selection. Simplified verification code email template to reduce spam flagging - removed promotional styling, marketing language, and branding to create clean transactional email format.
- June 27, 2025. Simplified Friday availability to strict Thursday 10pm cutoff. Removed complex waiting user logic and backend availability checking. Fridays now become unavailable at exactly Thursday 10pm regardless of how many people are waiting.
- June 27, 2025. Implemented comprehensive duplicate prevention system preventing users from having multiple active matching requests simultaneously. Added backend validation with 409 conflict responses, frontend conflict detection popup, and cancel request functionality. System ensures accurate user counts and prevents gaming the matching algorithm.
- June 27, 2025. Changed app name from "FriendMeet" to "TrueCircle" throughout the entire application including landing page, authentication pages, welcome survey, and all documentation.
- June 27, 2025. Updated ChatPinnedHeader component to automatically display scheduled date and time from smart matching selections instead of requiring manual input. Date and time now appear from the suggestedDate and suggestedTime fields in match data, with proper time formatting (lunch=1:00 PM, dinner=5:30 PM).
- June 27, 2025. Fixed critical chat messaging system by resolving React hooks errors and database constraint issues. Added functional emoji picker with 18 common emojis accessible via smile button. Updated database schema to support match-based chat with proper column handling for both meetup_id and match_id fields.
- June 27, 2025. Implemented address autocomplete functionality using OpenStreetMap Nominatim API. Added smart address suggestions to LocationModal for user location setting and MeetupPinnedHeader for restaurant/cafe location coordination. Features debounced search, real-time suggestions dropdown, and venue-specific filtering (restaurants vs cafes).
- June 27, 2025. Added leave match functionality with confirmation dialog. Users can now exit their current match via dropdown menu in chat header, which deletes the match and all associated chat messages, returning them to home screen to find new connections. Includes proper database cleanup and user feedback.
- June 27, 2025. Implemented location-based distance matching using Haversine formula calculations. Smart matching now respects the selected address from autocomplete suggestions and filters potential matches within the specified radius (10-25 miles). Uses geocoding API to convert addresses to coordinates for accurate distance calculations between users.
- June 29, 2025. Major platform transformation: Changed from Friday meetups for all adults (18+) to Saturday meetups exclusively for college students (18-24). Updated scheduling system from Friday cutoff to Saturday with Friday 10 PM cutoff. Added brunch option (11 AM) alongside lunch (1 PM) and dinner (6 PM). Transformed age requirements throughout registration, matching algorithms, and UI messaging to focus on college student community.

## User Preferences

Preferred communication style: Simple, everyday language.
Target audience: College students only (ages 18-24).
Meeting schedule: Saturday meetups only with Friday 10 PM cutoff.
Time options: Brunch (11 AM), lunch (1 PM), dinner (6 PM) to accommodate college schedules.
App scope: Meetups are for both restaurants and cafes (not just restaurants).
Minimum distance setting: 10 miles minimum for all smart matching requests.
Smart matching requirement: Only match users with same meetup type (1v1 with 1v1, group with group). Removed 3-people option entirely from the app.
Maximum group size: 4 people for optimal group dynamics and conversation quality.
Age range matching: College-focused age brackets (18-20 Freshmen/Sophomore, 21-24 Junior/Senior) for groups while 1v1 matches use flexible slider (18-24). Strict age verification requirement during registration.