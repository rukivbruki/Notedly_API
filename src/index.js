const express = require('express');
require('dotenv').config();
const models = require('./models');
const db = require('./db');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { ApolloServer } = require('apollo-server-express');

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(helmet());
app.use(cors());

const getUser = (token) => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      new Error('Session invalid');
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: async ({ req }) => {
    // Получаем из заголовков токен пользователя
    const token = req.headers.authorization;
    // Пробуем извлечь пользователя с помощью токена
    const user = await getUser(token);
    // Добавляем модели БД и пользователя в контекст
    return { models, user };
  },
});

db.connect(DB_HOST);

(async () => {
  await server.start();
  server.applyMiddleware({ app, path: '/api' });
})();

app.listen({ port }, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
  )
);
