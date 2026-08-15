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
- `GET /api/videos/:videoId` — `403` if premium and no subscription (`user.isPremium`)
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

## Seed

```bash
npm run seed:demo
npm run seed:courses
```
