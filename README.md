# patented

Node.js / Express backend for the Patented app (MongoDB + JWT).

- Production: `https://patented.vercel.app`
- Local: `http://localhost:5001`
- Swagger UI: `/api-docs`

## Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/forgot-password` | No |
| POST | `/api/auth/verify-reset-code` | No |
| POST | `/api/auth/reset-password` | No |

Demo accounts:

- User: `user@patented.app` / `User@123`
- Admin: `admin@patented.app` / `Admin@123`

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@patented.app","password":"Admin@123"}'
```

Protected routes send `Authorization: Bearer <JWT>`.

## Course / Chapter / Video

Metadata only. Video files stay on Vimeo/Cloudinary/S3/Mux. Admin pastes a `videoUrl`.

Deleting a course also deletes its chapters, videos, and progress. Deleting a chapter deletes its videos. Deleting a video deletes its progress rows.

### Admin (role=admin)

```bash
# List courses
curl http://localhost:5001/api/admin/courses \
  -H "Authorization: Bearer $TOKEN"

# Create course
curl -X POST http://localhost:5001/api/admin/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Driving License Type B",
    "description": "...",
    "instructor": "Admin",
    "thumbnailUrl": "https://...",
    "status": "Draft",
    "isPremium": false,
    "quizAvailable": true,
    "order": 1
  }'

# Create chapter
curl -X POST http://localhost:5001/api/admin/courses/COURSE_ID/chapters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Chapter 1 - Introduction","description":"...","published":true,"order":1}'

# Create video (external / Vimeo URL)
curl -X POST http://localhost:5001/api/admin/chapters/CHAPTER_ID/videos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lecture 1",
    "videoUrl": "https://vimeo.com/123456789",
    "durationSeconds": 510,
    "durationLabel": "08:30",
    "published": true,
    "isPremium": false,
    "isFree": true,
    "order": 1,
    "provider": "vimeo"
  }'

# Reorder
curl -X PATCH http://localhost:5001/api/admin/courses/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderedIds":["id1","id2"]}'
```

Other admin routes:

- `PATCH /api/admin/courses/:courseId`
- `DELETE /api/admin/courses/:courseId`
- `PATCH /api/admin/courses/:courseId/chapters/reorder`
- `PATCH /api/admin/chapters/:chapterId`
- `DELETE /api/admin/chapters/:chapterId`
- `GET /api/admin/chapters/:chapterId/videos`
- `PATCH /api/admin/chapters/:chapterId/videos/reorder`
- `PATCH /api/admin/videos/:videoId`
- `DELETE /api/admin/videos/:videoId`

### User (JWT, published content only)

```bash
curl http://localhost:5001/api/courses -H "Authorization: Bearer $TOKEN"

curl http://localhost:5001/api/courses/COURSE_ID/chapters/CHAPTER_ID \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:5001/api/videos/VIDEO_ID/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"positionSeconds":120,"durationSeconds":510,"progress":0.23,"completed":false}'
```

- `GET /api/courses/:courseId`
- `GET /api/courses/:courseId/chapters`
- `GET /api/videos/:videoId` — `403` if premium and no subscription (`user.isPremium` or course not in `unlockedCourses`)
- `GET /api/me/continue-watching`
- `GET /api/me/watch-history`

Progress `>= 0.95` or `completed: true` marks the video complete.

Locked premium video in lists:

```json
{
  "title": "Lecture 2",
  "isPremium": true,
  "isLocked": true,
  "videoUrl": null,
  "message": "Premium subscription required"
}
```

## Dashboard, profile, users

```bash
# Dashboard
curl http://localhost:5001/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Profile
curl http://localhost:5001/api/me \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH http://localhost:5001/api/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"+92 300 1234567","country":"Pakistan"}'

# Change password
curl -X PATCH http://localhost:5001/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"User@123","newPassword":"NewPass@123","confirmPassword":"NewPass@123"}'

# Users
curl "http://localhost:5001/api/admin/users?search=&status=all&page=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X PATCH http://localhost:5001/api/admin/users/USER_ID/block \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isBlocked":true}'

curl -X PATCH http://localhost:5001/api/admin/users/USER_ID/course-access \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"COURSE_ID","unlocked":true}'
```

Blocked users cannot log in (`403`: `Your account has been blocked. Contact support.`).

## Seed

```bash
npm run seed:demo
npm run seed:courses
```

`seed:courses` upserts **Driving License Type B** from `data/SEED_DRIVING_LICENSE_TYPE_B.json` (25 published chapters, 117 Vimeo lectures). The first two lectures in each chapter are free; the rest are premium. The old stub course `Road Safety & Traffic Rules` is removed.

## Manual payments

Premium is **not** granted when a user submits a payment. Status stays `pending` until an admin approves it. Approve sets `user.isPremium = true` and `premiumExpiresAt` (Weekly 7 days, Monthly 30 days, Yearly 365 days). Reject leaves premium unchanged.

Account numbers come from env (`JAZZCASH_ACCOUNT`, `EASYPAISA_ACCOUNT`, `BANK_ACCOUNT`, …). Placeholders are returned if unset.

```bash
# Plans + method instructions
curl http://localhost:5001/api/subscription/plans -H "Authorization: Bearer $TOKEN"
curl http://localhost:5001/api/payments/methods -H "Authorization: Bearer $TOKEN"

# Submit (user)
curl -X POST http://localhost:5001/api/payments/manual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "Monthly",
    "amount": 2000,
    "currency": "PKR",
    "method": "JazzCash",
    "transactionId": "JZ123456",
    "senderPhone": "03001234567",
    "proofUrl": "",
    "note": ""
  }'

curl "http://localhost:5001/api/payments/my?page=1" -H "Authorization: Bearer $TOKEN"

# Admin review
curl "http://localhost:5001/api/admin/payments?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X PATCH http://localhost:5001/api/admin/payments/PAYMENT_ID/review \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","note":"Verified"}'
```

## Push notifications

Register the FCM token after login. Unregister on logout. Admin send writes an in-app inbox row per recipient and attempts FCM if Firebase Admin credentials are set. Users with `pushNotification: false` still get the in-app row; FCM is skipped for them.

```bash
curl -X POST http://localhost:5001/api/me/device-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"FCM_TOKEN","platform":"android","device":"Pixel"}'

curl "http://localhost:5001/api/me/notifications?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH http://localhost:5001/api/me/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN"

curl -X DELETE http://localhost:5001/api/me/device-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"FCM_TOKEN"}'

curl -X POST http://localhost:5001/api/admin/notifications/send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New lecture published",
    "body": "Chapter 2 is now available",
    "audience": "all",
    "data": { "type": "course", "courseId": "COURSE_ID" }
  }'
```

FCM env (optional until push is needed): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, or a single `FIREBASE_SERVICE_ACCOUNT_JSON`.
