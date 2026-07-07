/* =====================================================================
   js/modules/utils/helpers.js — Funciones utilitarias puras
   Sin efectos secundarios. No tocan el DOM ni el estado.
   ===================================================================== */

/** Genera un ID autoincremental único */
function g() {
  const usados = new Set([
    ...sueldos.map(x => x.id),
    ...deudas.map(x => x.id),
    ...abonoHistorial.map(x => x.id),
    ...Object.values(gastosPorMes).flat().map(x => x.id),
  ]);
  nextId++;
  while (usados.has(nextId)) nextId++;
  return nextId;
}

/** Construye la clave de mes a partir de un objeto {year, month} */
function mkKey(m) {
  return m.year + '-' + String(m.month + 1).padStart(2, '0');
}

/** Formatea un número como moneda COP */
function fmt(v) {
  return '$' + Math.round(v).toLocaleString('es-CO');
}

/** Formatea una clave "YYYY-MM" como "Enero 2025" */
function fmtKey(k) {
  const parts = k.split('-');
  return MESES[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

/**
 * Devuelve un color hex según la tasa de interés.
 * ≥40% → rojo | ≥20% → naranja | ≥10% → azul | <10% → verde
 */
function pctColor(t) {
  if (t >= 40) return '#ef4444';
  if (t >= 20) return '#f59e0b';
  if (t >= 10) return '#0ea5e9';
  return '#10b981';
}

/** Convierte meses a texto legible: "1a 3m" o "5 meses" */
function mesesATexto(m) {
  return m >= 12
    ? `${Math.floor(m / 12)}a ${m % 12}m`
    : `${m} mes${m !== 1 ? 'es' : ''}`;
}

/**
 * Limpia y parsea un valor monetario con formatos mixtos.
 * Maneja: "$800.000", "1.500.000", "10.50", "1500000"
 */
function parsearMonto(valor) {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  let s = String(valor).trim()
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(s) || 0;
}

// ── Agregaciones sobre el estado ─────────────────────────────────

/** Suma de todos los ingresos activos */
function totalIngresos() {
  const mes = mkKey(mesActual);
  return sueldos.reduce((a, s) => a + (estaRecibido(mes, s.id) ? s.monto : 0), 0);
}

/** Suma de las cuotas de deudas activas (no pagadas) */
function totalCuotaActiva() {
  return deudas
    .filter(d => !d.pagada)
    .reduce((a, d) => a + d.cuota, 0);
}

/**
 * Calcula cuánto dinero le queda disponible a una fuente específica
 * en el mes actual, restando todos los gastos ya registrados con esa fuente.
 */
function disponibleFuente(nombreFuente) {
  const sueldo = sueldos.find(s => s.nombre === nombreFuente);
  if (!sueldo) return 0;

  const mes = mkKey(mesActual);
  const gastado = (gastosPorMes[mes] || [])
    .filter(g => g.fuente === nombreFuente)
    .reduce((a, g) => a + g.monto, 0);

  return sueldo.monto - gastado;
}