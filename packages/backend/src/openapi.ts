export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Kanban Board API',
    version: '1.0.0',
    description: 'REST API for reading the board and managing lanes and cards.',
  },
  servers: [
    {
      url: '/api',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
        },
      },
      Card: {
        type: 'object',
        required: ['id', 'lane_id', 'title', 'description', 'position', 'created_at', 'updated_at'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          lane_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          position: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Lane: {
        type: 'object',
        required: ['id', 'title', 'position', 'created_at', 'cards'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          position: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          cards: {
            type: 'array',
            items: { $ref: '#/components/schemas/Card' },
          },
        },
      },
      Board: {
        type: 'object',
        required: ['lanes'],
        properties: {
          lanes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Lane' },
          },
        },
      },
      CreateLaneRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
        },
      },
      UpdateLaneRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          position: { type: 'number' },
        },
      },
      CreateCardRequest: {
        type: 'object',
        required: ['lane_id', 'title'],
        properties: {
          lane_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
      UpdateCardRequest: {
        type: 'object',
        properties: {
          lane_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          position: { type: 'number' },
        },
      },
      LaneResponse: {
        type: 'object',
        required: ['lane'],
        properties: {
          lane: { $ref: '#/components/schemas/Lane' },
        },
      },
      CardResponse: {
        type: 'object',
        required: ['card'],
        properties: {
          card: { $ref: '#/components/schemas/Card' },
        },
      },
      OkResponse: {
        type: 'object',
        required: ['ok'],
        properties: {
          ok: { type: 'boolean' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    '/board': {
      get: {
        summary: 'Get the full board as JSON',
        responses: {
          '200': {
            description: 'Board payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Board' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/lanes': {
      get: {
        summary: 'List lanes with nested cards',
        responses: {
          '200': {
            description: 'Lane collection',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Board' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a lane',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateLaneRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created lane',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LaneResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/lanes/{id}': {
      get: {
        summary: 'Get a lane by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lane payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LaneResponse' },
              },
            },
          },
          '404': {
            description: 'Lane not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Update a lane',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateLaneRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated lane',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LaneResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Lane not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a lane',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lane deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OkResponse' },
              },
            },
          },
          '404': {
            description: 'Lane not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/cards': {
      get: {
        summary: 'List all cards',
        responses: {
          '200': {
            description: 'Card collection',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cards'],
                  properties: {
                    cards: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Card' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a card',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCardRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created card',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CardResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Lane not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/cards/{id}': {
      get: {
        summary: 'Get a card by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Card payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CardResponse' },
              },
            },
          },
          '404': {
            description: 'Card not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Update a card',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCardRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated card',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CardResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a card',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Card deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OkResponse' },
              },
            },
          },
          '404': {
            description: 'Card not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'Get the OpenAPI schema',
        security: [],
        responses: {
          '200': {
            description: 'OpenAPI document',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  },
} as const

