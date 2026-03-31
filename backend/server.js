require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const { errorHandler, HttpError } = require('./middleware/errorHandler');

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'devmate-api' });
});

app.use('/api', routes);

app.use((req, res, next) => {
  next(new HttpError(404, `Not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DevMate API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
