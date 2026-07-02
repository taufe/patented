const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Patented Backend API',
    version: '1.0.0',
    description: 'Complete API documentation for the Patented backend.',
  },
  servers: [
    {
      url: 'https://patented.vercel.app',
      description: 'Production (Vercel)',
    },
    {
      url: 'http://localhost:5001',
      description: 'Local development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    {
      name: 'General',
      description: 'General API endpoints',
    },
    {
      name: 'Health',
      description: 'Health and database connectivity checks',
    },
    {
      name: 'Authentication',
      description: 'User registration and login',
    },
  ],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../docs/swagger/schemas.js'),
    path.join(__dirname, '../docs/swagger/paths.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const mountSwagger = (app) => {
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'Patented Backend API Docs',
    })
  );
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  mountSwagger,
};
