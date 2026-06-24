import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { infoEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const guild = interaction.guild;
        await guild.fetch().catch(() => {});

        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const roles = guild.roles.cache.size;

        const embed = infoEmbed(
            guild.name,
            `Complete overview of ${guild.name}`
        )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '🆔 Server ID',
                    value: guild.id,
                    inline: true,
                },
                {
                    name: '👥 Members',
                    value: `${guild.memberCount} members`,
                    inline: true,
                },
                {
                    name: '📅 Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: '💬 Text Channels',
                    value: `${textChannels} channels`,
                    inline: true,
                },
                {
                    name: '🔊 Voice Channels',
                    value: `${voiceChannels} channels`,
                    inline: true,
                },
                {
                    name: '🏷️ Roles',
                    value: `${roles} roles`,
                    inline: true,
                }
            )
            .setColor('#5865F2')
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'serverinfo' })
};
