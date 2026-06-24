import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll the dice')
        .addIntegerOption(option =>
            option
                .setName('sides')
                .setDescription('Number of sides (default 6)')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const sides = interaction.options.getInteger('sides') || 6;
        const roll = Math.floor(Math.random() * sides) + 1;

        const embed = successEmbed(
            '🎲 Dice Roll',
            `You rolled a **${roll}** on a **${sides}**-sided die!`
        )
            .setColor('#FF6B6B')
            .setFooter({
                text: `Rolled by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'dice' })
};
