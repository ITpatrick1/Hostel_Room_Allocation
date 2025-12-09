const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.NODE_ENV === 'test' ? ':memory:' : process.env.DB_NAME,
  process.env.NODE_ENV === 'test' ? undefined : process.env.DB_USER,
  process.env.NODE_ENV === 'test' ? undefined : process.env.DB_PASSWORD,
  {
    host: process.env.NODE_ENV === 'test' ? undefined : process.env.DB_HOST,
    port: process.env.NODE_ENV === 'test' ? undefined : process.env.DB_PORT || 3306,
    dialect: process.env.NODE_ENV === 'test' ? 'sqlite' : 'mysql',
    storage: process.env.NODE_ENV === 'test' ? ':memory:' : undefined,
    logging: false
  }
);

module.exports = sequelize;
