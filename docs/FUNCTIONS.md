# Public Functions, Utilities, Schemas, and Types

This document describes the exported functions and types intended for external or cross-module usage, with examples.

## Utilities

### parseOrThrow(schema, data)
- From: `src/common/utils/validation.utils.ts`
- Purpose: Validate with Zod and throw a standard `ValidationError` on failure (with `.details`).

Example
```ts
import { z } from 'zod';
import { parseOrThrow } from '@/common/utils/validation.utils';

const Input = z.object({ email: z.string().email() });

const data = parseOrThrow(Input, { email: 'a@b.com' });
// => returns typed data or throws Error('ValidationError') with .details
```

### zodErrorToValidationErrors(error)
- From: `src/common/utils/validation.utils.ts`
- Purpose: Convert a `z.ZodError` into the standardized `ValidationError[]` shape

### normalizeTimestamp(timestamp)
- From: `src/common/utils/time.utils.ts`
- Purpose: Detect seconds vs milliseconds and return seconds value

### toHourStart(timestamp)
- From: `src/common/utils/time.utils.ts`
- Purpose: Align timestamp to start of hour (in seconds)

### toHourEnd(timestamp)
- From: `src/common/utils/time.utils.ts`
- Purpose: Align timestamp to end of hour (inclusive, in seconds)

### formatDuration(seconds)
- From: `src/common/utils/time.utils.ts`
- Purpose: Format duration like `2h 30m` or `45m`

Example
```ts
import { formatDuration } from '@/common/utils/time.utils';
formatDuration(5400); // "1h 30m"
```

### calculateActiveTime(heartbeats, start, end)
- From: `src/common/utils/heartbeat.utils.ts`
- Purpose: Compute active time (seconds) based on heartbeat intervals and latest heartbeat elapsed time

Example
```ts
const seconds = calculateActiveTime(heartbeats, startSec, endSec);
```

## API Response helpers

### createSuccessResponse(message, data)
- From: `src/common/types/api-response.type.ts`
- Returns: `{ success: true, message, data }`

### createErrorResponse(message, errors?)
- From: `src/common/types/api-response.type.ts`
- Returns: `{ success: false, message, errors }`

Example
```ts
import { createSuccessResponse, createErrorResponse } from '@/common/types/api-response.type';

return createSuccessResponse('OK', { value: 1 });
// or for errors inside Exceptions
throw new BadRequestException(
  createErrorResponse('Invalid', [{ path: 'email', message: 'Bad email', field: 'email' }])
);
```

## Summaries helpers

### bucketActivities(activities, start, end, interval)
- From: `src/modules/summaries/utils/bucket-activities.ts`
- Purpose: Group activities into fixed-size time buckets, filling gaps with zero entries

### aggregateActivities(activities)
- From: `src/modules/summaries/utils/aggregate-activities.ts`
- Purpose: Aggregate activities within a bucket by `timestamp` and `root_project`

## Types

- From: `src/common/types/api-response.type.ts`
  - `ValidationError`: `{ path: string; message: string; field?: string }`
  - `ApiResponse<T>`: standard response envelope

- From: `src/modules/summaries/types/activity.type.ts`
  - `Activity`: `{ timestamp: number; time_spent: number; root_project?: { _id: ObjectId; name: string } | null }`

- From: `src/modules/summaries/types/summary-response.type.ts`
  - `SummariesRangeResponse`: `{ totalTime, totalTimeStr, start, end, activities?: Activity[][] }`

- From: `src/common/dto/validation-schemas.ts`
  - `HeartbeatsInput`, `SummariesQuery`, `SignUpInput`, `SignInInput`, `UpdateProfileInput`, `ChangePasswordInput`

## Guards and Filters (Behavior)

### ApiKeyGuard
- From: `src/common/guards/api-key.guard.ts`
- Expects `Authorization: Basic <base64(apiKey:)>`
- Validates API key format and loads user by `apiKey`; attaches `request.user`

### HttpExceptionFilter
- From: `src/common/filters/http-exception.filter.ts`
- Transforms thrown exceptions into `{ success: false, message, errors? }` JSON responses

## Schemas (Mongoose)

- `User` (`src/schemas/user.schema.ts`): fields include `name`, `email`, `password` (select:false), `apiKey` (default `chronos_<uuid>`), `avatarUrl`, `gallery[]`; pre-save password hashing; `comparePassword`; static `findByApiKey`.
- `File` (`src/schemas/file.schema.ts`): binary data with `mimeType`, `size`, `purpose: 'avatar'` and `user` reference.
- `Heartbeat` (`src/schemas/heartbeat.schema.ts`): raw telemetry events.
- `HourlyActivity` (`src/schemas/hourly-activity.schema.ts`): aggregated activity, with static `updateFromHeartbeats(...)`.
- `Project` (`src/schemas/project.schema.ts`): project metadata per user.

## Environment & Config

- `loadConfiguration()` (`src/config/configuration.ts`): loads and validates environment variables with Zod; returns typed config.
- Constants (`src/config/constants.ts`): `API_PREFIX`, `HEARTBEAT_INTERVAL_SEC`, time constants, file upload limits/types.

## Usage Notes

- All times are seconds-based; utilities normalize milliseconds input.
- Heartbeat ingestion triggers aggregation into `HourlyActivity` via `updateFromHeartbeats`.
- File responses include long-lived caching headers; clients should cache avatars by ID.
