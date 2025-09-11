# Assessment Platform

## Overview

The Assessment Platform is a comprehensive role-based online evaluation system designed to assess candidates on core engineering skills, enterprise skills, and software proficiency. The platform provides a scalable solution with AI-powered question generation, multi-modal assessment types, and advanced analytics for different user roles including Super Admins, Subject Matter Experts (SMEs), Managers/HR, and Candidates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation
- **Authentication**: Role-based access control integrated with Replit Auth

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL with connection pooling
- **Authentication**: Replit Auth with OpenID Connect, session management using PostgreSQL store
- **API Design**: RESTful endpoints with role-based authorization middleware

### Code Architecture Patterns
- **Monorepo Structure**: Shared schema between client and server in `/shared` directory
- **Type Safety**: End-to-end TypeScript with shared Zod schemas for validation
- **Component Organization**: Modular UI components with separation of concerns
- **Service Layer**: Dedicated services for OpenAI integration and code execution
- **Error Handling**: Centralized error handling with unauthorized request detection

### Role-Based Access Control
- **Super Admin**: Full platform access, user management, analytics, system configuration
- **SME (Subject Matter Expert)**: Question creation, AI generation, content management
- **Manager/HR**: Assessment creation, candidate management, progress tracking
- **Candidate**: Assessment taking, progress viewing, limited platform access

### Assessment Engine
- **Multi-Modal Support**: Multiple choice, coding challenges, scenario-based questions, file uploads
- **Adaptive Testing**: Dynamic question selection based on performance
- **Code Execution**: Sandboxed code execution service supporting Python, JavaScript, C/C++
- **Proctoring**: Support for both proctored and non-proctored assessment modes
- **Time Management**: Configurable time limits and session management

### AI Integration
- **Question Generation**: OpenAI integration for automated question creation
- **Content Enhancement**: AI-powered question quality improvement and feedback
- **Document Processing**: AI analysis of uploaded documents for question generation
- **Generation Logging**: Comprehensive tracking of AI generation requests and outcomes

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Storage**: PostgreSQL-based session store with connect-pg-simple

### AI and Machine Learning
- **OpenAI API**: GPT models for question generation, content improvement, and feedback
- **Content Processing**: AI-powered analysis of uploaded documents and educational materials

### Development and Build Tools
- **Vite**: Modern build tool with hot module replacement and optimized bundling
- **TypeScript**: End-to-end type safety across client, server, and shared modules
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast JavaScript bundling for production builds

### UI and Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for UI elements
- **React Hook Form**: Performant forms with minimal re-renders

### Code Execution Environment
- **Sandboxed Execution**: Secure code execution environment for programming assessments
- **Multi-Language Support**: Python, JavaScript, C, C++ compilation and execution
- **Resource Management**: Memory and time limit enforcement for code execution

### Monitoring and Analytics
- **Query Optimization**: TanStack Query for efficient data fetching and caching
- **Performance Tracking**: Built-in request logging and performance monitoring
- **Error Tracking**: Comprehensive error handling and logging system