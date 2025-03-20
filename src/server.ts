import express, { Application } from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define your GraphQL schema
const typeDefs = gql`
  type Goal {
    id: ID!
    name: String!
    description: String!
    date: String!
    color: String!
  }

  type Query {
    goals: [Goal]
  }

  type Mutation {
    createGoals(goals: [GoalInput!]!): [Goal]
  }

  input GoalInput {
    name: String!
    description: String!
    date: String!
    color: String!
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    goals: async () => {
      return await prisma.goal.findMany();
    },
  },
  Mutation: {
    createGoals: async (_: any, { goals }: { goals: Array<{ name: string, description: string, date: string, color: string }> }) => {
      // Use Promise.all to create multiple goals and return them
      const createdGoals = await Promise.all(
        goals.map((goal) =>
          prisma.goal.create({
            data: {
              name: goal.name,
              description: goal.description,
              date: new Date(goal.date),
              color: goal.color,
            },
          })
        )
      );
      return createdGoals;
    },
  },
};

// Create an Express app
const app: Application = express();

// Use CORS
app.use(cors());

// Set up Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start Apollo Server asynchronously
async function startServer() {
  await server.start(); // Await server start
  server.applyMiddleware({ app }); // Apply Apollo Server middleware

  // Start the Express app
  app.listen(4000, () => {
    console.log('Backend running on http://localhost:4000/graphql');
  });
}

// Call the startServer function to initiate Apollo Server
startServer().catch((err) => {
  console.error('Error starting server:', err);
});
