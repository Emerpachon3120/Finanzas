/* =====================================================================
   js/modules/components/analisis.js — Análisis financiero con gráficas
   Libertad financiera, gastos por categoría, proyección de saldos.
   ===================================================================== */

// ── Proyección de libertad financiera ────────────────────────────

function renderLibertad(contenedorId) {
  const el   = document.getElementById(contenedorId);
  if (!el) return;
  const ti   = totalIngresos();
  const tc   = totalCuotaActiva();
  const info = calcularLibertad();

  if (!info) {
    el.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🎉</div>¡No tienes deudas activas!</div>`;
    return;
  }
  if (info.meses >= 600) {
    el.innerHTML = `<div class="alert-box">⚠ Alguna cuota no cubre los intereses. Revisa tus tasas y montos.</div>`;
    return;
  }

  const mesesStr = info.meses >= 12
    ? `${Math.floor(info.meses / 12)} año(s) y ${info.meses % 12} mes(es)`
    : `${info.meses} mes(es)`;
  const fechaStr          = info.fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
  const interesTotalGlobal = info.resumen.reduce((a, r) => a + r.interesTotal, 0);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">
      <div class="metric" style="border-color:rgba(16,185,129,0.3);">
        <div class="metric-label">Fecha estimada</div>
        <div style="font-size:14px;font-weight:800;color:var(--success);font-family:'JetBrains Mono',monospace;margin-top:4px;">${fechaStr}</div>
        <div class="metric-sub">${mesesStr}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Intereses totales</div>
        <div class="metric-value red">${fmt(interesTotalGlobal)}</div>
        <div class="metric-sub">Costo financiero</div>
      </div>
      <div class="metric">
        <div class="metric-label">Se liberará</div>
        <div class="metric-value green">${fmt(tc)}</div>
        <div class="metric-sub">Mensual adicional</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">PLAZO POR DEUDA</div>
    ${info.resumen.sort((a, b) => b.meses - a.meses).map(r => {
      const pct = Math.round(r.meses / info.meses * 100);
      return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
          <span style="font-weight:700;color:var(--text);">${r.nombre}</span>
          <span style="font-family:'JetBrains Mono',monospace;color:var(--text2);">${r.meses >= 12 ? Math.floor(r.meses/12)+'a '+r.meses%12+'m' : r.meses+'m'}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--success);"></div></div>
      </div>`;
    }).join('')}`;
}

// ── Vista de análisis completa ────────────────────────────────────

function renderAnalisis() {
  renderLibertad('libertad-detail');
  renderLibertad('resumen-libertad-content');

  const nMeses  = parseInt(document.getElementById('chart-meses-sel')?.value || 6);
  const mesKeys = Object.keys(gastosPorMes).sort().slice(-nMeses);
  const labels  = mesKeys.map(k => fmtKey(k).substring(0, 3) + ' ' + k.split('-')[0].slice(2));

  const cats    = Object.keys(catColors);
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
      <span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${c}</span>
    </div>`).join('');

  // ── Proyección de saldos ────────────────────────────────────
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
