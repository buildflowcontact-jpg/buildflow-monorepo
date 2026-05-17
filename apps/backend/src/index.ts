import Fastify from 'fastify';
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import jwt from '@fastify/jwt';
import { scheduleTypeDefs } from './types/schedule.types';
import { createScheduleResolvers } from './resolvers/schedule.resolver';

// ============================================================
// CONFIGURATION
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ============================================================
// SCHEMAS DE VALIDATION
// ============================================================

const CreateProjectEventSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(['TASK_CREATED', 'INCIDENT_REPORTED', 'DOCUMENT_UPLOADED', 'BUDGET_UPDATED']),
  description: z.string().optional(),
  blueprint_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

type CreateProjectEventInput = z.infer<typeof CreateProjectEventSchema>;

// ============================================================
// GraphQL
// ============================================================

const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  type ProjectEvent {
    id: ID!
    project_id: String!
    type: String!
    description: String
    blueprint_id: String
    metadata: JSON
    created_at: DateTime!
    created_by: String!
  }

  type Query {
    hello: String
    projectEvents(projectId: String!, limit: Int = 50, offset: Int = 0): [ProjectEvent]!
    projectEvent(id: String!): ProjectEvent
  }

  input CreateProjectEventInput {
    project_id: String!
    type: String!
    description: String
    blueprint_id: String
    metadata: JSON
  }

  type Mutation {
    createProjectEvent(input: CreateProjectEventInput!): ProjectEvent!
  }
`;

import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: value => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value: any) => new Date(value as string | number),
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  parseValue: value => value,
  serialize: value => value,
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return ast.value;
    if (ast.kind === Kind.OBJECT) return ast;
    return null;
  },
});

const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  Query: {
    hello: () => 'Hello from BuildFlow backend (production-ready)!',
    projectEvents: async (_: any, { projectId, limit, offset }: any, context: any) => {
      // Vérifier que l'utilisateur a accès au projet
      await context.verifyProjectAccess(projectId);

      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new Error(`Failed to fetch events: ${error.message}`);
      return data || [];
    },
    projectEvent: async (_: any, { id }: any, context: any) => {
      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Event not found: ${error.message}`);
      if (data) {
        await context.verifyProjectAccess(data.project_id);
      }
      return data;
    },
  },
  Mutation: {
    createProjectEvent: async (_: any, { input }: any, context: any) => {
      // Valider l'input
      const validated = CreateProjectEventSchema.parse(input);

      // Vérifier accès projet
      await context.verifyProjectAccess(validated.project_id);

      // Insérer l'événement
      const { data, error } = await supabase.from('project_events').insert({
        ...validated,
        created_by: context.userId,
      }).select().single();

      if (error) throw new Error(`Failed to create event: ${error.message}`);
      return data;
    },
  },
};

const scheduleResolvers = createScheduleResolvers(supabase);

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================

interface AuthContext {
  userId: string;
  userRole: string;
  verifyProjectAccess: (projectId: string) => Promise<void>;
}

async function createAuthContext(
  request: any,
  reply: any
): Promise<AuthContext> {
  try {
    // Vérifier le JWT
    await request.jwtVerify();
    const userId = request.user.sub;
    const userRole = request.user.role || 'viewer';

    return {
      userId,
      userRole,
      verifyProjectAccess: async (projectId: string) => {
        // Vérifier que l'user a accès au projet
        const { data, error } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          throw new Error('Unauthorized: no access to this project');
        }
      },
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

// ============================================================
// ERROR HANDLER
// ============================================================

class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

function errorFormatter(error: any) {
  console.error('GraphQL Error:', error);

  if (error.originalError instanceof AppError) {
    return {
      message: error.originalError.message,
      statusCode: error.originalError.statusCode,
      details: error.originalError.details,
    };
  }

  if (error.originalError instanceof z.ZodError) {
    return {
      message: 'Validation Error',
      statusCode: 400,
      details: error.originalError.errors,
    };
  }

  return {
    message: error.message,
    statusCode: 500,
  };
}

// ============================================================
// STARTUP
// ============================================================

async function start() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  });

  // Register JWT
  await fastify.register(jwt, {
    secret: jwtSecret,
  });

  // Apollo Server
  const apollo = new ApolloServer<AuthContext>({
    typeDefs: [typeDefs, scheduleTypeDefs],
    resolvers: {
      ...resolvers,
      Query: {
        ...resolvers.Query,
        ...scheduleResolvers.Query,
      },
      Mutation: {
        ...resolvers.Mutation,
        ...scheduleResolvers.Mutation,
      },
    },
    formatError: errorFormatter,
  });

  await apollo.start();

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // GraphQL endpoint with auth
  await fastify.register(fastifyApollo(apollo), {
    context: async (request, reply) => {
      try {
        return await createAuthContext(request, reply);
      } catch (error) {
        throw new AppError(401, 'Unauthorized', { error: (error as Error).message });
      }
    },
  });

  const PORT = process.env.PORT || 4000;
  await fastify.listen({ port: PORT as number, host: '0.0.0.0' });
  console.log(`✅ Backend running on http://localhost:${PORT}/graphql`);
}

start().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
