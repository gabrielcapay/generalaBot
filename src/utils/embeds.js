// ─────────────────────────────────────────────
//  Constructores de embeds y botones
// ─────────────────────────────────────────────

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';

import {
  formatearDados,
  COMBINACIONES,
  combinacionesDisponibles,
  puntajePosible,
  totalPlanilla,
} from '../game/engine.js';

const COLOR_JUEGO   = 0x5865F2; // blurple de Discord
const COLOR_EXITO   = 0x57F287;
const COLOR_ALERTA  = 0xFEE75C;
const COLOR_FIN     = 0xEB459E;

// ─── Embed del turno actual ───────────────────

export function embedTurno(partida) {
  const jugador = partida.jugadores[partida.turnoActual];
  const tiradasRestantes = 3 - partida.tiradas;

  const embed = new EmbedBuilder()
    .setColor(COLOR_JUEGO)
    .setTitle(`🎲 Turno de ${jugador.nombre}`)
    .addFields(
      {
        name: 'Dados',
        value: formatearDados(partida.dados, partida.guardados) || '–',
        inline: false,
      },
      {
        name: 'Tiradas restantes',
        value: '🎲'.repeat(tiradasRestantes) || '✋ Sin tiradas',
        inline: true,
      },
      {
        name: 'Tirada nº',
        value: `${partida.tiradas} / 3`,
        inline: true,
      }
    );

  if (partida.generalaServida && partida.tiradas === 1) {
    embed.addFields({ name: '⭐ ¡Generala servida posible!', value: 'Si anotás Generala ahora vale 100 pts.' });
  }

  // Mostrar puntos posibles para esta tirada
  const posibles = puntajePosible(partida.dados);
  const disponibles = combinacionesDisponibles(jugador.planilla);
  const resumen = disponibles
    .filter(k => posibles[k] > 0)
    .map(k => `${COMBINACIONES[k].nombre}: **${posibles[k]}**`)
    .join(' · ') || '*Ninguna combinación posible con estos dados*';

  embed.addFields({ name: '📊 Podés anotar', value: resumen });

  return embed;
}

// ─── Embed de planillas ───────────────────────

export function embedPlanillas(jugadores) {
  const embed = new EmbedBuilder()
    .setColor(COLOR_ALERTA)
    .setTitle('📋 Planillas actuales');

  for (const j of jugadores) {
    const filas = Object.entries(COMBINACIONES)
      .map(([key, { nombre }]) => {
        const val = j.planilla[key];
        if (val === undefined) return `· ${nombre}: –`;
        if (val === 0) return `~~· ${nombre}~~: ✗`;
        return `· ${nombre}: **${val}**`;
      })
      .join('\n');

    embed.addFields({
      name: `${j.nombre} — ${totalPlanilla(j.planilla)} pts`,
      value: filas,
      inline: true,
    });
  }

  return embed;
}

// ─── Embed de fin de partida ──────────────────

export function embedFinPartida(ganador, jugadores) {
  const embed = new EmbedBuilder()
    .setColor(COLOR_FIN)
    .setTitle('🏆 ¡Partida terminada!')
    .setDescription(`El ganador es **${ganador.nombre}** con **${totalPlanilla(ganador.planilla)} puntos**!`);

  const tabla = jugadores
    .sort((a, b) => totalPlanilla(b.planilla) - totalPlanilla(a.planilla))
    .map((j, i) => `${i + 1}. **${j.nombre}** — ${totalPlanilla(j.planilla)} pts`)
    .join('\n');

  embed.addFields({ name: 'Clasificación final', value: tabla });

  return embed;
}

// ─── Botones de dados (guardar/soltar) ────────

export function botonesGuardarDados(dados, guardados) {
  const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
  const DADO = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];

  const botones = dados.map((d, i) =>
    new ButtonBuilder()
      .setCustomId(`dado_${i}`)
      .setLabel(`${DADO[d]} Dado ${i+1}`)
      .setEmoji(emojis[i])
      .setStyle(guardados.includes(i) ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // Dividir en filas de máximo 5
  return [new ActionRowBuilder().addComponents(...botones)];
}

// ─── Botones de acción del turno ──────────────

export function botonesAccion(tiradas, guardados) {
  const row = new ActionRowBuilder();

  if (tiradas < 3) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tirar')
        .setLabel('🎲 Tirar de nuevo')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(tiradas >= 3)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('anotar')
      .setLabel('📝 Anotar combinación')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('planillas')
      .setLabel('📋 Ver planillas')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

// ─── Select menu para elegir combinación ─────

export function menuCombinaciones(planilla, dados) {
  const disponibles = combinacionesDisponibles(planilla);
  const posibles = puntajePosible(dados);

  const opciones = disponibles.map(key => ({
    label: COMBINACIONES[key].nombre,
    description: `${COMBINACIONES[key].desc} → ${posibles[key] > 0 ? posibles[key] + ' pts' : '0 pts (tachar)'}`,
    value: key,
    emoji: posibles[key] > 0 ? '✅' : '❌',
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId('seleccionar_combinacion')
    .setPlaceholder('Elegí una combinación para anotar...')
    .addOptions(opciones);

  return [new ActionRowBuilder().addComponents(menu)];
}
