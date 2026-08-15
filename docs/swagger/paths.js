/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: API root
 *     description: Returns a simple message confirming the Patented Backend API is running.
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RootResponse'
 *             example:
 *               message: Patented Backend API is running
 *
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Returns API health status and whether required environment variables are configured. Does not require a database connection.
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               success: true
 *               message: API is healthy
 *               env:
 *                 mongoUri: true
 *                 jwtSecret: true
 *                 nodeEnv: production
 *                 vercel: true
 *                 mongoUriLength: 138
 *                 mongoCluster: cluster0.knwvqy6.mongodb.net
 *
 * /api/health/db:
 *   get:
 *     tags:
 *       - Health
 *     summary: Database health check
 *     description: Attempts to connect to MongoDB and reports whether the database is reachable.
 *     responses:
 *       200:
 *         description: Database connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthDbResponse'
 *             example:
 *               success: true
 *               message: Database connected successfully
 *               cluster: cluster0.knwvqy6.mongodb.net
 *       500:
 *         description: Database connection failed or MONGO_URI is not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingEnv:
 *                 summary: MONGO_URI not configured
 *                 value:
 *                   success: false
 *                   message: MONGO_URI is not configured on the server
 *               connectionFailed:
 *                 summary: Database connection failed
 *                 value:
 *                   success: false
 *                   message: Database connection failed
 *                   error: Could not connect to any servers in your MongoDB Atlas cluster.
 *                   cluster: cluster0.knwvqy6.mongodb.net
 *
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account with a hashed password. Returns the created user without the password field.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             password: secret123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterSuccessResponse'
 *             example:
 *               success: true
 *               message: User registered successfully
 *               user:
 *                 _id: 665f1a2b3c4d5e6f7a8b9c0d
 *                 name: John Doe
 *                 email: john@example.com
 *                 hobbies: []
 *                 createdAt: 2026-07-02T12:00:00.000Z
 *                 updatedAt: 2026-07-02T12:00:00.000Z
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Please provide name, email, and password
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: User with this email already exists
 *       500:
 *         description: Server error during registration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Server error during registration
 *               error: Internal server error details
 *
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticates a user or admin with email and password. Returns a JWT (1 day) that includes id and role. Use user.role or the top-level role field to route Flutter to the User Dashboard or Admin Dashboard.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: john@example.com
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *             examples:
 *               userLogin:
 *                 summary: User login
 *                 value:
 *                   success: true
 *                   message: Login successful
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   role: user
 *                   user:
 *                     _id: 665f1a2b3c4d5e6f7a8b9c0d
 *                     name: Demo User
 *                     email: user@patented.app
 *                     hobbies: []
 *                     role: user
 *                     createdAt: 2026-07-02T12:00:00.000Z
 *                     updatedAt: 2026-07-02T12:00:00.000Z
 *               adminLogin:
 *                 summary: Admin login
 *                 value:
 *                   success: true
 *                   message: Login successful
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   role: admin
 *                   user:
 *                     _id: 665f1a2b3c4d5e6f7a8b9c0e
 *                     name: Demo Admin
 *                     email: admin@patented.app
 *                     hobbies: []
 *                     role: admin
 *                     createdAt: 2026-07-02T12:00:00.000Z
 *                     updatedAt: 2026-07-02T12:00:00.000Z
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Please provide email and password
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       500:
 *         description: Server error during login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Server error during login
 *               error: Internal server error details
 *
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset code
 *     description: Sends a 6-digit verification code to the user's email. Returns the same success response whether or not the email exists to prevent account enumeration. Resend requests are rate-limited to once every 60 seconds.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: john@example.com
 *     responses:
 *       200:
 *         description: Verification code sent (or generic success if email not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordSuccessResponse'
 *             example:
 *               success: true
 *               message: We've sent a verification code to your email.
 *               email: john@example.com
 *       400:
 *         description: Invalid or missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Resend cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Please wait 45 seconds before requesting a new code
 *       500:
 *         description: Server error or email delivery failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/auth/verify-reset-code:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify password reset code
 *     description: Verifies the 6-digit code sent to the user's email and returns a short-lived reset token for the final password reset step.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetCodeRequest'
 *           example:
 *             email: john@example.com
 *             code: '123456'
 *     responses:
 *       200:
 *         description: Verification code confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyResetCodeSuccessResponse'
 *             example:
 *               success: true
 *               message: Verification code confirmed
 *               email: john@example.com
 *               resetToken: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
 *       400:
 *         description: Invalid or expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid or expired verification code
 *       500:
 *         description: Server error during code verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Sets a new password using the reset token returned from the verify-reset-code endpoint. Password must be at least 6 characters and match confirmPassword.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             email: john@example.com
 *             resetToken: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
 *             password: newSecret123
 *             confirmPassword: newSecret123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetPasswordSuccessResponse'
 *             example:
 *               success: true
 *               message: Password reset successfully. You can now log in with your new password.
 *       400:
 *         description: Validation error or invalid/expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               passwordMismatch:
 *                 summary: Passwords do not match
 *                 value:
 *                   success: false
 *                   message: Passwords do not match
 *               invalidToken:
 *                 summary: Invalid or expired reset token
 *                 value:
 *                   success: false
 *                   message: Invalid or expired reset token
 *       500:
 *         description: Server error during password reset
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
