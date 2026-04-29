// ─────────────────────────────────────────────
//  Gestor de partidas
//  Una partida por canal, múltiples canales
// ─────────────────────────────────────────────

import {
  tirarDados,
  crearPlanilla,
  planillaCompleta,
  totalPlanilla,
  esGeneralaServida,
  calcularPuntaje,
} from './engine.js';

// Map<canalId, Partida>
const partidas = new Map();

export function obtenerPartida(canalId) {
  return partidas.get(canalId) ?? null;
}

export function crearPartida(canalId, creadorId) {
  if (partidas.has(canalId)) return null; // ya hay una

  const partida = {
    canalId,
    estado: 'esperando', // esperando | jugando | terminada
    jugadores: [],       // [{ id, nombre, planilla }]
    turnoActual: 0,      // índice en jugadores[]
    dados: [],
    guardados: [],       // índices de dados guardados
    tiradas: 0,          // 0-3 por turno
    creadorId,
    generalaServida: false, // si el turno actual fue generala en 1ra tirada
  };

  partida.jugadores.push({
    id: creadorId,
    nombre: null, // se llena al unirse
    planilla: crearPlanilla(),
  });

  partidas.set(canalId, partida);
  return partida;
}

export function unirsePartida(canalId, userId, userName) {
  const partida = partidas.get(canalId);
  if (!partida) return { ok: false, error: 'No hay partida en este canal. Usá `/generala crear`.' };
  if (partida.estado !== 'esperando') return { ok: false, error: 'La partida ya comenzó.' };
  if (partida.jugadores.length >= 4) return { ok: false, error: 'La partida está llena (máximo 4 jugadores).' };
  if (partida.jugadores.some(j => j.id === userId)) return { ok: false, error: 'Ya estás en la partida.' };

  // Completar nombre del creador si falta
  partida.jugadores.forEach(j => {
    if (!j.nombre) j.nombre = userName; // solo pasa para el creador en la primera llamada
  });

  partida.jugadores.push({ id: userId, nombre: userName, planilla: crearPlanilla() });
  return { ok: true, partida };
}

export function iniciarPartida(canalId, userId) {
  const partida = partidas.get(canalId);
  if (!partida) return { ok: false, error: 'No hay partida en este canal.' };
  if (partida.creadorId !== userId) return { ok: false, error: 'Solo el creador puede iniciar la partida.' };
  if (partida.estado !== 'esperando') return { ok: false, error: 'La partida ya comenzó.' };
  if (partida.jugadores.length < 2) return { ok: false, error: 'Se necesitan al menos 2 jugadores.' };

  // Asegurarse que el creador tenga nombre
  const creador = partida.jugadores.find(j => j.id === userId);
  if (!creador.nombre) creador.nombre = 'Jugador';

  partida.estado = 'jugando';
  partida.dados = tirarDados(5);
  partida.tiradas = 1;
  partida.guardados = [];
  partida.generalaServida = esGeneralaServida(partida.dados);

  return { ok: true, partida };
}

export function tirarTurno(canalId, userId) {
  const partida = partidas.get(canalId);
  if (!partida) return { ok: false, error: 'No hay partida en este canal.' };
  if (partida.estado !== 'jugando') return { ok: false, error: 'La partida no está activa.' };

  const jugadorActual = partida.jugadores[partida.turnoActual];
  if (jugadorActual.id !== userId) return { ok: false, error: `No es tu turno. Es el turno de **${jugadorActual.nombre}**.` };
  if (partida.tiradas >= 3) return { ok: false, error: 'Ya usaste las 3 tiradas. Debés anotar una combinación.' };

  // Retira los dados no guardados
  const nuevos = tirarDados(5 - partida.guardados.length);
  let ni = 0;
  partida.dados = partida.dados.map((d, i) =>
    partida.guardados.includes(i) ? d : nuevos[ni++]
  );
  partida.tiradas++;
  partida.guardados = [];

  return { ok: true, partida };
}

export function guardarDados(canalId, userId, indices) {
  const partida = partidas.get(canalId);
  if (!partida) return { ok: false, error: 'No hay partida en este canal.' };

  const jugadorActual = partida.jugadores[partida.turnoActual];
  if (jugadorActual.id !== userId) return { ok: false, error: 'No es tu turno.' };
  if (partida.tiradas === 0 || partida.tiradas >= 3) return { ok: false, error: 'No podés guardar dados ahora.' };

  // indices: array de números 0-4
  partida.guardados = indices.filter(i => i >= 0 && i <= 4);
  return { ok: true, partida };
}

export function anotarCombinacion(canalId, userId, combinacion) {
  const partida = partidas.get(canalId);
  if (!partida) return { ok: false, error: 'No hay partida en este canal.' };
  if (partida.estado !== 'jugando') return { ok: false, error: 'La partida no está activa.' };

  const jugadorActual = partida.jugadores[partida.turnoActual];
  if (jugadorActual.id !== userId) return { ok: false, error: `No es tu turno. Es el turno de **${jugadorActual.nombre}**.` };
  if (partida.tiradas === 0) return { ok: false, error: 'Primero debés tirar los dados.' };
  if (jugadorActual.planilla[combinacion] !== undefined) return { ok: false, error: 'Ya anotaste esa combinación.' };

  let puntaje = calcularPuntaje(combinacion, partida.dados);

  // Generala servida: si fue en la primera tirada, vale el doble (100 pts)
  if (combinacion === 'GENERALA' && partida.generalaServida && partida.tiradas === 1) {
    puntaje = 100;
  }

  jugadorActual.planilla[combinacion] = puntaje;

  // ¿Terminó la partida?
  const todosCompletos = partida.jugadores.every(j => planillaCompleta(j.planilla));

  if (todosCompletos) {
    partida.estado = 'terminada';
    const ganador = partida.jugadores.reduce((a, b) =>
      totalPlanilla(a.planilla) >= totalPlanilla(b.planilla) ? a : b
    );
    partidas.delete(canalId);
    return { ok: true, fin: true, ganador, jugadores: partida.jugadores };
  }

  // Avanzar turno
  partida.turnoActual = (partida.turnoActual + 1) % partida.jugadores.length;
  partida.dados = tirarDados(5);
  partida.tiradas = 1;
  partida.guardados = [];
  partida.generalaServida = esGeneralaServida(partida.dados);

  return { ok: true, fin: false, partida, puntaje, combinacion };
}

export function abandonarPartida(canalId) {
  partidas.delete(canalId);
}
