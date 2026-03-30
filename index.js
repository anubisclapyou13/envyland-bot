const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const MC_HOST = 'ENVYLAND1.aternos.me';
const MC_PORT = 60636;

async function getServerStatus() {
  const apis = [
    `https://api.mcstatus.io/v2/status/bedrock/${MC_HOST}:${MC_PORT}`,
    `https://api.mcsrvstat.us/bedrock/3/${MC_HOST}:${MC_PORT}`,
  ];

  let lastError = null;

  for (const url of apis) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const data = await res.json();
      return data;
    } catch (err) {
      lastError = err;
      console.error(`Falló API ${url}:`, err.message);
    }
  }

  throw lastError;
}

client.once('clientReady', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: `🌍 ${MC_HOST}`, type: 0 }],
    status: 'online',
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  if (content === '!server') {
    const embed = new EmbedBuilder()
      .setTitle('🌍 Información del Servidor de Minecraft')
      .setColor(0x00b300)
      .addFields(
        { name: '🖥️ IP del Servidor', value: `\`${MC_HOST}\``, inline: false },
        { name: '🔌 Puerto', value: `\`${MC_PORT}\``, inline: false },
        { name: '📋 Plataforma', value: '`Bedrock Edition`', inline: true },
        { name: '🎮 Versión', value: '`1.26.10.4`', inline: true },
      )
      .setFooter({ text: '¡Únete y juega con nosotros!' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  if (content === '!status') {
    const loadingMsg = await message.reply('🔍 Consultando el estado del servidor...');

    try {
      const data = await getServerStatus();

      const isOnline = data.online ?? data.ip_address !== undefined;

      if (isOnline) {
        const online = data.players?.online ?? 0;
        const max = data.players?.max ?? 0;

        const statusEmbed = new EmbedBuilder()
          .setTitle('📡 Estado del Servidor')
          .setColor(0x00b300)
          .addFields(
            { name: '🟢 Estado', value: '`En línea`', inline: true },
            { name: '👥 Jugadores', value: `\`${online} / ${max}\``, inline: true },
            { name: '🖥️ IP', value: `\`${MC_HOST}\``, inline: false },
            { name: '🔌 Puerto', value: `\`${MC_PORT}\``, inline: true },
          )
          .setFooter({ text: '¡Únete y juega con nosotros!' })
          .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [statusEmbed] });
      } else {
        const offlineEmbed = new EmbedBuilder()
          .setTitle('📡 Estado del Servidor')
          .setColor(0xff0000)
          .addFields(
            { name: '🔴 Estado', value: '`Apagado`', inline: true },
            { name: '👥 Jugadores', value: '`0 / 0`', inline: true },
            { name: '🖥️ IP', value: `\`${MC_HOST}\``, inline: false },
            { name: '🔌 Puerto', value: `\`${MC_PORT}\``, inline: true },
          )
          .setFooter({ text: 'El servidor está apagado.' })
          .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [offlineEmbed] });
      }
    } catch (err) {
      console.error('Error final:', err.message);
      await loadingMsg.edit({ content: `❌ Error al consultar: \`${err.message}\`` });
    }
  }

  if (content === '!help') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('📖 Comandos disponibles')
      .setColor(0x0099ff)
      .addFields(
        { name: '`!server`', value: 'Muestra la información del servidor de Minecraft', inline: false },
        { name: '`!status`', value: 'Muestra si el servidor está encendido/apagado y la cantidad de jugadores', inline: false },
        { name: '`!help`', value: 'Muestra este mensaje de ayuda', inline: false },
      )
      .setFooter({ text: 'Bot de Minecraft — ENVYLAND' })
      .setTimestamp();

    await message.reply({ embeds: [helpEmbed] });
  }
});

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ ERROR: No se encontró el TOKEN en las variables de entorno.');
  process.exit(1);
}

client.login(TOKEN);
