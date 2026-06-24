import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// Helper function to check if user has Smarties role (ONLY Smarties)
function isSmarties(member) {
    if (!member) return false;
    // Only check for Smarties role, no admin/staff bypass
    return member.roles.cache.some(role => role.name === 'Smarties');
}

export default {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give money to another user (Smarties only)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to give money to')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of money to give')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const giver = await interaction.guild.members.fetch(interaction.user.id);
        const isSmatiesUser = isSmarties(giver);

        // Check if user has Smarties role (ONLY Smarties)
        if (!isSmatiesUser) {
            throw createError(
                'Permission denied',
                ErrorTypes.PERMISSION,
                'Only **Smarties** members can use this command!',
                { userId: interaction.user.id, guildId: interaction.guildId }
            );
        }

        const recipient = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;

        // Check if giving to self
        if (recipient.id === interaction.user.id) {
            throw createError(
                'Invalid transaction',
                ErrorTypes.VALIDATION,
                'You cannot give money to yourself!',
                { userId: interaction.user.id }
            );
        }

        // Get data for both users
        const giverData = await getEconomyData(client, guildId, interaction.user.id);
        const recipientData = await getEconomyData(client, guildId, recipient.id);

        if (!giverData || !recipientData) {
            throw createError(
                'Failed to load economy data',
                ErrorTypes.DATABASE,
                'Could not load economy data. Please try again later.',
                { guildId }
            );
        }

        // Transfer money without requiring giver to have funds
        // (Smarties can give money without using their own balance)
        recipientData.wallet = (recipientData.wallet || 0) + amount;

        // Save updated data (giver balance unchanged)
        await setEconomyData(client, guildId, recipient.id, recipientData);

        logger.info(`[ECONOMY_TRANSACTION] Money transferred`, {
            from: interaction.user.id,
            to: recipient.id,
            amount,
            giverBalance: giverData.wallet,
            recipientNewBalance: recipientData.wallet,
            guildId,
            timestamp: new Date().toISOString()
        });

        const embed = successEmbed(
            '💸 Money Transfer',
            `${interaction.user.tag} gave **$${amount.toLocaleString()}** to ${recipient.tag}!`
        )
            .setColor('#00B050')
            .addFields(
                {
                    name: `${interaction.user.tag}'s Balance`,
                    value: `$${giverData.wallet.toLocaleString()}`,
                    inline: true,
                },
                {
                    name: `${recipient.tag}'s Balance`,
                    value: `$${recipientData.wallet.toLocaleString()}`,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Transaction completed',
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'give' })
};
