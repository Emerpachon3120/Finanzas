/* =====================================================================
   js/modules/components/historial.js — Historial de gastos por mes
   Lista de meses con totales y detalle al seleccionar.
   ===================================================================== */

/** Calcula el total de ingresos de un mes específico (sueldos recibidos + ingresos extra) */
function totalIngresosDeMes(mes) {
  const sueldosRecibidos = sueldos.reduce((a, s) => a + (estaRecibido(mes, s.id) ? s.monto : 0), 0);
  const extras = (ingresosExtra[mes] || []).reduce((a, e) => a + e.monto, 0);
  return sueldosRecibidos + extras;
}

function renderHistorial() {
  const keys = Object.keys(gastosPorMes).sort().reverse();
  const el   = document.getElementById('historial-list');

  if (!keys.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📆</div>Sin meses registrados</div>';
    return;
  }

  el.innerHTML = '';
  keys.forEach(k => {
    const gastos = gastosPorMes[k];
    const total  = gastos.reduce((a, g) => a + g.monto, 0);
    const ti     = totalIngresosDeMes(k);
    const pct    = ti > 0 ? Math.round(total / ti * 100) : 0;
    const isActive = k === selectedHistorialMes;

    el.innerHTML += `
    <div class="month-row ${isActive ? 'active-month' : ''}" onclick="selectHistorialMes('${k}')">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:var(--text);">${fmtKey(k)}</div>
        <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${gastos.length} gastos · ${pct}% ingresos</div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:${pct > 80 ? 'var(--danger)' : 'var(--text)'};">${fmt(total)}</div>
    </div>`;
  });
}

function selectHistorialMes(k) {
  selectedHistorialMes = k;
  renderHistorial();

  const gastos  = gastosPorMes[k] || [];
  const total   = gastos.reduce((a, g) => a + g.monto, 0);
  const ti      = totalIngresosDeMes(k);

  // Totales por categoría
  const catTotals = {};
  gastos.forEach(g => { catTotals[g.categoria] = (catTotals[g.categoria] || 0) + g.monto; });

  const detEl = document.getElementById('historial-detail');
  detEl.innerHTML = `
    <div class="income-row"><span>Total gastado</span><span class="red">${fmt(total)}</span></div>
    <div class="income-row"><span>Ingresos del mes</span><span class="green">${fmt(ti)}</span></div>
    <div class="income-row"><span>Balance</span><span class="${ti - total >= 0 ? 'green' : 'red'}">${fmt(ti - total)}</span></div>
    <div class="divider"></div>
    ${Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) =>
      `<div class="income-row"><span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:2px;background:${catColors[cat] || '#94a3b8'};display:inline-block;"></span>${cat}</span><span style="font-family:'JetBrains Mono',monospace;font-weight:700;">${fmt(val)}</span></div>`
    ).join('')}`;

  // Tabla de gastos del mes
  const tblEl = document.getElementById('historial-gastos-table');
  if (!gastos.length) {
    tblEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>Sin gastos en este mes</div>';
    return;
  }
  tblEl.innerHTML = `<div class="table-scroll"><table class="expense-table">
    <thead><tr><th>Concepto</th><th>Categoría</th><th>Fuente</th><th>Monto</th><th>Nota</th></tr></thead>
    <tbody>
    ${gastos.map(g => {
      const col = catColors[g.categoria] || '#94a3b8';
      return `<tr>
        <td style="font-weight:600;color:var(--text);">${g.concepto}</td>
        <td><span class="badge" style="background:${col}18;color:${col};border:1px solid ${col}30;">${g.categoria}</span></td>
        <td style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${g.fuente}</td>
        <td style="font-weight:700;font-family:'JetBrains Mono',monospace;">${fmt(g.monto)}</td>
        <td style="font-size:11px;color:var(--text3);">${g.nota || '—'}</td>
      </tr>`;
    }).join('')}
    </tbody></table></div>`;
}