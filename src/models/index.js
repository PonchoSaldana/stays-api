const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.Student = require('./Student')(sequelize);
db.Company = require('./Company')(sequelize);

// Sync DB
db.sequelize.sync().then(() => {
    console.log('Database synced');
}).catch((err) => {
    console.error('Failed to sync db: ' + err.message);
});

module.exports = db;
