import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll for the community to vote on')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('The poll question')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('option1')
                .setDescription('First option')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('option2')
                .setDescription('Second option')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('option3')
                .setDescription('Third option (optional)')
        )
        .addStringOption(option =>
            option
                .setName('option4')
                .setDescription('Fourth option (optional)')
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const question = interaction.options.getString('question');
        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4')
        ].filter(opt => opt !== null);

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

        let description = `**${question}**\n\n`;
        options.forEach((opt, i) => {
            description += `${emojis[i]} ${opt}\n`;
        });

        const embed = successEmbed('📊 New Poll', description)
            .setColor('#5865F2')
            .setFooter({
                text: `Poll created by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        const msg = await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        
        if (msg && typeof msg.react === 'function') {
            for (let i = 0; i < options.length; i++) {
                await msg.react(emojis[i]).catch(() => {});
            }
        }
    }, { command: 'poll' })
};
