# API Chronos

NestJS-based REST API for the Chronos time tracking platform.

## Overview

This is a standalone NestJS API that replicates all REST API routes from the `next-chronos` Next.js application. It provides a dedicated backend service for managing time tracking, user authentication, and file uploads.

## Features

- 🔐 **Authentication**: User signup, signin, and logout
- ⏱️ **Heartbeats**: Track coding activity with detailed heartbeat data
- 📊 **Summaries**: Aggregate and query time tracking summaries
- 👤 **User Management**: Profile management and password changes
- 📁 **File Uploads**: Avatar upload and retrieval using GridFS
- 🏥 **Health Check**: MongoDB connection status monitoring
- 🔒 **Security**: Helmet middleware for HTTP headers protection
- ⚡ **Performance**: Gzip compression for optimized response sizes

## Tech Stack

- **Framework**: NestJS 11.x
- **Database**: MongoDB with Mongoose 8.x ODM
- **Validation**: Zod 3.x
- **Authentication**: API Key (Basic Auth)
- **Security**: Helmet 8.x (HTTP headers protection)
- **Performance**: Compression 1.x (gzip responses)
- **File Upload**: Multer

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB instance (local or remote)

### Installation

```bash
# Install dependencies
pnpm install
```

### Configuration

The API uses a centralized configuration module with environment variable validation.

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# MongoDB Configuration (Required)
MONGODB_URI=mongodb://localhost:27017/chronos

# Heartbeat Processing
HEARTBEAT_INTERVAL_SEC=120

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Note:** All environment variables are validated on application startup using Zod. Missing required variables will cause the app to fail with a clear error message.

### Running the Application

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3001/api/v1`

### API Documentation

Swagger documentation is available at: `http://localhost:3001/api/v1/swagger`

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Sign in with email and password
- `POST /api/v1/auth/logout` - Logout user

### Heartbeats

- `POST /api/v1/heartbeats` - Submit activity heartbeats

### Summaries

- `GET /api/v1/summaries` - Get total time summaries
- `GET /api/v1/summaries/range` - Get summaries for a specific time range

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `PUT /api/v1/users/me/password` - Change password

### Files

- `POST /api/v1/upload/avatar` - Upload avatar image
- `DELETE /api/v1/upload/avatar/delete` - Delete avatar
- `GET /api/v1/files/:id` - Retrieve file by ID

### Health

- `GET /api/v1/ping` - Health check endpoint

## Authentication

Most endpoints require API key authentication using Basic Auth:

```bash
curl -u "your-api-key:" http://localhost:3001/api/v1/users/me
```

The API key is generated automatically when a user signs up.

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── config/                # Configuration constants
├── common/                # Shared utilities and guards
│   ├── decorators/       # Custom decorators
│   ├── filters/          # Exception filters
│   ├── guards/           # Authentication guards
│   └── utils/            # Utility functions
├── schemas/              # MongoDB schemas
│   ├── user.schema.ts
│   ├── heartbeat.schema.ts
│   ├── hourly-activity.schema.ts
│   ├── file.schema.ts
│   └── project.schema.ts
└── modules/              # Feature modules
    ├── auth/
    ├── heartbeats/
    ├── summaries/
    ├── users/
    ├── files/
    └── ping/
```

## Development

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage
pnpm test:cov
```

## Integration with Next.js Frontend

This API is designed to be a drop-in replacement for the API routes in `next-chronos`. The response formats, validation rules, and error handling are identical to ensure seamless integration.

To switch the frontend to use this API:

1. Start the NestJS API: `pnpm start:dev`
2. Update the frontend API base URL to point to `http://localhost:3001/api/v1`
3. Ensure the same MongoDB database is used

## Migration from Next.js

This API has been fully migrated from the Next.js API routes in `next-chronos`. All endpoints maintain the same:

- Request/response formats
- Validation rules
- Error handling
- Business logic

The frontend can be switched to use this API by updating the API base URL configuration.

## Project Status

✅ **Implementation Complete** - All endpoints from Next.js have been successfully migrated to NestJS:

- Auth endpoints (signup, signin, logout)
- User management (profile, password)
- Heartbeat tracking
- Time summaries
- File management (avatar upload/delete)
- Health check
- Migration endpoint

## Testing

Before running the API, ensure MongoDB is running:

```bash
# Start MongoDB (if using Homebrew)
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then start the API:

```bash
pnpm start:dev
```

Test the API:

```bash
# Health check
curl http://localhost:3001/api/v1/ping

# Signup (creates user with API key)
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "terms": true
  }'

# Use the returned API key for authenticated requests
curl -u "YOUR_API_KEY:" http://localhost:3001/api/v1/users/me
```

## Future Enhancements

- [ ] JWT-based authentication (in addition to API keys)
- [ ] Rate limiting
- [ ] Redis caching
- [ ] WebSocket support for real-time updates
- [ ] Background job processing for analytics
- [ ] Database migrations
- [ ] Docker containerization
- [ ] Swagger/OpenAPI documentation UI
- [ ] Unit and integration tests

## License

Private - Part of the Chronos monorepo
