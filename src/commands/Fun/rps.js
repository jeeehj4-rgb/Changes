import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const CHOICES = ['rock', 'paper', 'scissors'];

export default {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play rock, paper, scissors')
        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    { name: 'Rock', value: 'rock' },
                    { name: 'Paper', value: 'paper' },
                    { name: 'Scissors', value: 'scissors' }
                )
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userChoice = interaction.options.getString('choice');
        const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

        let result = '';
        let color = '#5865F2';

        if (userChoice === botChoice) {
            result = 'Tie';
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win!';
            color = '#00B050';
        } else {
            result = 'Bot wins!';
            color = '#FF0000';
        }

        const embed = successEmbed(
            'Rock Paper Scissors',
            `**You:** ${userChoice}\n**Bot:** ${botChoice}\n\n**Result:** ${result}`
        )
            .setColor(color)
            .setFooter({
                text: `Played by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'rps' })
};
