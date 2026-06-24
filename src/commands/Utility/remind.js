import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('Time (e.g., 10m, 1h, 30s)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Reminder message')
                .setRequired(true)
                .setMaxLength(256)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction, true);
        if (!deferred) return;

        const timeStr = interaction.options.getString('time');
        const message = interaction.options.getString('message');
        const userId = interaction.user.id;

        const timeRegex = /(\d+)([smh])/i;
        const match = timeStr.match(timeRegex);

        if (!match) {
            throw createError(
                'Invalid time format',
                ErrorTypes.VALIDATION,
                'Use format like: 30s, 10m, 1h',
                { provided: timeStr }
            );
        }

        let milliseconds = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        if (unit === 'm') milliseconds *= 60 * 1000;
        else if (unit === 'h') milliseconds *= 60 * 60 * 1000;
        else if (unit === 's') milliseconds *= 1000;

        if (milliseconds > 24 * 60 * 60 * 1000) {
            throw createError(
                'Time too long',
                ErrorTypes.VALIDATION,
                'Maximum is 24 hours',
                { provided: timeStr }
            );
        }

        setTimeout(() => {
            const user = client.users.cache.get(userId);
            if (user) {
                const reminderEmbed = warningEmbed(
                    '⏰ Reminder',
                    message
                ).setTimestamp();
                user.send({ embeds: [reminderEmbed] }).catch(() => {});
            }
        }, milliseconds);

        const embed = successEmbed(
            '✅ Reminder Set',
            `Reminder in **${timeStr}**: ${message}`
        );

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'remind' })
};
