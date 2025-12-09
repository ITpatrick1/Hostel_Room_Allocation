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
      // eslint-disable-next-line no-console
      console.error('Database connection error:', err);
    });
}

module.exports = app;

