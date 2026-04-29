// ─────────────────────────────────────────────
//  Script para registrar los comandos en Discord
//  Ejecutar una sola vez: npm run deploy
// ─────────────────────────────────────────────

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos slash...');

    // Si tenés GUILD_ID en .env, registra solo en ese servidor (instantáneo)
    // Si no, registra globalmente (puede tardar hasta 1 hora en propagarse)
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    const data = await rest.put(route, { body: commands });
    console.log(`✅ ${data.length} comando(s) registrado(s) exitosamente.`);

    if (process.env.GUILD_ID) {
      console.log('📌 Registrado en servidor específico (activo de inmediato).');
    } else {
      console.log('🌐 Registrado globalmente (puede tardar hasta 1 hora).');
    }
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
