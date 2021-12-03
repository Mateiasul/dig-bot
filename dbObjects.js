const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Reflect.defineProperty(Users.prototype, 'addItem', {
    /* eslint-disable-next-line func-name-matching */
    value: async function addItem(item) {
        const userItem = await UserItems.findOne({
            where: { user_id: this.user_id, item_id: item.id },
        });

        if (userItem) {
            userItem.amount += 1;
            return userItem.save();
        }

        return UserItems.create({
            user_id: this.user_id,
            item_id: item.id,
            amount: 1,
        });
    },
});

Reflect.defineProperty(Users.prototype, 'sellItem', {
    /* eslint-disable-next-line func-name-matching */
    value: async function sellItem(item, amount) {
        console.log(item, '111111111111111111111111111111111111111111111111111');
        console.log(amount, '111111111111111111111111111111111111111111111111111');
        console.log(this.user_id, 'this.user_idthis.user_idthis.user_idthis.user_id');

        const userItem = await UserItems.findOne({
            where: { user_id: this.user_id, item_id: item.id },
        });
        console.log(userItem, 'sellllllllllllllllllllllllllllllllllllllllllllllllllllllll');
        if (userItem) {
            userItem.amount -= amount;
            return userItem.save();
        }
    },
});

Reflect.defineProperty(Users.prototype, 'getItems', {
    /* eslint-disable-next-line func-name-matching */
    value: function getItems() {
        const res = UserItems.findAll({
            where: { user_id: this.user_id },
            include: ['item'],
        });
        if (res) {
            return res;
        }
        return [];
    },
});

module.exports = { Users, CurrencyShop, UserItems };
