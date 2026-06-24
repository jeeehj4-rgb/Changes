import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot status and latency'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const botPing = Math.round(client.ws.ping);
        const apiLatency = Date.now() - interaction.createdTimestamp;

        let statusEmoji = '🟢';
        let status = 'Excellent';
        if (botPing > 150) {
            statusEmoji = '🟡';
            status = 'Good';
        }
        if (botPing > 300) {
            statusEmoji = '🔴';
            status = 'Poor';
        }

        const embed = successEmbed(
            `${statusEmoji} Bot Status: ${status}`,
            'Current bot performance metrics'
        )
            .setColor(botPing < 150 ? '#00B050' : botPing < 300 ? '#FFC000' : '#C00000')
            .addFields(
                {
                    name: '📡 Bot Ping',
                    value: `${botPing}ms`,
                    inline: true,
                },
                {
                    name: '⏱️ API Latency',
                    value: `${apiLatency}ms`,
                    inline: true,
                }
            )
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'ping' })
};
