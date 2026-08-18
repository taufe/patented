/**
 * @openapi
 * /api/subscription/plans:
 *   get:
 *     tags: [Payments]
 *     summary: List subscription plans
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Plans fetched
 *
 * /api/payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: List payment methods and manual account details
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Methods fetched
 *
 * /api/payments/manual:
 *   post:
 *     tags: [Payments]
 *     summary: Submit a manual payment for admin review
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, method, transactionId]
 *             properties:
 *               plan: { type: string, example: Monthly }
 *               planId: { type: string, example: monthly }
 *               amount: { type: number, example: 2000 }
 *               currency: { type: string, example: PKR }
 *               method: { type: string, example: JazzCash }
 *               transactionId: { type: string, example: JZ123456 }
 *               senderPhone: { type: string, example: '03001234567' }
 *               proofUrl: { type: string, example: '' }
 *               note: { type: string, example: Paid via JazzCash }
 *     responses:
 *       201:
 *         description: Payment submitted as pending
 *
 * /api/payments/my:
 *   get:
 *     tags: [Payments]
 *     summary: List the current user's payments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payments fetched
 *
 * /api/admin/payments:
 *   get:
 *     tags: [Admin Payments]
 *     summary: List all manual payments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
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
 *         description: Payments fetched
 *
 * /api/admin/payments/{id}/review:
 *   patch:
 *     tags: [Admin Payments]
 *     summary: Approve or reject a pending payment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               note: { type: string, example: Verified }
 *     responses:
 *       200:
 *         description: Payment reviewed
 *
 * /api/me/device-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register or update an FCM device token
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, platform]
 *             properties:
 *               token: { type: string }
 *               platform: { type: string, enum: [ios, android] }
 *               device: { type: string, example: iPhone }
 *     responses:
 *       200:
 *         description: Token registered
 *   delete:
 *     tags: [Notifications]
 *     summary: Unregister an FCM device token (omit token to unregister all)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Token removed
 *
 * /api/me/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List in-app notifications for the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notifications fetched
 *
 * /api/me/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *
 * /api/admin/notifications:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: List sent notification campaigns
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Sent notifications fetched
 *
 * /api/admin/notifications/send:
 *   post:
 *     tags: [Admin Notifications]
 *     summary: Send an in-app notification and FCM push
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: New lecture published }
 *               body: { type: string, example: Chapter 2 is now available }
 *               audience: { type: string, enum: [all, premium, userIds], example: all }
 *               userIds:
 *                 type: array
 *                 items: { type: string }
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 example: { type: course, courseId: '665f1a2b3c4d5e6f7a8b9c0d' }
 *     responses:
 *       201:
 *         description: Notification sent
 */

module.exports = {};
