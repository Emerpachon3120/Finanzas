/* =====================================================================
   js/modules/ui/charts.js — Renderizado de gráficas SVG
   Genera SVG inline de barras apiladas y líneas de tendencia.
   ===================================================================== */

/**
 * Renderiza un gráfico de barras apiladas en un contenedor.
 * @param {string} containerId  — ID del elemento donde insertar el SVG
 * @param {string[]} meses      — Etiquetas del eje X
 * @param {Object} categorias   — { nombre: [valores por mes] }
 * @param {string[]} colores    — Array de colores por categoría
 */
function svgBarChart(containerId, meses, categorias, colores) {
  const W = 560, H = 220, PAD = { t: 10, r: 10, b: 36, l: 56 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const cats = Object.keys(categorias);
  const nMeses = meses.length;
  if (!nMeses) return;

  const totales = meses.map((_, i) => cats.reduce((s, c) => s + (categorias[c][i] || 0), 0));
  const maxVal  = Math.max(...totales, 1);
  const barW    = Math.min(38, (cW / nMeses) * 0.65);
  const gap     = cW / nMeses;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y   = PAD.t + cH * (1 - f);
    const val = Math.round(maxVal * f);
    const label = val >= 1000000 ? (val/1000000).toFixed(1)+'M'
                : val >= 1000    ? (val/1000).toFixed(0)+'k'
                : val;
    return `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
            <text x="${PAD.l - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8" font-family="JetBrains Mono,monospace">${label}</text>`;
  }).join('');

  let bars = '';
  meses.forEach((mes, i) => {
    const x = PAD.l + gap * i + gap / 2 - barW / 2;
    let yOff = PAD.t + cH;
    cats.forEach((cat, ci) => {
      const v = categorias[cat][i] || 0;
      if (!v) return;
      const bH = (v / maxVal) * cH;
      yOff -= bH;
      bars += `<rect x="${x}" y="${yOff}" width="${barW}" height="${bH}" fill="${colores[ci]}" rx="2" opacity="0.85">
        <title>${cat}: ${fmt(v)}</title></rect>`;
    });
    bars += `<text x="${x + barW/2}" y="${H - PAD.b + 14}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="JetBrains Mono,monospace">${mes}</text>`;
  });

  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:320px;max-width:${W}px;display:block;">${gridLines}${bars}</svg>`;
}

/**
 * Renderiza un gráfico de líneas con área en un contenedor.
 * @param {string} containerId   — ID del elemento donde insertar el SVG
 * @param {string[]} meses       — Etiquetas del eje X
 * @param {Array}  series        — [{ nombre, valores: [...] }]
 * @param {string[]} colores     — Colores por serie
 */
function svgLineChart(containerId, meses, series, colores) {
  const W = 560, H = 200, PAD = { t: 10, r: 10, b: 36, l: 56 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const nPuntos = meses.length;
  if (!nPuntos) return;

  const allVals = series.flatMap(s => s.valores);
  const maxVal  = Math.max(...allVals, 1);
  const xPos    = i => PAD.l + (i / (nPuntos - 1)) * cW;
  const yPos    = v => PAD.t + cH * (1 - v / maxVal);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y   = PAD.t + cH * (1 - f);
    const val = Math.round(maxVal * f);
    const label = val >= 1000000 ? (val/1000000).toFixed(1)+'M'
                : val >= 1000    ? (val/1000).toFixed(0)+'k'
                : val;
    return `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
            <text x="${PAD.l - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8" font-family="JetBrains Mono,monospace">${label}</text>`;
  }).join('');

  const xLabels = meses.map((m, i) =>
    `<text x="${xPos(i)}" y="${H - PAD.b + 14}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="JetBrains Mono,monospace">${m}</text>`
  ).join('');

  let lines = '';
  series.forEach((s, si) => {
    const color = colores[si] || '#0ea5e9';
    let areaPath = `M${xPos(0)},${PAD.t + cH}`;
    s.valores.forEach((v, i) => { areaPath += ` L${xPos(i)},${yPos(v)}`; });
    areaPath += ` L${xPos(nPuntos - 1)},${PAD.t + cH} Z`;
    lines += `<path d="${areaPath}" fill="${color}" opacity="0.08"/>`;

    const linePath = s.valores.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yPos(v)}`).join(' ');
    lines += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;

    s.valores.forEach((v, i) => {
      lines += `<circle cx="${xPos(i)}" cy="${yPos(v)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"><title>${s.nombre}: ${fmt(v)}</title></circle>`;
    });
  });

  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:320px;max-width:${W}px;display:block;">${gridLines}${xLabels}${lines}</svg>`;
}
