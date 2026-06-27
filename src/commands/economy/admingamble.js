const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admingamble') // <- changed to /admingamble
    .setDescription('Admin-only gamble (no cooldown).')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to gamble (optional)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
    if (!isAdmin) {
      return interaction.reply({ content: 'You must be an administrator to use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount') ?? 100;
    if (amount <= 0) return interaction.reply({ content: 'Amount must be greater than 0.', ephemeral: true });

    const win = Math.random() < 0.5;
    const resultEmbed = new EmbedBuilder()
      .setTitle('Admin Gamble')
      .setColor(win ? 0x57F287 : 0xED4245)
      .setDescription(win
        ? `You gambled ${amount} and won! 🎉 (You receive ${amount * 2})`
        : `You gambled ${amount} and lost. 💀`);

    // Integrate with your economy system here if you have one

    await interaction.reply({ embeds: [resultEmbed] });
  },
};
