/**
 * @openapi
 * /api/admin/courses/{courseId}/books:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List course books
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Books fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Upload a course book PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               published: { type: string, enum: [true, false] }
 *               totalPages: { type: number }
 *     responses:
 *       201:
 *         description: Book uploaded
 *
 * /api/admin/books/{bookId}:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update a course book
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               published: { type: boolean }
 *               totalPages: { type: number }
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               published: { type: string }
 *               totalPages: { type: number }
 *     responses:
 *       200:
 *         description: Book updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete a course book
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Book deleted
 *
 * /api/admin/books/{bookId}/download:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Download a course book PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Authenticated PDF stream
 *
 * /api/courses/{courseId}/books:
 *   get:
 *     tags: [User Courses]
 *     summary: List published books (locked courses return isLocked true)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Books fetched or course locked with empty list
 *
 * /api/courses/{courseId}/books/{bookId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Get a published book
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Book fetched
 *       403:
 *         description: Course locked
 *
 * /api/courses/{courseId}/books/{bookId}/download:
 *   get:
 *     tags: [User Courses]
 *     summary: Download a published book PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Authenticated PDF stream
 *       403:
 *         description: Course locked
 *
 * /api/admin/courses/{courseId}/quiz:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Get course quiz and questions
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Quiz fetched (quiz may be null)
 *   put:
 *     tags: [Admin Courses]
 *     summary: Upsert course quiz settings
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               passingPercentage: { type: integer }
 *               timeLimit: { type: integer }
 *               maxAttempts: { type: integer }
 *               isPublished: { type: boolean }
 *               isEnabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Quiz saved
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update course quiz settings
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Quiz saved
 *
 * /api/admin/quizzes/{quizId}/questions:
 *   post:
 *     tags: [Admin Courses]
 *     summary: Add a quiz question
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, options, correctAnswer]
 *             properties:
 *               question: { type: string }
 *               imageUrl: { type: string }
 *               questionType: { type: string, enum: [textOptions, imageOptions] }
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     imageUrl: { type: string }
 *               correctAnswer: { type: integer }
 *               explanation: { type: string }
 *               marks: { type: number }
 *               order: { type: integer }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Question created
 *
 * /api/admin/quizzes/{quizId}/questions/reorder:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Reorder quiz questions
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionIds]
 *             properties:
 *               questionIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Questions reordered
 *
 * /api/admin/questions/{questionId}:
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update a quiz question
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Question updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete a quiz question
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Question deleted
 *
 * /api/courses/{courseId}/quiz:
 *   get:
 *     tags: [User Courses]
 *     summary: Get published quiz without answers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Quiz fetched, locked, or unavailable
 *
 * /api/courses/{courseId}/quiz/submit:
 *   post:
 *     tags: [User Courses]
 *     summary: Submit quiz answers and store a scored attempt
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         questionId: { type: string }
 *                         selectedIndex: { type: integer }
 *                   - type: array
 *                     items: { type: integer }
 *     responses:
 *       201:
 *         description: Quiz submitted
 *       400:
 *         description: Max attempts or validation error
 *       403:
 *         description: Course locked
 *
 * /api/courses/{courseId}/quiz/attempts:
 *   get:
 *     tags: [User Courses]
 *     summary: List the current user's quiz attempts
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attempts fetched
 *       403:
 *         description: Course locked
 *
 * /api/admin/courses/{courseId}/quiz/analytics:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Quiz analytics for a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Analytics fetched
 *
 * /api/admin/courses/{courseId}/quiz/attempts:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List quiz attempts for a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attempts fetched
 *
 * /api/admin/users/{userId}/quiz-attempts:
 *   get:
 *     tags: [Admin Users]
 *     summary: List all quiz attempts for a user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attempts fetched
 *
 * /api/admin/quiz-attempts/{attemptId}:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Get a quiz attempt with answers and results
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attempt fetched
 */

module.exports = {};
