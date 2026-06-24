import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('View someone avatar')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user')
                .setRequired(false)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = createEmbed(
            `${targetUser.tag} Avatar`,
            `View: [Open Avatar](${avatarURL})`
        )
            .setImage(avatarURL)
            .setColor('#5865F2')
            .setFooter({
                text: `User ID: ${targetUser.id}`,
            });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'avatar' })
};
