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
 *     description: Authenticates a user with email and password. Returns a JWT token valid for 1 day and user data without the password.
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
 *             example:
 *               success: true
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 _id: 665f1a2b3c4d5e6f7a8b9c0d
 *                 name: John Doe
 *                 email: john@example.com
 *                 hobbies: []
 *                 createdAt: 2026-07-02T12:00:00.000Z
 *                 updatedAt: 2026-07-02T12:00:00.000Z
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
 */

module.exports = {};
