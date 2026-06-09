/* =====================================================================
   js/modules/services/financiero.js — Lógica financiera pura
   Cálculos de libertad financiera, amortización y estrategias de pago.
   Sin efectos en el DOM.
   ===================================================================== */

/**
 * Calcula cuándo se terminarán de pagar todas las deudas activas.
 * @returns {{ meses, fecha, resumen }} | null si no hay deudas activas
 */
function calcularLibertad() {
  const activas = deudas.filter(d => !d.pagada && d.saldo > 0);
  if (!activas.length) return null;

  let maxMeses = 0;
  const resumen = [];

  activas.forEach(d => {
    const tasaMes = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
    let saldo = d.saldo, meses = 0, interesTotal = 0;
    while (saldo > 0 && meses < 600) {
      const interes = saldo * tasaMes;
      const capital = Math.min(d.cuota - interes, saldo);
      if (capital <= 0) { meses = 600; break; }
      interesTotal += interes;
      saldo = Math.max(0, saldo - capital);
      meses++;
    }
    if (meses > maxMeses) maxMeses = meses;
    resumen.push({ nombre: d.nombre, meses, interesTotal, saldo: d.saldo });
  });

  const fechaLibre = new Date();
  fechaLibre.setMonth(fechaLibre.getMonth() + maxMeses);
  return { meses: maxMeses, fecha: fechaLibre, resumen };
}

/**
 * Simula el pago de deudas con una función de ordenamiento y monto extra mensual.
 * Usado para comparar Avalancha vs Bola de Nieve.
 * @param {Function} ordenFn     — Función que ordena el array de deudas
 * @param {number}   extraMensual — Monto adicional para abonar al líder
 * @returns {{ meses, interesTotal, deudas, fechaFin }} | null
 */
function simularEstrategia(ordenFn, extraMensual) {
  const activas = deudas
    .filter(d => !d.pagada && d.saldo > 0 && d.cuota > 0)
    .map(d => ({ ...d, saldoSim: d.saldo, cuotasSim: 0, pagadaEnMes: null }));

  if (!activas.length) return null;

  let mesTotal = 0, interesTotal = 0;
  let cola = ordenFn([...activas]);

  while (cola.some(d => d.saldoSim > 0) && mesTotal < 600) {
    mesTotal++;
    cola.forEach(d => {
      if (d.saldoSim <= 0) return;
      const tm      = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
      const interes = d.saldoSim * tm;
      interesTotal += interes;
      const capital = Math.min(d.cuota - interes, d.saldoSim);
      if (capital <= 0) return;
      d.saldoSim = Math.max(0, d.saldoSim - capital);
      d.cuotasSim++;
      if (d.saldoSim === 0 && d.pagadaEnMes === null) d.pagadaEnMes = mesTotal;
    });

    // Re-ordenar para aplicar el extra al nuevo líder
    cola = ordenFn(cola.filter(d => d.saldoSim > 0)).concat(cola.filter(d => d.saldoSim === 0));
    if (extraMensual > 0) {
      const target = cola.find(d => d.saldoSim > 0);
      if (target) {
        target.saldoSim = Math.max(0, target.saldoSim - extraMensual);
        if (target.saldoSim === 0 && target.pagadaEnMes === null) target.pagadaEnMes = mesTotal;
      }
    }
  }

  const fechaFin = new Date();
  fechaFin.setMonth(fechaFin.getMonth() + mesTotal);
  return { meses: mesTotal, interesTotal, deudas: cola, fechaFin };
}

/** Ordena deudas por mayor tasa de interés primero (Avalancha) */
function ordenAvalanche(lista) {
  return [...lista].sort((a, b) => b.tasa - a.tasa);
}

/** Ordena deudas por menor saldo primero (Bola de Nieve) */
function ordenSnowball(lista) {
  return [...lista].sort((a, b) => a.saldoSim - b.saldoSim);
}
