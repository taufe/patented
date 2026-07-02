/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665f1a2b3c4d5e6f7a8b9c0d
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         age:
 *           type: number
 *           minimum: 0
 *           example: 28
 *         hobbies:
 *           type: array
 *           items:
 *             type: string
 *           example: [reading, coding]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-07-02T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-07-02T12:00:00.000Z
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: secret123
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: secret123
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Validation failed
 *         error:
 *           type: string
 *           example: Detailed error message
 *
 *     RootResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Patented Backend API is running
 *
 *     HealthEnv:
 *       type: object
 *       properties:
 *         mongoUri:
 *           type: boolean
 *           example: true
 *         jwtSecret:
 *           type: boolean
 *           example: true
 *         nodeEnv:
 *           type: string
 *           example: production
 *         vercel:
 *           type: boolean
 *           example: true
 *         mongoUriLength:
 *           type: number
 *           example: 138
 *         mongoCluster:
 *           type: string
 *           example: cluster0.knwvqy6.mongodb.net
 *
 *     HealthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: API is healthy
 *         env:
 *           $ref: '#/components/schemas/HealthEnv'
 *
 *     HealthDbResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Database connected successfully
 *         cluster:
 *           type: string
 *           example: cluster0.knwvqy6.mongodb.net
 *
 *     RegisterSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: User registered successfully
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     LoginSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 */

module.exports = {};
