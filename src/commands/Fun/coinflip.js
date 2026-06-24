import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        const embed = successEmbed(
            '🪙 Coin Flip',
            `**${result}**!`
        )
            .setColor('#FFD700')
            .setFooter({
                text: `Flipped by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'coinflip' })
};
