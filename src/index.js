// ─────────────────────────────────────────────
//  Punto de entrada del bot
// ─────────────────────────────────────────────

import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';

import {
  handleCrear,
  handleUnirse,
  handleIniciar,
  handleTirar,
  handlePlanillas,
  handleAbandonar,
  handleButton,
  handleSelectMenu,
} from './commands/handlers.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ─── Listo ────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);
  console.log(`📡 Escuchando en ${c.guilds.cache.size} servidor(es)`);
});

// ─── Slash Commands ───────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Comandos slash
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== 'generala') return;

      const sub = interaction.options.getSubcommand();
      switch (sub) {
        case 'crear':    return await handleCrear(interaction);
        case 'unirse':   return await handleUnirse(interaction);
        case 'iniciar':  return await handleIniciar(interaction);
        case 'tirar':    return await handleTirar(interaction);
        case 'planillas':return await handlePlanillas(interaction);
        case 'abandonar':return await handleAbandonar(interaction);
      }
    }

    // Botones
    if (interaction.isButton()) {
      return await handleButton(interaction);
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {
      return await handleSelectMenu(interaction);
    }

  } catch (err) {
    console.error('Error en interacción:', err);
    const msg = '❌ Ocurrió un error. Intentá de nuevo.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// ─── Conectar ────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
