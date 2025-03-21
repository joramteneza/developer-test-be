"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Define your GraphQL schema
const typeDefs = (0, apollo_server_express_1.gql) `
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
        users: () => __awaiter(void 0, void 0, void 0, function* () {
            // Retrieve all users from the database
            return yield prisma.user.findMany({
                include: {
                    goals: true, // Include associated goals with each user
                },
            });
        }),
        goals: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { userId }) {
            // Fetch goals associated with a user
            return yield prisma.goal.findMany({
                where: { userId: userId },
            }).then(goals => goals.map(goal => (Object.assign(Object.assign({}, goal), { date: goal.date.toISOString() // Format date
             }))));
        }),
    },
    Mutation: {
        createUser: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { username, email }) {
            // Create a new user in the database
            return yield prisma.user.create({
                data: {
                    username,
                    email,
                },
            });
        }),
        createGoals: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { goals, userId }) {
            // Create multiple goals for a user
            const createdGoals = yield Promise.all(goals.map((goal) => prisma.goal.create({
                data: {
                    name: goal.name,
                    description: goal.description,
                    date: new Date(goal.date),
                    color: goal.color,
                    userId: userId, // Associate the goal with the user
                },
            })));
            return createdGoals;
        }),
    },
};
// Create an Express app
const app = (0, express_1.default)();
// Use CORS
app.use((0, cors_1.default)());
// Set up Apollo Server
const server = new apollo_server_express_1.ApolloServer({ typeDefs, resolvers });
// Start Apollo Server asynchronously
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield server.start(); // Await server start
        server.applyMiddleware({ app: app }); // Cast `app` as `any`
        // Start the Express app
        app.listen(4000, () => {
            console.log('Backend running on http://localhost:4000/graphql');
        });
    });
}
// Call the startServer function to initiate Apollo Server
startServer().catch((err) => {
    console.error('Error starting server:', err);
});
