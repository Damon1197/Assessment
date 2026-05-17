# Assessment - Interview Assessment Platform with AI Proctoring

A full-stack web application for technical interviews and assessments with real-time AI proctoring capabilities. Built with TypeScript, React, and Node.js.

## Problem Statement

Create a secure online assessment platform that prevents cheating during technical interviews while providing real-time monitoring and analysis for recruiters.

## Key Features

- **AI Proctoring**: Real-time video and audio monitoring during assessments
- **Question Bank**: Categorized technical questions across difficulty levels
- **Secure Browser**: Prevents tab switching and copy-paste during tests
- **Live Monitoring**: Dashboard for recruiters to monitor multiple candidates
- **Automated Scoring**: Rule-based and manual scoring mechanisms
- **Answer Tracking**: Time-stamped answer logs for review

## Tech Stack

- **Frontend**: TypeScript, React, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite, PostCSS
- **State Management**: Local/Session Storage

## Architecture

```
Assessment/
├── client/          # React frontend with TypeScript
├── server/          # Node.js Express backend
├── shared/          # Shared types and utilities
├── attached_assets/ # Static assets and media
├── dist/            # Production build output
└── .replit/          # Replit configuration
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`
4. Start development server:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Key Modules

- **Assessment Engine**: Handles question delivery and answer capture
- **Proctoring Service**: AI-powered monitoring of candidate behavior
- **Question Player**: Interactive question display with timer
- **Results Dashboard**: Visualization of candidate performance

## Security Features

- Browser lockdown during assessment
- Face detection and head tracking
- Copy-paste prevention
- Multiple tab/window detection
- Automatic flagging for suspicious behavior

## How to Use

1. **For Recruiters**: Create assessments, manage question banks, monitor live sessions
2. **For Candidates**: Take assessments with real-time proctoring enabled

## Skills Demonstrated

- Full-stack TypeScript development
- React component architecture
- RESTful API design
- Database modeling with PostgreSQL
- AI integration for monitoring
- Security best practices

## License

MIT
