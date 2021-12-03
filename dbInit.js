const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize
    .sync({ force })
    .then(async () => {
        const shop = [
            CurrencyShop.upsert({ name: 'dirt', cost: 1, dropRate: 0.89, emoji: '💩' }),
            CurrencyShop.upsert({ name: 'gold', cost: 2, dropRate: 0.1, emoji: '🏆' }),
            CurrencyShop.upsert({ name: 'diamonds', cost: 5, dropRate: 0.01, emoji: '💎' }),
        ];

        await Promise.all(shop);
        console.log('Database synced');

        sequelize.close();
    })
    .catch(console.error);
