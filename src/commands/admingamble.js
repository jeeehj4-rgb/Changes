const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

/*
  /admingamble
  - Admin-only (enforced via defaultMemberPermissions + runtime check)
  - No cooldown
  - amount (integer) is required
  - Replace the economy placeholders (getBalance/removeBalance/addBalance) with your real DB/module
*/

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admingamble')
    .setDescription('Admin-only gamble command (no cooldown).')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of coins to gamble')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Only usable in a guild
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Runtime admin check (extra safety)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Only server administrators can use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    if (!Number.isInteger(amount) || amount <= 0) {
      return interaction.reply({ content: 'Please provide a valid amount greater than zero.', ephemeral: true });
    }

    const userId = interaction.user.id;

    // --------------------------
    // ECONOMY INTEGRATION POINT
    // Replace the three example functions below with your actual economy calls.
    // Example in-memory demo (NOT persistent):
    // const balances = global.__balances || (global.__balances = new Map());
    // const getBalance = async (id) => balances.get(id) ?? 0;
    // const removeBalance = async (id, n) => balances.set(id, (balances.get(id) ?? 0) - n);
    // const addBalance = async (id, n) => balances.set(id, (balances.get(id) ?? 0) + n);
    //
    // Replace with your DB / economy module calls (e.g., economy.getBalance(userId)).
    // --------------------------

    // Demo placeholders (safe defaults) - replace these:
    const balances = global.__balances || (global.__balances = new Map());
    const getBalance = async (id) => balances.get(id) ?? 0;
    const removeBalance = async (id, n) => balances.set(id, (balances.get(id) ?? 0) - n);
    const addBalance = async (id, n) => balances.set(id, (balances.get(id) ?? 0) + n);

    const current = await getBalance(userId);
    if (current < amount) {
      return interaction.reply({ content: `Insufficient balance. You have ${current} coins.`, ephemeral: true });
    }

    // Deduct the bet up front
    await removeBalance(userId, amount);

    // 50% chance to win; change probability or payout as you like
    const win = Math.random() < 0.5;
    let description;
    if (win) {
      // Payout equal to double the stake (net gain = amount)
      const payout = amount * 2;
      await addBalance(userId, payout);
      description = `You won! You bet ${amount} and received ${payout} coins (net +${amount}).`;
    } else {
      // Lost stake already removed
      description = `You lost ${amount} coins. Better luck next time.`;
    }

    const embed = new EmbedBuilder()
      .setTitle('Admin Gamble Result')
      .setDescription(description)
      .setColor(win ? 0x00FF00 : 0xFF0000)
      .setTimestamp()
      .setFooter({ text: `Balance: ${await getBalance(userId)}` });

    return interaction.reply({ embeds: [embed] });
  },
};
