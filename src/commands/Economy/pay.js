import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, successEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Pay another user some of your cash')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to pay')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to pay')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
        const senderId = interaction.user.id;
        const receiver = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");
        const guildId = interaction.guildId;

        logger.debug(`[ECONOMY] Pay command initiated`, { 
            senderId, 
            receiverId: receiver.id,
            amount,
            guildId
        });

        // Validation checks
        if (receiver.bot) {
            throw createError(
                "Cannot pay bot",
                ErrorTypes.VALIDATION,
                "You cannot pay a bot.",
                { receiverId: receiver.id, isBot: true }
            );
        }
        
        if (receiver.id === senderId) {
            throw createError(
                "Cannot pay self",
                ErrorTypes.VALIDATION,
                "You cannot pay yourself.",
                { senderId, receiverId: receiver.id }
            );
        }
        
        if (amount <= 0) {
            throw createError(
                "Invalid payment amount",
                ErrorTypes.VALIDATION,
                "Amount must be greater than zero.",
                { amount, senderId }
            );
        }

        // Load both users' economy data
        const senderData = await getEconomyData(client, guildId, senderId);
        const receiverData = await getEconomyData(client, guildId, receiver.id);

        if (!senderData) {
            throw createError(
                "Failed to load sender economy data",
                ErrorTypes.DATABASE,
                "Failed to load your economy data. Please try again later.",
                { userId: senderId, guildId }
            );
        }
        
        if (!receiverData) {
            throw createError(
                "Failed to load receiver economy data",
                ErrorTypes.DATABASE,
                "Failed to load the receiver's economy data. Please try again later.",
                { userId: receiver.id, guildId }
            );
        }

        // Check if sender has enough money
        if ((senderData.wallet || 0) < amount) {
            throw createError(
                "Insufficient funds",
                ErrorTypes.VALIDATION,
                `You only have **$${(senderData.wallet || 0).toLocaleString()}** in cash, but you're trying to pay **$${amount.toLocaleString()}**.`,
                { required: amount, available: senderData.wallet || 0, senderId }
            );
        }

        // Process the payment
        senderData.wallet = (senderData.wallet || 0) - amount;
        receiverData.wallet = (receiverData.wallet || 0) + amount;

        // Save both users' data
        await setEconomyData(client, guildId, senderId, senderData);
        await setEconomyData(client, guildId, receiver.id, receiverData);

        logger.info(`[ECONOMY] Payment sent successfully`, {
            senderId,
            receiverId: receiver.id,
            amount,
            senderBalance: senderData.wallet,
            receiverBalance: receiverData.wallet,
            guildId,
            timestamp: new Date().toISOString()
        });

        // Send confirmation to payer
        const senderEmbed = successEmbed(
            '💸 Payment Sent',
            `You successfully paid **${receiver.username}** the amount of **$${amount.toLocaleString()}**!`
        )
            .addFields(
                {
                    name: "Payment Amount",
                    value: `$${amount.toLocaleString()}`,
                    inline: true,
                },
                {
                    name: "Your New Balance",
                    value: `$${senderData.wallet.toLocaleString()}`,
                    inline: true,
                }
            )
            .setColor('#00B050')
            .setFooter({
                text: `Paid to ${receiver.tag}`,
                iconURL: receiver.displayAvatarURL(),
            })
            .setTimestamp();

        await InteractionHelper.safeEditReply(interaction, { embeds: [senderEmbed] });

        // Try to DM the receiver
        try {
            const receiverEmbed = createEmbed({ 
                title: "💰 Incoming Payment!", 
                description: `${interaction.user.username} paid you **$${amount.toLocaleString()}**!` 
            })
                .addFields({
                    name: "Your New Balance",
                    value: `$${receiverData.wallet.toLocaleString()}`,
                    inline: true,
                })
                .setColor('#00B050')
                .setFooter({
                    text: 'Payment received',
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();
            
            await receiver.send({ embeds: [receiverEmbed] });
        } catch (e) {
            logger.warn(`Could not DM user ${receiver.id}: ${e.message}`);
        }
    }, { command: 'pay' })
};
