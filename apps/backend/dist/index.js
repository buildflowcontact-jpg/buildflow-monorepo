"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const server_1 = require("@apollo/server");
const fastify_2 = __importDefault(require("@as-integrations/fastify"));
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
const graphql_1 = require("graphql");
const crypto_1 = require("crypto");
// Simule une base en mémoire (à remplacer par la DB Supabase)
const events = [];
const JSONScalar = new graphql_1.GraphQLScalarType({
    name: 'JSON',
    description: 'Arbitrary JSON value',
    parseValue: value => value,
    serialize: value => value,
    parseLiteral(ast) {
        if (ast.kind === graphql_1.Kind.STRING)
            return ast.value;
        if (ast.kind === graphql_1.Kind.OBJECT)
            return ast;
        return null;
    },
});
const resolvers = {
    JSON: JSONScalar,
    Query: {
        hello: () => 'Hello from BuildFlow backend!',
        projectEvents: (_, { projectId }) => events.filter(e => e.project_id === projectId),
    },
    Mutation: {
        createProjectEvent: (_, { input }) => {
            const event = {
                id: (0, crypto_1.randomUUID)(),
                ...input,
                created_at: new Date().toISOString(),
            };
            events.push(event);
            return event;
        },
    },
};
async function start() {
    const fastify = (0, fastify_1.default)();
    const apollo = new server_1.ApolloServer({ typeDefs, resolvers });
    await apollo.start();
    await fastify.register((0, fastify_2.default)(apollo));
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('🚀 Backend running on http://localhost:4000/graphql');
}
start();
