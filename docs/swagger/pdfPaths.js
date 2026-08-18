/**
 * @openapi
 * /api/admin/courses/{courseId}/pdfs:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List course-level PDFs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDFs fetched, or empty list if none attached
 *   post:
 *     tags: [Admin Courses]
 *     summary: Upload a course-level PDF
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
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               kind: { type: string, enum: [book, vocabulary, notes, handout] }
 *               published: { type: boolean }
 *               order: { type: number }
 *     responses:
 *       201:
 *         description: PDF uploaded
 *       400:
 *         description: Invalid or non-PDF file
 *
 * /api/admin/chapters/{chapterId}/pdfs:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List chapter-level PDFs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDFs fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Upload a chapter-level PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               kind: { type: string, enum: [book, vocabulary, notes, handout] }
 *               published: { type: boolean }
 *               order: { type: number }
 *     responses:
 *       201:
 *         description: PDF uploaded
 *
 * /api/admin/videos/{videoId}/pdfs:
 *   get:
 *     tags: [Admin Courses]
 *     summary: List lecture-level PDFs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDFs fetched
 *   post:
 *     tags: [Admin Courses]
 *     summary: Upload a lecture-level PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               kind: { type: string, enum: [book, vocabulary, notes, handout] }
 *               published: { type: boolean }
 *               order: { type: number }
 *     responses:
 *       201:
 *         description: PDF uploaded
 *
 * /api/admin/pdfs/{pdfId}:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Get PDF metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF fetched
 *       404:
 *         description: PDF not found
 *   patch:
 *     tags: [Admin Courses]
 *     summary: Update PDF metadata and/or replace the file
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               kind: { type: string, enum: [book, vocabulary, notes, handout] }
 *               published: { type: boolean }
 *               order: { type: number }
 *     responses:
 *       200:
 *         description: PDF updated
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Delete PDF metadata and stored file
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF deleted
 *
 * /api/admin/pdfs/{pdfId}/download:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Download a stored PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *
 * /api/courses/{courseId}/pdfs:
 *   get:
 *     tags: [User Courses]
 *     summary: Course-level PDF metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF metadata, or pdf=null when none attached
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Course not found
 *
 * /api/courses/{courseId}/pdfs/{pdfId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Get a course-level PDF (access checked)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF metadata
 *       403:
 *         description: Premium subscription required
 *       404:
 *         description: Course or PDF not found
 *
 * /api/courses/{courseId}/pdfs/{pdfId}/download:
 *   get:
 *     tags: [User Courses]
 *     summary: Secure course PDF download
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Premium subscription required
 *       404:
 *         description: Course or PDF not found
 *
 * /api/courses/{courseId}/chapters/{chapterId}/pdfs:
 *   get:
 *     tags: [User Courses]
 *     summary: Chapter-level PDF metadata
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
 *         description: PDF metadata
 *
 * /api/courses/{courseId}/chapters/{chapterId}/pdfs/{pdfId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Get a chapter-level PDF (IDs must match)
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
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF metadata
 *       403:
 *         description: Premium subscription required
 *       404:
 *         description: Chapter or PDF not found
 *
 * /api/courses/{courseId}/chapters/{chapterId}/pdfs/{pdfId}/download:
 *   get:
 *     tags: [User Courses]
 *     summary: Secure chapter PDF download
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
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *
 * /api/videos/{videoId}/pdfs:
 *   get:
 *     tags: [User Courses]
 *     summary: Lecture-level PDF metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF metadata
 *
 * /api/videos/{videoId}/pdfs/{pdfId}:
 *   get:
 *     tags: [User Courses]
 *     summary: Get a lecture-level PDF (IDs must match)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF metadata
 *       403:
 *         description: Premium subscription required
 *
 * /api/videos/{videoId}/pdfs/{pdfId}/download:
 *   get:
 *     tags: [User Courses]
 *     summary: Secure lecture PDF download
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pdfId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binary
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Premium subscription required
 */

module.exports = {};
