const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EditFlow API',
      version: '1.0.0',
      description:
        'A professional freelance marketplace connecting clients with editors and video professionals',
      contact: {
        name: 'API Support',
        email: 'support@EditFlow.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.EditFlow.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['client', 'editor', 'admin'],
              description: 'User role in the system',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            client_id: {
              type: 'integer',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            duration_minutes: {
              type: 'integer',
              nullable: true,
            },
            budget_min: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            budget_max: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['open', 'closed', 'in_progress'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Proposal: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            job_id: {
              type: 'integer',
            },
            editor_id: {
              type: 'integer',
            },
            cover_letter: {
              type: 'string',
            },
            proposed_price: {
              type: 'number',
              format: 'float',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            job_id: {
              type: 'integer',
            },
            proposal_id: {
              type: 'integer',
            },
            client_id: {
              type: 'integer',
            },
            editor_id: {
              type: 'integer',
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
