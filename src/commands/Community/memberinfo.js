import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('memberinfo')
        .setDescription('Get information about a server member')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member to get info about')
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            throw new Error('Could not find member');
        }

        const roles = member.roles.cache
            .filter(r => r.name !== '@everyone')
            .map(r => r.toString())
            .join(', ') || 'None';

        const embed = infoEmbed(
            `${member.user.tag}`,
            `Information about this member`
        )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '👤 Username',
                    value: member.user.username,
                    inline: true,
                },
                {
                    name: '🆔 User ID',
                    value: member.user.id,
                    inline: true,
                },
                {
                    name: '📅 Account Created',
                    value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: '🎭 Joined Server',
                    value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: '⭐ Roles',
                    value: roles,
                    inline: false,
                },
                {
                    name: '🎮 Status',
                    value: member.presence?.status || 'offline',
                    inline: true,
                }
            )
            .setColor(member.displayColor || '#5865F2')
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'memberinfo' })
};
