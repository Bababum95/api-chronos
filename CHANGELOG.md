# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-11

### Added

- Complete NestJS API implementation migrated from next-chronos
- Auth module with signup, signin, and logout endpoints
- Users module with profile management and password change
- Heartbeats module for tracking coding activity
- Summaries module for time tracking statistics
- Files module for file retrieval
- Upload module for avatar management
- Ping module for health checks
- Migrations module endpoint
- API Key authentication guard
- MongoDB schemas for User, Heartbeat, HourlyActivity, File, and Project
- Zod validation for all endpoints
- CORS support
- Global exception filter

### Technical Details

- API prefix: `/api/v1`
- Authentication: Basic Auth with API keys (format: `chronos_${uuid}`)
- Response format: `{ success, message, data?, errors? }`
- File uploads: Max 5MB, images only (JPEG, PNG, WebP, GIF)
- MongoDB connection with Mongoose ORM
- Password hashing with bcrypt (12 rounds)
- UUID generation for API keys

### Endpoints

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/signin` - Sign in user
- `POST /api/v1/auth/logout` - Logout user (clears cookie)
- `GET /api/v1/users/me` - Get user profile (protected)
- `PUT /api/v1/users/me` - Update user profile (protected)
- `PUT /api/v1/users/me/password` - Change password (protected)
- `POST /api/v1/heartbeats` - Submit activity heartbeats (protected)
- `GET /api/v1/summaries` - Get total time summary (protected)
- `GET /api/v1/summaries/range` - Get time summary for range (protected)
- `GET /api/v1/files/:id` - Retrieve file by ID (public)
- `POST /api/v1/upload/avatar` - Upload avatar (protected)
- `DELETE /api/v1/upload/avatar/delete` - Delete avatar (protected)
- `GET /api/v1/ping` - Health check (public)
- `POST /api/migrations/v1` - Migration endpoint (public)
