/**
 * @openapi
 * /api/admin/courses:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List all courses
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Published, Archived] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Courses fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Create course
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               instructor: { type: string }
 *               thumbnailUrl: { type: string }
 *               bookPdfUrl: { type: string }
 *               vocabularyPdfUrl: { type: string }
 *               status: { type: string, enum: [Draft, Published, Archived] }
 *               isPremium: { type: boolean }
 *               quizAvailable: { type: boolean }
 *               order: { type: number }
 *     responses:
 *       201:
 *         description: Course created
 *
 * /api/admin/courses/reorder:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Reorder courses
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderedIds]
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Courses reordered
 *
 * /api/admin/courses/{courseId}:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Get course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course fetched
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete course (cascades chapters, videos, progress)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course deleted
 *
 * /api/admin/courses/{courseId}/chapters:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List chapters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapters fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Create chapter
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Chapter created
 *
 * /api/admin/courses/{courseId}/chapters/reorder:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Reorder chapters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapters reordered
 *
 * /api/admin/chapters/{chapterId}:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update chapter
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapter updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete chapter (cascades videos)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapter deleted
 *
 * /api/admin/chapters/{chapterId}/videos:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List videos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Videos fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Create video metadata (external URL)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Video created
 *
 * /api/admin/chapters/{chapterId}/videos/reorder:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Reorder videos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Videos reordered
 *
 * /api/admin/videos/{videoId}:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update video
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Video updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete video (cascades progress)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Video deleted
 *
 * /api/courses:
 *   get:
 *     tags: [User Courses]
 *     summary: List published courses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Courses fetched
 *
 * /api/courses/{courseId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Published course detail + chapters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course fetched
 *
 * /api/courses/{courseId}/chapters:
 *   get:
 *     tags: [User Courses]
 *     summary: Published chapters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapters fetched
 *
 * /api/courses/{courseId}/chapters/{chapterId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Chapter + published videos (premium lock applied)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chapter fetched
 *
 * /api/videos/{videoId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Video playback info
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Video fetched
 *       403:
 *         description: Premium subscription required
 *
 * /api/videos/{videoId}/progress:
 *   post:
 *     tags: [User Courses]
 *     summary: Save watch progress
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               positionSeconds: { type: number }
 *               durationSeconds: { type: number }
 *               progress: { type: number }
 *               completed: { type: boolean }
 *     responses:
 *       200:
 *         description: Progress saved
 *
 * /api/me/continue-watching:
 *   get:
 *     tags: [User Courses]
 *     summary: In-progress videos
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Continue watching fetched
 *
 * /api/me/watch-history:
 *   get:
 *     tags: [User Courses]
 *     summary: Watch history
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Watch history fetched
 */

module.exports = {};
