// ─────────────────────────────────────────────
//  Definición de comandos slash
// ─────────────────────────────────────────────

import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('generala')
    .setDescription('Comandos del juego de la Generala')
    .addSubcommand(sub =>
      sub.setName('crear')
        .setDescription('Crear una nueva partida en este canal'))
    .addSubcommand(sub =>
      sub.setName('unirse')
        .setDescription('Unirse a la partida de este canal'))
    .addSubcommand(sub =>
      sub.setName('iniciar')
        .setDescription('Iniciar la partida (solo el creador)'))
    .addSubcommand(sub =>
      sub.setName('tirar')
        .setDescription('Tirar los dados en tu turno'))
    .addSubcommand(sub =>
      sub.setName('planillas')
        .setDescription('Ver las planillas de todos los jugadores'))
    .addSubcommand(sub =>
      sub.setName('abandonar')
        .setDescription('Terminar la partida actual (solo el creador)')),
].map(cmd => cmd.toJSON());
