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
        .setDescription('Give money to a user (Smarties only, no cost to giver)')
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
        )
        .addUserOption(option =>
            option
                .setName('recipient')
                .setDescription('Optional: Give money to yourself or another user')
                .setRequired(false)
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

        // Validate amount
        if (amount <= 0) {
            throw createError(
                'Invalid amount',
                ErrorTypes.VALIDATION,
                'Amount must be greater than 0!',
                { amount }
            );
        }

        // Get recipient data
        const recipientData = await getEconomyData(client, guildId, recipient.id);

        if (!recipientData) {
            throw createError(
                'Failed to load economy data',
                ErrorTypes.DATABASE,
                'Could not load recipient\'s economy data. Please try again later.',
                { guildId }
            );
        }

        // Add money to recipient WITHOUT deducting from giver
        recipientData.wallet = (recipientData.wallet || 0) + amount;

        // Save updated data
        await setEconomyData(client, guildId, recipient.id, recipientData);

        logger.info(`[ECONOMY_TRANSACTION] Admin give completed`, {
            from: interaction.user.id,
            to: recipient.id,
            amount,
            recipientNewBalance: recipientData.wallet,
            guildId,
            timestamp: new Date().toISOString()
        });

        const embed = successEmbed(
            '💸 Money Given',
            `${interaction.user.tag} gave **$${amount.toLocaleString()}** to ${recipient.tag}!`
        )
            .setColor('#00B050')
            .addFields(
                {
                    name: `${recipient.tag}'s New Balance`,
                    value: `$${recipientData.wallet.toLocaleString()}`,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Transaction completed (no cost to giver)',
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'give' })
};
