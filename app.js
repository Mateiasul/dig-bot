const { Op } = require('sequelize');
const { Collection, Client, Intents } = require('discord.js');
const { Users, CurrencyShop, UserItems } = require('./dbObjects.js');
const { token } = require('./config.json');
const chance = require('chance').Chance();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const currency = new Collection();
let itemNames = new Collection();
let itemWeights = new Collection();

Reflect.defineProperty(currency, 'getBalance', {
    value: function getBalance(id) {
        const user = currency.get(id);
        return user ? user.balance : 0;
    },
});

client.once('ready', async () => {
    const items = await CurrencyShop.findAll();
    itemNames = items.map((a) => a.name);
    itemWeights = items.map((a) => a.dropRate);

    console.log(`Logged in as !`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'balance') {
        const [user] = await Users.findOrCreate({
            where: { user_id: interaction.user.id },
            defaults: { balance: 0 },
        });

        return interaction.reply(`${interaction.user.tag} has ${user.balance}💰`);
    } else if (commandName === 'dig') {
        const res = chance.weighted(itemNames, itemWeights);
        let resultString;

        if (res === 'dirt') {
            resultString = '' + res + '' + ' 💩';
        } else if (res === 'diamonds') {
            resultString = '' + res + '' + ' 💎';
        } else {
            resultString = '' + res + '' + ' 🏆';
        }

        interaction.reply("You've uncovered some.... " + resultString);

        const item = await CurrencyShop.findOne({
            where: { name: { [Op.like]: res } },
        });

        const [user] = await Users.findOrCreate({
            where: { user_id: interaction.user.id },
            defaults: { balance: 0 },
        });
        await user.addItem(item);
    } else if (commandName === 'inventory') {
        const [user] = await Users.findOrCreate({
            where: { user_id: interaction.user.id },
            defaults: { balance: 0 },
        });

        const items = await user.getItems();

        if (!items.length) return interaction.reply(`${interaction.user.tag} has nothing!`);

        interaction.reply(
            `${interaction.user.tag} currently has ${items
                .map((i) => `${i.amount} ${i.item.name} ${i.item.emoji}`)
                .join(', ')}`
        );
    } else if (commandName === 'sell') {
        const [user, created] = await Users.findOrCreate({
            where: { user_id: interaction.user.id },
            defaults: { balance: 0 },
        });

        if (created) {
            return interaction.reply(`Got nothing to sell yet, try digging a couple... **/dig**`);
        }

        const transferAmount = interaction.options.getInteger('amount');
        const itemName = interaction.options.getString('category');

        const item = await CurrencyShop.findOne({
            where: { name: { [Op.like]: itemName } },
        });

        if (!item) return interaction.reply(`That item doesn't exist.`);

        const userItem = await UserItems.findOne({
            where: { user_id: interaction.user.id, item_id: item.id },
        });

        if (!userItem) {
            return interaction.reply(`Need more ${itemName}, try digging a bit **/dig**`);
        } else {
            if (userItem.amount < transferAmount) {
                return interaction.reply(`Need more ${itemName}, try digging a bit **/dig**`);
            }
        }

        const totalValue = item.cost * transferAmount;

        user.balance += transferAmount;
        user.save();

        await user.sellItem(item, totalValue);

        return interaction.reply(`You've sold: ${transferAmount} ${item.name}.`);
    }
});

client.login(token);
