// ─────────────────────────────────────────────
//  Handlers de cada subcomando
// ─────────────────────────────────────────────

import {
  crearPartida,
  unirsePartida,
  iniciarPartida,
  tirarTurno,
  guardarDados,
  anotarCombinacion,
  obtenerPartida,
  abandonarPartida,
} from '../game/session.js';

import {
  embedTurno,
  embedPlanillas,
  embedFinPartida,
  botonesGuardarDados,
  botonesAccion,
  menuCombinaciones,
} from '../utils/embeds.js';

// ─── /generala crear ─────────────────────────

export async function handleCrear(interaction) {
  const { channelId, user } = interaction;
  const partida = crearPartida(channelId, user.id);

  if (!partida) {
    return interaction.reply({
      content: '❌ Ya hay una partida en este canal. Usá `/generala abandonar` para terminarla.',
      ephemeral: true,
    });
  }

  // Guardar nombre del creador
  partida.jugadores[0].nombre = user.displayName ?? user.username;

  await interaction.reply({
    embeds: [{
      color: 0x5865F2,
      title: '🎲 Nueva partida de Generala',
      description: `**${partida.jugadores[0].nombre}** creó una partida.\n\nOtros jugadores pueden unirse con \`/generala unirse\`.\nCuando estén listos, el creador usa \`/generala iniciar\`.`,
      fields: [
        { name: 'Jugadores', value: partida.jugadores.map(j => `· ${j.nombre}`).join('\n'), inline: true },
        { name: 'Capacidad', value: '2 a 4 jugadores', inline: true },
      ],
    }],
  });
}

// ─── /generala unirse ────────────────────────

export async function handleUnirse(interaction) {
  const { channelId, user } = interaction;
  const nombre = user.displayName ?? user.username;
  const result = unirsePartida(channelId, user.id, nombre);

  if (!result.ok) {
    return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
  }

  const jugadoresList = result.partida.jugadores
    .map(j => `· ${j.nombre}`)
    .join('\n');

  await interaction.reply({
    embeds: [{
      color: 0x57F287,
      title: '✅ Jugador unido',
      description: `**${nombre}** se unió a la partida.`,
      fields: [
        { name: `Jugadores (${result.partida.jugadores.length}/4)`, value: jugadoresList },
      ],
    }],
  });
}

// ─── /generala iniciar ───────────────────────

export async function handleIniciar(interaction) {
  const { channelId, user } = interaction;
  const result = iniciarPartida(channelId, user.id);

  if (!result.ok) {
    return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
  }

  const { partida } = result;
  const jugadorActual = partida.jugadores[partida.turnoActual];

  await interaction.reply({
    content: `🎮 **¡La partida comenzó!** Juegan: ${partida.jugadores.map(j => j.nombre).join(', ')}\n\nEs el turno de **${jugadorActual.nombre}**.`,
    embeds: [embedTurno(partida)],
    components: [
      ...botonesGuardarDados(partida.dados, []),
      ...botonesAccion(partida.tiradas, []),
    ],
  });
}

// ─── /generala tirar ─────────────────────────

export async function handleTirar(interaction) {
  const { channelId, user } = interaction;
  const result = tirarTurno(channelId, user.id);

  if (!result.ok) {
    return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
  }

  const { partida } = result;

  await interaction.reply({
    embeds: [embedTurno(partida)],
    components: [
      ...botonesGuardarDados(partida.dados, partida.guardados),
      ...botonesAccion(partida.tiradas, partida.guardados),
    ],
  });
}

// ─── /generala planillas ─────────────────────

export async function handlePlanillas(interaction) {
  const partida = obtenerPartida(interaction.channelId);

  if (!partida) {
    return interaction.reply({ content: '❌ No hay partida activa en este canal.', ephemeral: true });
  }

  await interaction.reply({
    embeds: [embedPlanillas(partida.jugadores)],
    ephemeral: true,
  });
}

// ─── /generala abandonar ─────────────────────

export async function handleAbandonar(interaction) {
  const { channelId, user } = interaction;
  const partida = obtenerPartida(channelId);

  if (!partida) {
    return interaction.reply({ content: '❌ No hay partida activa en este canal.', ephemeral: true });
  }
  if (partida.creadorId !== user.id) {
    return interaction.reply({ content: '❌ Solo el creador puede abandonar la partida.', ephemeral: true });
  }

  abandonarPartida(channelId);
  await interaction.reply({ content: '🗑️ Partida cancelada.' });
}

// ─── Botones e interacciones ─────────────────

export async function handleButton(interaction) {
  const { channelId, user, customId } = interaction;
  const partida = obtenerPartida(channelId);

  if (!partida) {
    return interaction.reply({ content: '❌ No hay partida activa.', ephemeral: true });
  }

  // Guardar / soltar dado (dado_0 … dado_4)
  if (customId.startsWith('dado_')) {
    const idx = parseInt(customId.split('_')[1]);
    const jugadorActual = partida.jugadores[partida.turnoActual];
    if (jugadorActual.id !== user.id) {
      return interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });
    }

    // Toggle: si ya está guardado, soltarlo; si no, guardarlo
    const ya = partida.guardados.includes(idx);
    if (ya) {
      partida.guardados = partida.guardados.filter(i => i !== idx);
    } else {
      partida.guardados.push(idx);
    }

    await interaction.update({
      components: [
        ...botonesGuardarDados(partida.dados, partida.guardados),
        ...botonesAccion(partida.tiradas, partida.guardados),
      ],
    });
    return;
  }

  // Tirar de nuevo
  if (customId === 'tirar') {
    const result = tirarTurno(channelId, user.id);
    if (!result.ok) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }
    await interaction.update({
      embeds: [embedTurno(result.partida)],
      components: [
        ...botonesGuardarDados(result.partida.dados, []),
        ...botonesAccion(result.partida.tiradas, []),
      ],
    });
    return;
  }

  // Mostrar menú para anotar
  if (customId === 'anotar') {
    const jugadorActual = partida.jugadores[partida.turnoActual];
    if (jugadorActual.id !== user.id) {
      return interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });
    }
    await interaction.reply({
      content: '¿Qué combinación querés anotar?',
      components: menuCombinaciones(jugadorActual.planilla, partida.dados),
      ephemeral: true,
    });
    return;
  }

  // Ver planillas
  if (customId === 'planillas') {
    await interaction.reply({
      embeds: [embedPlanillas(partida.jugadores)],
      ephemeral: true,
    });
    return;
  }
}

// ─── Select menu ─────────────────────────────

export async function handleSelectMenu(interaction) {
  const { channelId, user, values } = interaction;
  const combinacion = values[0];

  const result = anotarCombinacion(channelId, user.id, combinacion);

  if (!result.ok) {
    return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
  }

  // Fin de partida
  if (result.fin) {
    await interaction.update({ content: '✅ Combinación anotada.', components: [] });
    await interaction.followUp({
      embeds: [embedFinPartida(result.ganador, result.jugadores)],
    });
    return;
  }

  const { partida, puntaje, combinacion: comb } = result;
  const jugadorSiguiente = partida.jugadores[partida.turnoActual];

  await interaction.update({ content: `✅ Anotaste **${comb}** por **${puntaje} pts**.`, components: [] });

  await interaction.followUp({
    content: `Turno de **${jugadorSiguiente.nombre}** 🎲`,
    embeds: [embedTurno(partida)],
    components: [
      ...botonesGuardarDados(partida.dados, []),
      ...botonesAccion(partida.tiradas, []),
    ],
  });
}
