import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Welcome a new member')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member to welcome')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Custom message')
                .setRequired(false)
                .setMaxLength(256)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const targetUser = interaction.options.getUser('user');
        const customMessage = interaction.options.getString('message') || 'Welcome to the server!';

        const embed = successEmbed(
            `👋 Welcome ${targetUser.username}!`,
            customMessage
        )
            .setColor('#00B050')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '📋 Member Count',
                    value: `You are member #${interaction.guild.memberCount}!`,
                    inline: true,
                },
                {
                    name: '🎯 Get Started',
                    value: 'Check the channels and say hello!',
                    inline: true,
                }
            )
            .setFooter({
                text: `Welcomed by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'welcome' })
};
