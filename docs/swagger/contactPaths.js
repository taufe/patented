/**
 * @openapi
 * /api/contact:
 *   get:
 *     tags: [Contact]
 *     summary: Get public contact details
 *     description: >
 *       Returns WhatsApp, phone, and email for the app contact screen.
 *       Public — a Bearer token is accepted but not required.
 *     responses:
 *       200:
 *         description: Contact fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactResponse'
 *             example:
 *               success: true
 *               contact:
 *                 whatsapp: '03159464767'
 *                 phone: '03159464767'
 *                 email: Sajidkhan56564@gmail.com
 *
 * /api/admin/contact:
 *   get:
 *     tags: [Admin Contact]
 *     summary: Load contact settings for the admin form
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Contact settings fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminContactResponse'
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin access required
 *   patch:
 *     tags: [Admin Contact]
 *     summary: Save contact settings
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactUpdateRequest'
 *           example:
 *             whatsapp: '03159464767'
 *             phone: '03159464767'
 *             email: Sajidkhan56564@gmail.com
 *     responses:
 *       200:
 *         description: Contact settings updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminContactResponse'
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin access required
 */
