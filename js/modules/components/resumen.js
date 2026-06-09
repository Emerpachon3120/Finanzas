/* =====================================================================
   js/modules/components/resumen.js — Vista de resumen general
   Métricas globales, distribución de ingresos, estado de deudas.
   ===================================================================== */

function renderResumen() {
  const ti        = totalIngresos();
  const tc        = totalCuotaActiva();
  const libre     = ti - tc;
  const pct       = Math.round(tc / ti * 100);
  const totalSaldo = deudas.filter(d => !d.pagada).reduce((a, d) => a + d.saldo, 0);
  const deudaMax  = deudas.reduce((mx, d) => Math.max(mx, d.saldo), 1);

  // Actualizar subtítulo del header
  document.getElementById('header-sub').textContent =
    `${MESES[mesActual.month]} ${mesActual.year} · ${deudas.filter(d => !d.pagada).length} obligaciones activas`;
  document.getElementById('header-date').textContent = `📅 ${MESES[mesActual.month]} ${mesActual.year}`;

  // Métricas principales
  document.getElementById('resumen-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Ingreso total</div><div class="metric-value green">${fmt(ti)}</div><div class="metric-sub">${sueldos.length} fuente(s)</div></div>
    <div class="metric"><div class="metric-label">Total deuda</div><div class="metric-value red">${fmt(totalSaldo)}</div><div class="metric-sub">${deudas.filter(d => !d.pagada).length} obligaciones</div></div>
    <div class="metric"><div class="metric-label">Cuota total</div><div class="metric-value" style="color:var(--warning);">${fmt(tc)}</div><div class="metric-sub">Mensual mínimo</div></div>
    <div class="metric"><div class="metric-label">Libre mensual</div><div class="metric-value ${libre >= 0 ? 'green' : 'red'}">${fmt(libre)}</div><div class="metric-sub">Para abonar extra</div></div>`;

  // Alerta de carga de deuda
  document.getElementById('resumen-alert').innerHTML = pct > 35
    ? `<strong>⚠ Atención:</strong> Tu carga de deuda mensual representa el <strong style="color:var(--warning);font-family:'JetBrains Mono',monospace;">${pct}%</strong> de tus ingresos. Lo recomendado es no superar el 35%. Considera aplicar la <strong>estrategia avalancha</strong> para reducir intereses.`
    : `<strong>✓ Bien manejado:</strong> Tu carga de deuda es del <strong style="color:var(--success);font-family:'JetBrains Mono',monospace;">${pct}%</strong> de tus ingresos. Estás dentro del límite recomendado del 35%.`;

  // Distribución de ingresos
  const ibEl = document.getElementById('income-breakdown');
  ibEl.innerHTML = '';
  sueldos.forEach(s => {
    ibEl.innerHTML += `<div class="income-row"><span>${s.nombre}</span><span class="green">${fmt(s.monto)}</span></div>`;
  });
  ibEl.innerHTML += `<div class="divider"></div>
    <div class="income-row total-row"><span>Total ingresos</span><span class="green">${fmt(ti)}</span></div>
    <div class="income-row"><span>Cuotas deudas</span><span class="red">−${fmt(tc)}</span></div>
    <div class="income-row total-row"><span>Sobrante</span><span class="${libre >= 0 ? 'green' : 'red'}">${fmt(libre)}</span></div>`;

  // Estado de deudas
  const activas = deudas.filter(d => !d.pagada).length;
  const pagadas = deudas.filter(d => d.pagada).length;
  document.getElementById('debt-status-summary').innerHTML = `
    <div class="income-row"><span>Deudas activas</span><span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--danger);">${activas}</span></div>
    <div class="income-row"><span>Deudas pagadas</span><span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--success);">${pagadas}</span></div>
    <div class="income-row"><span>Saldo total</span><span class="red">${fmt(totalSaldo)}</span></div>
    <div class="income-row"><span>Cuota mínima total</span><span class="amber">${fmt(tc)}</span></div>
    <div class="income-row"><span>Abonos realizados</span><span class="blue">${abonoHistorial.length}</span></div>
    <div class="income-row total-row"><span>% de ingresos</span><span class="${pct > 35 ? 'red' : 'green'}">${pct}%</span></div>`;

  // Barras de carga por deuda
  const sorted = [...deudas].filter(d => !d.pagada).sort((a, b) => b.tasa - a.tasa);
  const overviewEl = document.getElementById('debt-overview');
  overviewEl.innerHTML = '';
  sorted.forEach(d => {
    const pctW = Math.min(100, Math.round(d.saldo / deudaMax * 100));
    const col  = pctColor(d.tasa);
    overviewEl.innerHTML += `
    <div class="debt-bar-item">
      <div class="debt-bar-label">
        <span>${d.nombre}</span>
        <span class="debt-bar-rate" style="color:${col};">${d.tasa > 0 ? d.tasa + '% E.A.' : 'Sin interés'}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pctW}%;background:${col};"></div></div>
      <div class="debt-bar-sub">${fmt(d.saldo)} · ${d.cuotas} cuotas restantes</div>
    </div>`;
  });

  // Mini proyección de libertad financiera
  if (typeof renderLibertad === 'function') renderLibertad('resumen-libertad-content');
}
