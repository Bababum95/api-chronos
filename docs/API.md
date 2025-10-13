# API Reference (Chronos)

Base URL: `${APP_URL}/${API_PREFIX}` (default `http://localhost:3001/api/v1`)

Authentication
- Most routes require an API key via HTTP Basic auth
- Header: `Authorization: Basic <base64(apiKey:)>`
- Get your `apiKey` from `Auth → Sign In/Up` responses

Errors
- Unified error envelope from the global exception filter
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "path": "email", "message": "Please enter a valid email address", "field": "email" }
  ]
}
```

Success envelope
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

---

## Auth

### POST /auth/signup
Create a new user.

Request body
```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "terms": true
}
```

Response
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "<uuid>",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "apiKey": "chronos_<uuid>",
    "isEmailVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

curl
```bash
curl -X POST "$APP_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "password": "secret123",
        "confirmPassword": "secret123",
        "terms": true
      }'
```

### POST /auth/signin
Sign in and retrieve credentials.

Request body
```json
{ "email": "ada@example.com", "password": "secret123" }
```

Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "isEmailVerified": false,
    "createdAt": "...",
    "apiKey": "chronos_<uuid>"
  }
}
```

curl
```bash
curl -X POST "$APP_URL/api/v1/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "secret123" }'
```

### POST /auth/logout
Clears the auth cookie (stateless API key remains).

curl
```bash
curl -X POST "$APP_URL/api/v1/auth/logout"
```

---

## Users (API key required)

Auth header example
```bash
# base64("<apiKey>:")
AUTH_HEADER="Authorization: Basic $(printf "%s:" "$API_KEY" | base64)"
```

### GET /users/me
Get the current user profile.

Response
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": { "_id": "...", "name": "...", "email": "...", "apiKey": "...", "avatarUrl": null, "gallery": [] }
}
```

curl
```bash
curl -H "$AUTH_HEADER" "$APP_URL/api/v1/users/me"
```

### PUT /users/me
Update the current user profile.

Body
```json
{ "name": "New Name", "email": "new@example.com" }
```

curl
```bash
curl -X PUT "$APP_URL/api/v1/users/me" \
  -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  -d '{ "name": "New Name" }'
```

### PUT /users/me/password
Change password.

Body
```json
{ "currentPassword": "old", "newPassword": "newsecret", "confirmPassword": "newsecret" }
```

curl
```bash
curl -X PUT "$APP_URL/api/v1/users/me/password" \
  -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  -d '{ "currentPassword": "old", "newPassword": "newsecret", "confirmPassword": "newsecret" }'
```

---

## Uploads (API key required)

### POST /upload/avatar
Multipart upload of user avatar. Field name: `avatar`.

curl
```bash
curl -X POST "$APP_URL/api/v1/upload/avatar" \
  -H "$AUTH_HEADER" \
  -F avatar=@/path/to/image.png
```

Errors
- 400: invalid type (jpeg/png/webp/gif) or >5MB

### DELETE /upload/avatar/delete
Delete current avatar.

curl
```bash
curl -X DELETE "$APP_URL/api/v1/upload/avatar/delete" -H "$AUTH_HEADER"
```

---

## Files

### GET /files/:id
Serves the stored file bytes.

Headers set
- `Content-Type`: based on file
- `Cache-Control: public, max-age=31536000`
- CORS headers open

curl
```bash
curl "$APP_URL/api/v1/files/<fileId>" --output avatar.png
```

---

## Heartbeats (API key required)

### POST /heartbeats
Ingest activity heartbeats.

Body
```json
{
  "heartbeats": [
    {
      "time": 1717425600,
      "entity": "src/index.ts",
      "is_write": true,
      "lineno": 10,
      "cursorpos": 12,
      "lines_in_file": 120,
      "alternate_project": "my-project",
      "git_branch": "main",
      "project_folder": "/workspace/my-project",
      "language": "TypeScript",
      "category": "building",
      "ai_line_changes": 5,
      "human_line_changes": 2,
      "is_unsaved_entity": false
    }
  ]
}
```

Response
```json
{ "success": true, "message": "Heartbeats saved", "count": 1 }
```

curl
```bash
curl -X POST "$APP_URL/api/v1/heartbeats" \
  -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  -d '{ "heartbeats": [{ "time": 1717425600, "entity": "src/index.ts", "is_write": true, "lineno": 10, "cursorpos": 12, "lines_in_file": 120 }] }'
```

---

## Summaries (API key required)

### GET /summaries
Returns total time summary for the user.

Response
```json
{ "success": true, "message": "Summaries fetched successfully", "data": { "totalTime": 12345 } }
```

curl
```bash
curl -H "$AUTH_HEADER" "$APP_URL/api/v1/summaries"
```

### GET /summaries/range?start=<sec>&end=<sec>&full=<bool>&interval=<sec>
Returns range summary; when `full=true`, includes bucketed activities by interval.

Response
```json
{
  "success": true,
  "message": "Summaries fetched successfully",
  "data": {
    "totalTime": 5400,
    "totalTimeStr": "1h 30m",
    "start": 1717425600,
    "end": 1717429200,
    "activities": [
      [ { "timestamp": 1717425600, "time_spent": 1200 } ],
      [ { "timestamp": 1717429200, "time_spent": 1800 } ]
    ]
  }
}
```

curl
```bash
curl "$APP_URL/api/v1/summaries/range?start=1717425600&end=1717429200&full=true" -H "$AUTH_HEADER"
```

---

## Ping

### GET /ping
DB connection check.

Response
```json
{ "status": 1, "message": "Connected" }
```

curl
```bash
curl "$APP_URL/api/v1/ping"
```

---

## Notes
- Global prefix is `api/v1`; configure via `API_PREFIX`
- CORS is enabled and open by default; adjust `CORS_ORIGIN`
- Rate limiting is not configured; consider adding if exposed publicly
