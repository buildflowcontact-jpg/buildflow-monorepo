import Fastify from 'fastify';
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';

const typeDefs = `#graphql
  scalar JSON

  type ProjectEvent {
    id: ID!
    project_id: String!
    type: String!
    description: String
    blueprint_id: String
    metadata: JSON
    created_at: String
  }

  type Query {
    hello: String
    projectEvents(projectId: String!): [ProjectEvent]
  }

  input CreateProjectEventInput {
    project_id: String!
    type: String!
    description: String
    blueprint_id: String
    metadata: JSON
  }

  type Mutation {
    createProjectEvent(input: CreateProjectEventInput!): ProjectEvent
  }
`;

import { GraphQLScalarType, Kind } from 'graphql';
import { randomUUID } from 'crypto';

// Simule une base en mémoire (à remplacer par la DB Supabase)
const events: any[] = [];

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
  JSON: JSONScalar,
  Query: {
    hello: () => 'Hello from BuildFlow backend!',
    projectEvents: (_: any, { projectId }: any) => events.filter(e => e.project_id === projectId),
  },
  Mutation: {
    createProjectEvent: (_: any, { input }: any) => {
      const event = {
        id: randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
      };
      events.push(event);
      return event;
    },
  },
};

async function start() {
  const fastify = Fastify();
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  await fastify.register(fastifyApollo(apollo));
  await fastify.listen({ port: 4000, host: '0.0.0.0' });
  console.log('🚀 Backend running on http://localhost:4000/graphql');
}

start();
