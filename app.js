const { Op } = require('sequelize');
const { Collection, Client, Formatters, Intents } = require('discord.js');
const { Users, CurrencyShop, UserItems } = require('./dbObjects.js');
const { token } = require('./config.json');
const chance = require("chance").Chance();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const currency = new Collection();
let itemNames = new Collection();
let itemWeights = new Collection();

Reflect.defineProperty(currency, 'add', {
	/* eslint-disable-next-line func-name-matching */
	value: async function add(id, amount) {
		const user = currency.get(id);

		if (user) {
			user.balance += Number(amount);
			return user.save();
		}

		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);

		return newUser;
	},
});

Reflect.defineProperty(currency, 'getBalance', {
	/* eslint-disable-next-line func-name-matching */
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
});


client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	console.log(storedBalances);
	storedBalances.forEach(b => currency.set(b.user_id, b));
	const items = await CurrencyShop.findAll();
	itemNames = items.map(a => a.name);
	itemWeights = items.map(a => a.dropRate);

	console.log(`Logged in as !`);
	console.log(`Logged in as !`,items);
});

// client.on('messageCreate', async message => {
// 	if (message.author.bot) return;
// 	currency.add(message.author.id, 1);
// });

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'balance') {
		const target = interaction.options.getUser('user') ?? interaction.user;
		return interaction.reply(`${target.tag} has ${currency.getBalance(target.id)}💰`);
	} else if (commandName === 'join') {
		const user = currency.get(interaction.user.id);
		if(user) {
			interaction.reply(`miner registered already`);
		} else {
			const newUser = await Users.create({ user_id: interaction.user.id, balance: 0 });
			currency.set(interaction.user.id, newUser);
			interaction.reply(`miner registered!`);
		}
	}
	 else if (commandName === 'dig') {
		const user = currency.get(interaction.user.id);
		if(!user) {
			interaction.reply(`please register first with /join`);
		} else {
			const res = chance.weighted(itemNames, itemWeights);
			let resultString;

			if (res === "dirt") {
				resultString = "" + res + "" + " 💩";
			  } else if (res === "diamonds") {
				resultString = "" + res + "" + " 💎";
			  } else {
				resultString = "" + res + "" + " 🏆";
			  }


			interaction.reply("You've uncovered some.... " + resultString);

			const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: res } } });
			
			const user = await Users.findOne({ where: { user_id: interaction.user.id } });
			await user.addItem(item);
		}
	} else if (commandName === 'inventory') {
		const target = interaction.options.getUser('user') ?? interaction.user;
		const user = await Users.findOne({ where: { user_id: target.id } });
		const items = await user.getItems();

		if (!items.length) return interaction.reply(`${target.tag} has nothing!`);

		interaction.reply(`${target.tag} currently has ${items.map(i => `${i.amount} ${i.item.name} ${i.item.emoji}`).join(', ')}`);
	} 
	else if (commandName === 'sell') {
		const target = interaction.options.getUser('user') ?? interaction.user;
		const transferAmount = interaction.options.getInteger('amount');
		const itemName = interaction.options.getString('category');
		const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });
			
		if (!item) return interaction.reply(`That item doesn't exist.`);

		const userItem = await UserItems.findOne({
			where: { user_id: interaction.user.id, item_id: item.id },
		});

		if (userItem.amount < transferAmount) {
			return interaction.reply(`Need more dirt`);
		}

		const user = await Users.findOne({ where: { user_id: target.id } });

		const totalValue = item.cost * transferAmount;

		currency.add(interaction.user.id, totalValue);


		await user.sellItem(item, transferAmount);

		return interaction.reply(`You've sold: ${transferAmount} ${item.name}.`);

	} 
});

client.login(token);