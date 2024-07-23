const express = require('express');
const path = require('path');
const { ApolloServer } = require('apollo-server-express');
const db = require('./config/connection');
const {expressMiddleware} = require('apollo-server-express');
// const routes = require('./routes');
const { typeDefs, resolvers } = require('./schemas');
const {authMiddleware} = require('./utils/auth');
const internal = require('stream');
const { debug } = require('console');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => 
    authMiddleware({req}),
    intropspection: true,
    playground: true,
    debug: true,
  
});

const startApolloServer = async () => {
  await server.start();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:3000',
    credentials: true
  }));
};

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => authMiddleware({ req }),
}));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API server running');
  }
  );
}


db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});

