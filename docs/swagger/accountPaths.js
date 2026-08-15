/**
 * @openapi
 * /api/me:
 *   get:
 *     tags: [Profile]
 *     summary: Get current profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile fetched
 *   patch:
 *     tags: [Profile]
 *     summary: Update current profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/auth/change-password:
 *   patch:
 *     tags: [Authentication]
 *     summary: Change password while logged in
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 *
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Admin dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard fetched
 *
 * /api/admin/users:
 *   get:
 *     tags: [Admin Users]
 *     summary: List users
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, active, blocked] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Users fetched
 *
 * /api/admin/users/{userId}:
 *   get:
 *     tags: [Admin Users]
 *     summary: Get user detail
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User fetched
 *   delete:
 *     tags: [Admin Users]
 *     summary: Delete user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *
 * /api/admin/users/{userId}/block:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Block or unblock user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isBlocked]
 *             properties:
 *               isBlocked: { type: boolean }
 *     responses:
 *       200:
 *         description: Block status updated
 *
 * /api/admin/users/{userId}/course-access:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Unlock or lock a course for a user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, unlocked]
 *             properties:
 *               courseId: { type: string }
 *               unlocked: { type: boolean }
 *     responses:
 *       200:
 *         description: Course access updated
 *
 * /api/admin/courses/options:
 *   get:
 *     tags: [Admin Users]
 *     summary: Course options for unlock switches
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Course options fetched
 */

module.exports = {};
