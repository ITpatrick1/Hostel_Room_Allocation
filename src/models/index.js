const { Sequelize } = require('sequelize');

let sequelize;

// Test environment uses in-memory SQLite
if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize(':memory:', undefined, undefined, {
    dialect: 'sqlite',
    logging: false
  });
}
// Development can use SQLite or MySQL
else if (process.env.DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false
  });
}
// Production uses MySQL
else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );
}

module.exports = sequelize;
