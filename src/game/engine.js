// ─────────────────────────────────────────────
//  Motor del juego de la Generala
// ─────────────────────────────────────────────

export const COMBINACIONES = {
  UNOS:        { nombre: 'Unos',        desc: 'Suma de todos los 1' },
  DOSES:       { nombre: 'Doses',       desc: 'Suma de todos los 2' },
  TRESES:      { nombre: 'Treses',      desc: 'Suma de todos los 3' },
  CUATROS:     { nombre: 'Cuatros',     desc: 'Suma de todos los 4' },
  CINCOS:      { nombre: 'Cincos',      desc: 'Suma de todos los 5' },
  SEISES:      { nombre: 'Seises',      desc: 'Suma de todos los 6' },
  ESCALERA:    { nombre: 'Escalera',    desc: '1-2-3-4-5 o 2-3-4-5-6 → 20 pts' },
  FULL:        { nombre: 'Full',        desc: 'Par + Trío → 30 pts' },
  POKER:       { nombre: 'Póker',       desc: 'Cuatro iguales → 40 pts' },
  GENERALA:    { nombre: 'Generala',    desc: 'Cinco iguales → 50 pts' },
};

const EMOJIS_DADOS = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

// ─── Dados ───────────────────────────────────

export function tirarDados(cantidad = 5) {
  return Array.from({ length: cantidad }, () => Math.ceil(Math.random() * 6));
}

export function retiradarDados(dadosActuales, guardados, nuevos) {
  // guardados: array de índices (0-4) que se mantienen
  return dadosActuales.map((dado, i) =>
    guardados.includes(i) ? dado : nuevos.shift()
  );
}

export function formatearDados(dados, guardados = []) {
  return dados
    .map((d, i) => guardados.includes(i) ? `**${EMOJIS_DADOS[d]}**` : EMOJIS_DADOS[d])
    .join('  ');
}

// ─── Validación de combinaciones ─────────────

export function calcularPuntaje(combinacion, dados) {
  const conteo = Array(7).fill(0);
  dados.forEach(d => conteo[d]++);
  const valores = dados.reduce((a, b) => a + b, 0);
  const ordenados = [...dados].sort((a, b) => a - b);

  switch (combinacion) {
    case 'UNOS':    return conteo[1] * 1;
    case 'DOSES':   return conteo[2] * 2;
    case 'TRESES':  return conteo[3] * 3;
    case 'CUATROS': return conteo[4] * 4;
    case 'CINCOS':  return conteo[5] * 5;
    case 'SEISES':  return conteo[6] * 6;

    case 'ESCALERA': {
      const esEscalera =
        JSON.stringify(ordenados) === JSON.stringify([1,2,3,4,5]) ||
        JSON.stringify(ordenados) === JSON.stringify([2,3,4,5,6]);
      return esEscalera ? 20 : 0;
    }

    case 'FULL': {
      const tienePar  = conteo.some(c => c === 2);
      const tieneTrio = conteo.some(c => c === 3);
      return (tienePar && tieneTrio) ? 30 : 0;
    }

    case 'POKER': {
      return conteo.some(c => c >= 4) ? 40 : 0;
    }

    case 'GENERALA': {
      return conteo.some(c => c === 5) ? 50 : 0;
    }

    default: return 0;
  }
}

export function esGeneralaServida(dados) {
  const conteo = Array(7).fill(0);
  dados.forEach(d => conteo[d]++);
  return conteo.some(c => c === 5);
}

export function combinacionesDisponibles(planilla) {
  return Object.keys(COMBINACIONES).filter(k => planilla[k] === undefined);
}

export function puntajePosible(dados) {
  const posibles = {};
  for (const comb of Object.keys(COMBINACIONES)) {
    posibles[comb] = calcularPuntaje(comb, dados);
  }
  return posibles;
}

// ─── Planilla ────────────────────────────────

export function crearPlanilla() {
  const planilla = {};
  for (const k of Object.keys(COMBINACIONES)) {
    planilla[k] = undefined; // undefined = no anotada
  }
  return planilla;
}

export function totalPlanilla(planilla) {
  return Object.values(planilla)
    .filter(v => v !== undefined)
    .reduce((a, b) => a + b, 0);
}

export function planillaCompleta(planilla) {
  return Object.values(planilla).every(v => v !== undefined);
}

export function formatearPlanilla(planilla, nombre) {
  const filas = Object.entries(COMBINACIONES).map(([key, { nombre: n }]) => {
    const val = planilla[key];
    const pts = val === undefined ? '–' : val === 0 ? '✗' : `${val}`;
    return `\`${n.padEnd(12)}\` ${pts}`;
  });

  const total = totalPlanilla(planilla);
  const completa = planillaCompleta(planilla);

  return `**${nombre}**\n${filas.join('\n')}${completa ? `\n\n**Total: ${total} pts**` : `\n\n*Parcial: ${total} pts*`}`;
}
