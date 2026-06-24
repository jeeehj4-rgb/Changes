import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Suggest a feature or improvement for the server')
        .addStringOption(option =>
            option
                .setName('suggestion')
                .setDescription('Your suggestion')
                .setRequired(true)
                .setMaxLength(1024)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction, true);
        if (!deferred) return;

        const suggestion = interaction.options.getString('suggestion');
        const guildId = interaction.guildId;

        let suggestionsChannel = interaction.guild.channels.cache.find(
            c => c.name === 'suggestions' && c.type === ChannelType.GuildText
        );

        if (!suggestionsChannel) {
            suggestionsChannel = await interaction.guild.channels.create({
                name: 'suggestions',
                type: ChannelType.GuildText,
                reason: 'Suggestions channel for suggest command',
            }).catch(() => null);
        }

        if (!suggestionsChannel) {
            throw createError(
                'Channel creation failed',
                ErrorTypes.DATABASE,
                'Could not create or find suggestions channel.',
                { guildId }
            );
        }

        const embed = successEmbed(
            '💡 New Suggestion',
            suggestion
        )
            .setColor('#FFD700')
            .addFields(
                {
                    name: 'Suggested by',
                    value: `${interaction.user.tag}`,
                    inline: true,
                },
                {
                    name: 'User ID',
                    value: interaction.user.id,
                    inline: true,
                }
            )
            .setTimestamp();

        const msg = await suggestionsChannel.send({ embeds: [embed] }).catch(() => null);

        if (msg) {
            await msg.react('👍').catch(() => {});
            await msg.react('👎').catch(() => {});
        }

        const confirmEmbed = successEmbed(
            '✅ Suggestion Submitted',
            `Your suggestion has been posted!`
        );

        await InteractionHelper.safeEditReply(interaction, { embeds: [confirmEmbed] });
    }, { command: 'suggest' })
};
