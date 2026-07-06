/* =====================================================================
   js/modules/components/analisis.js — Dashboard de análisis financiero
   KPIs, tendencias, gastos, deudas, préstamos y abonos.
   ===================================================================== */

// ── Helper: dona SVG simple (sin depender de charts.js) ───────────

function _svgDonut(data, size = 160) {
  // data: [{ label, value, color }]
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">📊</div>Sin datos</div>`;

  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  let anguloAcum = -90;

  const segmentos = data.filter(d => d.value > 0).map(d => {
    const angulo = (d.value / total) * 360;
    const x1 = cx + r * Math.cos(anguloAcum * Math.PI / 180);
    const y1 = cy + r * Math.sin(anguloAcum * Math.PI / 180);
    anguloAcum += angulo;
    const x2 = cx + r * Math.cos(anguloAcum * Math.PI / 180);
    const y2 = cy + r * Math.sin(anguloAcum * Math.PI / 180);
    const largeArc = angulo > 180 ? 1 : 0;
    const pct = Math.round(d.value / total * 100);
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z" fill="${d.color}" opacity="0.9">
      <title>${d.label}: ${fmt(d.value)} (${pct}%)</title></path>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:${size}px;display:block;margin:0 auto;">
    ${segmentos}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="var(--bg)"/>
  </svg>`;
}

// ── Renderizado principal ─────────────────────────────────────────

function renderAnalisis() {
  renderDashKPIs();
  renderIngresosVsGastos();
  renderLibertad('libertad-detail');
  renderGastosCategoriaFuente();
  renderDashDeudas();
  renderProyeccionSaldos();
  renderDashPrestamos();
  renderDashAbonos();
}

// ── KPIs generales ─────────────────────────────────────────────────

function renderDashKPIs() {
  const ti = totalIngresos();
  const gastosMes = getGastosActuales().reduce((a, g) => a + g.monto, 0);
  const balance = ti - gastosMes;
  const deudaPendiente = deudas.filter(d => !d.pagada).reduce((a, d) => a + d.saldo, 0);
  const porCobrar = prestamos.filter(p => !p.pagado).reduce((a, p) => a + p.monto, 0);

  document.getElementById('dash-kpis').innerHTML = `
    <div class="metric"><div class="metric-label">Ingresos del mes</div><div class="metric-value green">${fmt(ti)}</div></div>
    <div class="metric"><div class="metric-label">Gastos del mes</div><div class="metric-value red">${fmt(gastosMes)}</div></div>
    <div class="metric"><div class="metric-label">Balance</div><div class="metric-value ${balance >= 0 ? 'green' : 'red'}">${fmt(balance)}</div></div>
    <div class="metric"><div class="metric-label">Deuda pendiente</div><div class="metric-value amber">${fmt(deudaPendiente)}</div></div>
    <div class="metric"><div class="metric-label">Por cobrar</div><div class="metric-value blue">${fmt(porCobrar)}</div></div>`;
}

// ── Ingresos vs Gastos (línea) ─────────────────────────────────────

function renderIngresosVsGastos() {
  const nMeses  = parseInt(document.getElementById('dash-meses-sel')?.value || 6);
  const mesKeys = Object.keys(gastosPorMes).sort().slice(-nMeses);
  if (!mesKeys.length) return;

  const labels = mesKeys.map(k => fmtKey(k).substring(0, 3) + ' ' + k.split('-')[0].slice(2));
  const valoresGastos = mesKeys.map(k => (gastosPorMes[k] || []).reduce((a, g) => a + g.monto, 0));
  const ti = totalIngresos();
  const valoresIngresos = mesKeys.map(() => ti); // ingreso mensual constante (aprox)

  const series = [
    { nombre: 'Ingresos', valores: valoresIngresos },
    { nombre: 'Gastos',   valores: valoresGastos },
  ];

  svgLineChart('chart-ingresos-gastos', labels, series, ['#10b981', '#ef4444']);

  document.getElementById('chart-ingresos-gastos-leyenda').innerHTML = `
    <div style="display:flex;align-items:center;gap:5px;"><div style="width:18px;height:3px;background:#10b981;border-radius:2px;"></div><span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">Ingresos</span></div>
    <div style="display:flex;align-items:center;gap:5px;"><div style="width:18px;height:3px;background:#ef4444;border-radius:2px;"></div><span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">Gastos</span></div>`;
}

// ── Gastos por categoría y por fuente ──────────────────────────────

function renderGastosCategoriaFuente() {
  const nMeses  = parseInt(document.getElementById('dash-meses-sel')?.value || 6);
  const mesKeys = Object.keys(gastosPorMes).sort().slice(-nMeses);
  const labels  = mesKeys.map(k => fmtKey(k).substring(0, 3) + ' ' + k.split('-')[0].slice(2));

  const cats = Object.keys(catColors);
  const dataCateg = {};
  cats.forEach(c => {
    dataCateg[c] = mesKeys.map(k => (gastosPorMes[k] || []).filter(g => g.categoria === c).reduce((a, g) => a + g.monto, 0));
  });

  const catsConDatos = cats.filter(c => dataCateg[c].some(v => v > 0));
  const coloresBar   = catsConDatos.map(c => catColors[c]);
  const dataFiltrada = {};
  catsConDatos.forEach(c => dataFiltrada[c] = dataCateg[c]);

  svgBarChart('chart-gastos-categorias', labels, dataFiltrada, coloresBar);

  const legEl = document.getElementById('chart-gastos-leyenda');
  if (legEl) legEl.innerHTML = catsConDatos.map((c, i) => `
    <div style="display:flex;align-items:center;gap:5px;">
      <div style="width:10px;height:10px;border-radius:2px;background:${coloresBar[i]};flex-shrink:0;"></div>
      <span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${c}</span>
    </div>`).join('');

  // Gastos por fuente (dona)
  const gastosMes = getGastosActuales();
  const porFuente = {};
  gastosMes.forEach(g => { porFuente[g.fuente] = (porFuente[g.fuente] || 0) + g.monto; });

  const coloresFuente = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
  const dataFuente = Object.entries(porFuente).map(([fuente, val], i) => ({
    label: fuente, value: val, color: coloresFuente[i % coloresFuente.length]
  }));

  const elFuente = document.getElementById('chart-gastos-fuente');
  if (elFuente) {
    elFuente.innerHTML = _svgDonut(dataFuente) + `
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;">
        ${dataFuente.map(d => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:2px;background:${d.color};"></span>${d.label}</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:700;">${fmt(d.value)}</span>
          </div>`).join('')}
      </div>`;
  }
}

// ── Deudas: por tasa + estado ───────────────────────────────────────

function renderDashDeudas() {
  const activas = deudas.filter(d => !d.pagada);
  const maxSaldo = activas.reduce((mx, d) => Math.max(mx, d.saldo), 1);

  const elTasa = document.getElementById('dash-deudas-tasa');
  if (elTasa) {
    if (!activas.length) {
      elTasa.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🎉</div>Sin deudas activas</div>`;
    } else {
      elTasa.innerHTML = activas
        .sort((a, b) => b.tasa - a.tasa)
        .map(d => {
          const pctW = Math.round(d.saldo / maxSaldo * 100);
          const col  = pctColor(d.tasa);
          return `<div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span style="font-weight:700;color:var(--text);">${d.nombre}</span>
              <span style="color:${col};font-family:'JetBrains Mono',monospace;font-weight:700;">${d.tasa > 0 ? d.tasa + '%' : 'Sin interés'}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pctW}%;background:${col};"></div></div>
          </div>`;
        }).join('');
    }
  }

  const elEstado = document.getElementById('dash-deudas-estado');
  if (elEstado) {
    const numActivas = deudas.filter(d => !d.pagada).length;
    const numPagadas = deudas.filter(d => d.pagada).length;
    const totalSaldo = deudas.filter(d => !d.pagada).reduce((a, d) => a + d.saldo, 0);

    elEstado.innerHTML = `
      <div class="income-row"><span>🔴 Activas</span><span style="font-weight:700;color:var(--danger);">${numActivas}</span></div>
      <div class="income-row"><span>🟢 Pagadas</span><span style="font-weight:700;color:var(--success);">${numPagadas}</span></div>
      <div class="income-row total-row"><span>Saldo total pendiente</span><span class="red">${fmt(totalSaldo)}</span></div>`;
  }
}

// ── Proyección de saldos ────────────────────────────────────────────

function renderProyeccionSaldos() {
  const tipo    = document.getElementById('proj-tipo-sel')?.value || 'total';
  const activas = deudas.filter(d => !d.pagada && d.saldo > 0);
  if (!activas.length) {
    const elP = document.getElementById('chart-proyeccion');
    if (elP) elP.innerHTML = `<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">✅</div>Sin deudas activas</div>`;
    return;
  }

  const maxMesesProj = Math.min(60, Math.max(...activas.map(d => {
    const tm = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
    let s = d.saldo, m = 0;
    while (s > 0 && m < 60) { s = Math.max(0, s - (d.cuota - s * tm)); m++; }
    return m;
  })));

  const mesesProj = Array.from({ length: maxMesesProj + 1 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i);
    return d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
  });

  let seriesProj, coloresProj;

  if (tipo === 'individual') {
    seriesProj = activas.map(d => {
      const tm = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
      let s = d.saldo;
      const vals = [s];
      for (let m = 0; m < maxMesesProj; m++) { s = Math.max(0, s - (d.cuota - s * tm)); vals.push(s); }
      return { nombre: d.nombre, valores: vals };
    });
    coloresProj = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#ef4444','#ec4899','#06b6d4'];
  } else {
    const vals = Array.from({ length: maxMesesProj + 1 }, (_, mi) =>
      activas.reduce((sum, d) => {
        const tm = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
        let s = d.saldo;
        for (let m = 0; m < mi; m++) s = Math.max(0, s - (d.cuota - s * tm));
        return sum + s;
      }, 0)
    );
    seriesProj  = [{ nombre: 'Saldo total', valores: vals }];
    coloresProj = ['#0ea5e9'];
  }

  svgLineChart('chart-proyeccion', mesesProj, seriesProj, coloresProj);

  const legPEl = document.getElementById('chart-proj-leyenda');
  if (legPEl) legPEl.innerHTML = seriesProj.map((s, i) => `
    <div style="display:flex;align-items:center;gap:5px;">
      <div style="width:18px;height:3px;border-radius:2px;background:${coloresProj[i]};flex-shrink:0;"></div>
      <span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${s.nombre}</span>
    </div>`).join('');
}

// ── Préstamos ────────────────────────────────────────────────────────

function renderDashPrestamos() {
  const cobrado   = prestamos.filter(p => p.pagado).reduce((a, p) => a + p.monto, 0);
  const pendiente = prestamos.filter(p => !p.pagado).reduce((a, p) => a + p.monto, 0);

  const elDona = document.getElementById('dash-prestamos-dona');
  if (elDona) {
    const data = [
      { label: 'Cobrado', value: cobrado, color: '#10b981' },
      { label: 'Pendiente', value: pendiente, color: '#f59e0b' },
    ];
    elDona.innerHTML = _svgDonut(data) + `
      <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:9px;height:9px;border-radius:2px;background:#10b981;"></span>Cobrado ${fmt(cobrado)}</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:9px;height:9px;border-radius:2px;background:#f59e0b;"></span>Pendiente ${fmt(pendiente)}</div>
      </div>`;
  }

  const elLista = document.getElementById('dash-prestamos-lista');
  if (elLista) {
    const ultimos = [...prestamos].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5);
    if (!ultimos.length) {
      elLista.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🤝</div>Sin préstamos registrados</div>`;
    } else {
      elLista.innerHTML = ultimos.map(p => `
        <div class="income-row">
          <span>${p.persona}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-family:'JetBrains Mono',monospace;font-weight:700;">${fmt(p.monto)}</span>
            ${p.pagado ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-warning">Pend.</span>'}
          </span>
        </div>`).join('');
    }
  }
}

// ── Abonos ───────────────────────────────────────────────────────────

function renderDashAbonos() {
  const total = abonoHistorial.reduce((a, ab) => a + ab.monto, 0);
  const numAbonos = abonoHistorial.length;

  document.getElementById('dash-abonos-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total abonado</div><div class="metric-value green">${fmt(total)}</div></div>
    <div class="metric"><div class="metric-label">N° de abonos</div><div class="metric-value">${numAbonos}</div></div>`;

  const elLista = document.getElementById('dash-abonos-lista');
  if (elLista) {
    const ultimos = [...abonoHistorial].slice(0, 5);
    if (!ultimos.length) {
      elLista.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">💸</div>Sin abonos registrados</div>`;
    } else {
      elLista.innerHTML = ultimos.map(a => `
        <div class="income-row">
          <span>${a.deudaNombre || a.deuda}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--success);">${fmt(a.monto)}</span>
        </div>`).join('');
    }
  }
}