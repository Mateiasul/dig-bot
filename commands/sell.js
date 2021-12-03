
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('sell')
	.setDescription('Sell your precious rocks')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('The gif category')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The gif category')
            .setRequired(true)
            .addChoice('Dirt', 'dirt')
            .addChoice('Gold', 'gold')
            .addChoice('Diamonds', 'diamonds'))
};

