import express, { Application } from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define your GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    description: String!
    goals: [Goal]  # Link goals to user
  }

  type Goal {
    id: ID!
    name: String!
    description: String!
    date: String!
    color: String!
    userId: String!
  }

  type Query {
    users: [User]  # Query to get all users along with their goals
    goals(userId: String!): [Goal]  # Query to get goals for a specific user
  }

  type Mutation {
    createUser(username: String!, email: String!): User
    createGoals(goals: [GoalInput!]!, userId: String!): [Goal]
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
    users: async () => {
      // Retrieve all users from the database
      return await prisma.user.findMany({
        include: {
          goals: true, // Include associated goals with each user
        },
      });
    },
    goals: async (_: any, { userId }: { userId: string }) => {
      // Fetch goals associated with a user
      return await prisma.goal.findMany({
        where: { userId: userId },
      }).then(goals => goals.map(goal => ({
        ...goal,
        date: goal.date.toISOString() // Format date
      })));
    },
  },
  Mutation: {
    createUser: async (_: any, { username, email }: { username: string, email: string }) => {
      // Create a new user in the database
      return await prisma.user.create({
        data: {
          username,
          email,
        },
      });
    },

    createGoals: async (_: any, { goals, userId }: { goals: Array<{ name: string, description: string, date: string, color: string }>, userId: string }) => {
      // Create multiple goals for a user
      const createdGoals = await Promise.all(
        goals.map((goal) =>
          prisma.goal.create({
            data: {
              name: goal.name,
              description: goal.description,
              date: new Date(goal.date),
              color: goal.color,
              userId: userId,  // Associate the goal with the user
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
  server.applyMiddleware({ app: app as any }); // Cast `app` as `any`

  // Start the Express app
  app.listen(4000, () => {
    console.log('Backend running on http://localhost:4000/graphql');
  });
}

// Call the startServer function to initiate Apollo Server
startServer().catch((err) => {
  console.error('Error starting server:', err);
});
