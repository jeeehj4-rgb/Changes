import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// Helper function to check if user is admin
function isAdmin(member) {
    if (!member) return false;
    // Check for Administrator permission or Admin role
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    return member.roles.cache.some(role => role.name === 'Admin');
}

export default {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove money from a user (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to remove money from')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of money to remove')
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Remove from wallet or bank')
                .setRequired(false)
                .addChoices(
                    { name: 'Wallet', value: 'wallet' },
                    { name: 'Bank', value: 'bank' }
                )
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const admin = await interaction.guild.members.fetch(interaction.user.id);
        const isUserAdmin = isAdmin(admin);

        // Check if user is admin
        if (!isUserAdmin) {
            throw createError(
                'Permission denied',
                ErrorTypes.PERMISSION,
                'Only **Admins** can use this command!',
                { userId: interaction.user.id, guildId: interaction.guildId }
            );
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const moneyType = interaction.options.getString('type') || 'wallet';
        const guildId = interaction.guildId;

        // Check if targeting self
        if (targetUser.id === interaction.user.id) {
            throw createError(
                'Invalid operation',
                ErrorTypes.VALIDATION,
                'You cannot remove money from yourself!',
                { userId: interaction.user.id }
            );
        }

        // Get target user data
        const targetData = await getEconomyData(client, guildId, targetUser.id);

        if (!targetData) {
            throw createError(
                'Failed to load economy data',
                ErrorTypes.DATABASE,
                'Could not load economy data. Please try again later.',
                { guildId }
            );
        }

        // Determine which balance to remove from
        const currentBalance = moneyType === 'bank' ? (targetData.bank || 0) : (targetData.wallet || 0);

        if (currentBalance < amount) {
            throw createError(
                'Insufficient funds',
                ErrorTypes.VALIDATION,
                `${targetUser.tag} only has **$${currentBalance.toLocaleString()}** in their ${moneyType}, but you tried to remove **$${amount.toLocaleString()}**.`,
                { available: currentBalance, requested: amount }
            );
        }

        // Remove money
        if (moneyType === 'bank') {
            targetData.bank = (targetData.bank || 0) - amount;
        } else {
            targetData.wallet = (targetData.wallet || 0) - amount;
        }

        // Save updated data
        await setEconomyData(client, guildId, targetUser.id, targetData);

        logger.info(`[ECONOMY_TRANSACTION] Money removed`, {
            from: targetUser.id,
            removedBy: interaction.user.id,
            amount,
            moneyType,
            remainingBalance: moneyType === 'bank' ? targetData.bank : targetData.wallet,
            guildId,
            timestamp: new Date().toISOString()
        });

        const embed = successEmbed(
            '💸 Money Removed',
            `${interaction.user.tag} removed **$${amount.toLocaleString()}** from ${targetUser.tag}'s ${moneyType}!`
        )
            .setColor('#FF0000')
            .addFields(
                {
                    name: `${targetUser.tag}'s ${moneyType.charAt(0).toUpperCase() + moneyType.slice(1)}`,
                    value: `$${(moneyType === 'bank' ? targetData.bank : targetData.wallet).toLocaleString()}`,
                    inline: true,
                },
                {
                    name: 'Amount Removed',
                    value: `$${amount.toLocaleString()}`,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Transaction completed by admin',
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'remove' })
};
