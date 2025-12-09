require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const sequelize = require('./models/index');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Health check endpoints for Kubernetes
let dbHealthy = false;

app.get('/health', (_req, res) => {
  if (dbHealthy) {
    res.status(200).json({ status: 'ok', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

app.get('/ready', (_req, res) => {
  if (dbHealthy) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

// Metrics endpoint
let requestCount = 0;
let errorCount = 0;

app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{job="hostel-allocation"} ${requestCount}

# HELP http_errors_total Total HTTP errors
# TYPE http_errors_total counter
http_errors_total{job="hostel-allocation"} ${errorCount}

# HELP db_connection_status Database connection status (1=healthy, 0=unhealthy)
# TYPE db_connection_status gauge
db_connection_status ${dbHealthy ? 1 : 0}
`);
});

// Middleware to track requests
app.use((req, res, next) => {
  requestCount++;
  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode >= 400) {
      errorCount++;
    }
    return originalSend.call(this, data);
  };
  next();
});

// Root route
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '/../public/index.html'));
});

// API routes
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MySQL and sync tables
if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => {
      dbHealthy = true;
      // eslint-disable-next-line no-console
      console.log('MySQL connected');
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Tables synced');
      app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      dbHealthy = false;
      // eslint-disable-next-line no-console
      console.error('Database connection error:', err);
    });
}

module.exports = app;

