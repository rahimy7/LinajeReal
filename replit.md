# Overview

This is a modern full-stack web application for the Seventh-Day Adventist Church's South American Division website. The application provides a comprehensive platform for church resources, news, videos, educational content, and church finder functionality. It serves as a central hub for the Adventist community to access spiritual content, find local churches, and stay connected with church activities and programs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using TypeScript and Vite as the build tool. The application follows a component-based architecture with:

- **UI Components**: Extensive use of shadcn/ui components built on Radix UI primitives for accessible, customizable interface elements
- **Styling**: Tailwind CSS for utility-first styling with custom CSS variables for theming and Adventist brand colors
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and data fetching
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
The backend follows a Node.js/Express pattern with:

- **Server Framework**: Express.js with TypeScript for type safety
- **API Architecture**: RESTful API design with /api prefix for all endpoints
- **Development Setup**: Vite integration for hot module replacement in development
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions
The application uses a flexible storage architecture:

- **Database**: PostgreSQL as the primary database with Drizzle ORM for type-safe database operations
- **Schema Management**: Shared schema definitions between client and server using Drizzle with Zod validation
- **Migration System**: Drizzle Kit for database migrations and schema changes
- **Development Storage**: In-memory storage implementation for development/testing

## Authentication and Authorization
Basic user management structure is in place with:

- **User Schema**: Users table with username/password authentication
- **Type Safety**: Shared TypeScript types for user entities
- **Validation**: Zod schemas for input validation

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting service (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel functionality for content sections

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

### Content and Media
- **Unsplash**: External image service for placeholder and stock imagery
- **Google Fonts**: Web fonts including Inter, Open Sans, and custom font families

### Third-Party Integrations
The application integrates with various Adventist organization services:

- **ADRA**: Humanitarian aid organization content
- **7Class**: Educational platform integration
- **Feliz7Play**: Video streaming service
- **Downloads Portal**: Resource distribution system
- **News Portal**: Content management for news articles
- **Church Finder**: Geolocation services for finding local churches

### Development Environment
- **Replit**: Cloud development environment with specific plugins for runtime error handling and cartographer for development tooling