// Express app factory. Exported so it can be imported by:
//   - server/index.js (local dev — listens on a port)
//   - api/index.js (Vercel serverless — wrapped as a function)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/cats', require('./routes/cats'));
app.use('/api/cats/:catId/foods', require('./routes/foodPreferences'));
app.use('/api/search', require('./routes/search'));
app.use('/api/products', require('./routes/products'));
app.use('/api/upload', require('./routes/upload'));

// In production (or when Vercel is serving static), serve the built React app.
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Centralised error handler so unhandled async errors return JSON, not HTML.
app.use((err, req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
