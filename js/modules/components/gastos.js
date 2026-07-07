/* =====================================================================
   js/modules/components/gastos.js — Gestión de gastos mensuales
   ===================================================================== */

function setGastoFilter(type, val, el) {
  if (type === 'cat') {
    gastoFilterCat = val;
    document.querySelectorAll('#fc-todas').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.filter-row .filter-chip').forEach(c => {
      if (c.id === 'fc-todas' || c.id === 'ff-todas') return;
      c.classList.remove('active');
    });
    el.classList.add('active');
  } else {
    gastoFilterFuente = val;
    document.getElementById('ff-todas').classList.remove('active');
    document.querySelectorAll('#fuente-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    if (val === 'todas') document.getElementById('ff-todas').classList.add('active');
  }
  renderGastos();
}

function setGastoFilterSelect(type, val) {
  gastoFilterCat = val;
  renderGastos();
}

function sortGastos(field) {
  if (gSortField === field) gSortDir *= -1;
  else { gSortField = field; gSortDir = 1; }
  document.querySelectorAll('.expense-table th').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.getAttribute('onclick') && th.getAttribute('onclick').includes(field)) {
      th.classList.add(gSortDir === 1 ? 'sort-asc' : 'sort-desc');
    }
  });
  renderGastos();
}

function getGastosActuales() {
  return gastosPorMes[mkKey(mesActual)] || [];
}

function renderGastos() {
  const key = mkKey(mesActual);
  document.getElementById('mes-actual-label').textContent = `${MESES[mesActual.month]} ${mesActual.year}`;

  let gastos = [...getGastosActuales()];
  const search = (document.getElementById('gasto-search')?.value || '').toLowerCase();
  const sort   = document.getElementById('gastos-sort')?.value || 'fecha-desc';

  if (gastoFilterCat    !== 'todas') gastos = gastos.filter(g => g.categoria === gastoFilterCat);
  if (gastoFilterFuente !== 'todas') gastos = gastos.filter(g => g.fuente === gastoFilterFuente);
  if (search) gastos = gastos.filter(g => g.concepto.toLowerCase().includes(search) || (g.nota || '').toLowerCase().includes(search));

  if (gSortField) {
    gastos.sort((a, b) => {
      let va = a[gSortField], vb = b[gSortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return va < vb ? -gSortDir : va > vb ? gSortDir : 0;
    });
  } else {
    if (sort === 'fecha-desc') gastos.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    else if (sort === 'fecha-asc') gastos.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    else if (sort === 'monto-desc') gastos.sort((a, b) => b.monto - a.monto);
    else if (sort === 'monto-asc')  gastos.sort((a, b) => a.monto - b.monto);
    else if (sort === 'cat')        gastos.sort((a, b) => a.categoria.localeCompare(b.categoria));
  }

  const allGastos  = getGastosActuales();
  const total      = allGastos.reduce((a, g) => a + g.monto, 0);
  const ti         = totalIngresos();
  const disponible = ti - total;
  const pct        = Math.min(100, Math.round(total / ti * 100));

  document.getElementById('total-gastado').textContent = fmt(total);
  const dispEl = document.getElementById('disponible-gastos');
  dispEl.textContent = fmt(disponible);
  dispEl.className   = 'metric-value ' + (disponible >= 0 ? 'green' : 'red');
  document.getElementById('pct-usado').textContent = pct + '%';
  document.getElementById('num-gastos').textContent = allGastos.length;

  const catTotals = {};
    allGastos.forEach(g => { catTotals[g.categoria] = (catTotals[g.categoria] || 0) + g.monto; });
    const barEl = document.getElementById('cat-bar');
    const legEl = document.getElementById('cat-legend');
    barEl.innerHTML = ''; legEl.innerHTML = '';

    const catsOrdenadas = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCats  = catsOrdenadas.slice(0, 4);
    const restoCats = catsOrdenadas.slice(4);

    catsOrdenadas.forEach(([cat, val]) => {
      const w   = Math.round(val / total * 100);
      const col = catColors[cat] || '#94a3b8';
      barEl.innerHTML += `<div class="bar-seg" style="width:${w}%;background:${col};" title="${cat}: ${fmt(val)}"></div>`;
    });

    topCats.forEach(([cat, val]) => {
      const col = catColors[cat] || '#94a3b8';
      legEl.innerHTML += `<span class="legend-item"><span class="legend-dot" style="background:${col};"></span>${cat} ${fmt(val)}</span>`;
    });

    if (restoCats.length) {
      const dotsHtml = restoCats.map(([cat, val]) => {
        const col = catColors[cat] || '#94a3b8';
        return `<span style="width:8px;height:8px;border-radius:2px;background:${col};display:inline-block;" title="${cat}: ${fmt(val)}"></span>`;
      }).join('');
      legEl.innerHTML += `<span class="legend-item" style="display:flex;align-items:center;gap:3px;">+${restoCats.length} más ${dotsHtml}</span>`;
    }

  const tbody = document.getElementById('gastos-body');
  tbody.innerHTML = '';
  if (!gastos.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🔍</div>Sin resultados para este filtro</div></td></tr>';
    renderFrecuentes();
    return;
  }
  gastos.forEach(g => {
      const col = catColors[g.categoria] || '#94a3b8';
      tbody.innerHTML += `<tr>
        <td>
          <div style="font-weight:700;color:var(--text);font-size:13px;">${g.concepto}</div>
          <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${g.fuente}</div>
        </td>
        <td><span class="badge" style="background:${col}18;color:${col};border:1px solid ${col}30;">${g.categoria}</span></td>
        <td style="font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--text);">${fmt(g.monto)}</td>
        <td style="font-size:11px;color:var(--text3);">${g.nota || '—'}</td>
        <td>
          <button class="btn-edit" onclick="editGasto(${g.id})">✏</button>
          <button class="btn-delete" onclick="deleteGasto(${g.id})">×</button>
        </td>
      </tr>`;
    });
  renderFrecuentes();
}

function cambiarMes(dir) {
  mesActual.month += dir;
  if (mesActual.month > 11) { mesActual.month = 0; mesActual.year++; }
  if (mesActual.month < 0)  { mesActual.month = 11; mesActual.year--; }
  populateFuenteSelects();
  renderGastos();
}

function agregarGasto() {
  const c    = document.getElementById('g-concepto').value.trim();
  const m    = parseFloat(document.getElementById('g-monto').value);
  const cat  = document.getElementById('g-categoria').value;
  const fue  = document.getElementById('g-fuente').value;
  const nota = document.getElementById('g-nota').value.trim();
  if (!c || !m) { showToast('Completa concepto y monto', 'danger'); return; }

  const key    = mkKey(mesActual);
  if (!gastosPorMes[key]) gastosPorMes[key] = [];
  const nuevo = { id: g(), concepto: c, monto: m, categoria: cat, fuente: fue, nota, ts: Date.now(), mes: key };
  gastosPorMes[key].push(nuevo);
  fbGuardarGasto(nuevo);

  document.getElementById('g-concepto').value = '';
  document.getElementById('g-monto').value    = '';
  document.getElementById('g-nota').value     = '';
  renderGastos();
  showToast(`Gasto "${c}" agregado ✓`, 'success');
}

function deleteGasto(id) {
  const key = mkKey(mesActual);
  gastosPorMes[key] = (gastosPorMes[key] || []).filter(g => g.id !== id);
  fbEliminarGasto(id);
  renderGastos();
  showToast('Gasto eliminado', 'danger');
}

function editGasto(id) {
  editingGastoId = id;
  const gasto = getGastosActuales().find(x => x.id === id);
  if (!gasto) return;
  document.getElementById('eg-concepto').value  = gasto.concepto;
  document.getElementById('eg-monto').value     = gasto.monto;
  document.getElementById('eg-categoria').value = gasto.categoria;
  document.getElementById('eg-nota').value      = gasto.nota || '';
  const sel = document.getElementById('eg-fuente');
  sel.innerHTML = '';
  sueldos.forEach(s => {
    const o = document.createElement('option');
    o.value = s.nombre; o.textContent = s.nombre;
    sel.appendChild(o);
  });
  sel.value = gasto.fuente;
  document.getElementById('gasto-edit-modal').classList.add('active');
}

function closeGastoEditModal() {
  document.getElementById('gasto-edit-modal').classList.remove('active');
}

function saveGastoEdit() {
  const key   = mkKey(mesActual);
  const gasto = (gastosPorMes[key] || []).find(x => x.id === editingGastoId);
  if (!gasto) return;
  gasto.concepto  = document.getElementById('eg-concepto').value.trim();
  gasto.monto     = parseFloat(document.getElementById('eg-monto').value) || gasto.monto;
  gasto.categoria = document.getElementById('eg-categoria').value;
  gasto.fuente    = document.getElementById('eg-fuente').value;
  gasto.nota      = document.getElementById('eg-nota').value.trim();
  fbGuardarGasto(gasto);
  closeGastoEditModal();
  renderGastos();
  showToast('Gasto actualizado ✓', 'success');
}

function openPagarCuotaModal() {
  const sel = document.getElementById('pc-deuda');
  sel.innerHTML = '<option value="">— Selecciona una deuda —</option>';
  deudas.filter(d => !d.pagada).forEach(d => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = d.nombre + ' · ' + fmt(d.cuota) + '/mes';
    sel.appendChild(o);
  });
  document.getElementById('pc-preview').style.display    = 'none';
  document.getElementById('pc-confirm-btn').disabled     = true;
  document.getElementById('pc-nota').value               = '';
  document.getElementById('pagar-cuota-modal').classList.add('active');
}

function closePagarCuotaModal() {
  document.getElementById('pagar-cuota-modal').classList.remove('active');
}

function onPcDeudaChange() {
  const id      = parseInt(document.getElementById('pc-deuda').value);
  const preview = document.getElementById('pc-preview');
  const btn     = document.getElementById('pc-confirm-btn');
  if (!id) { preview.style.display = 'none'; btn.disabled = true; return; }

  const d = deudas.find(x => x.id === id);
  if (!d) return;

  document.getElementById('pc-monto-label').textContent  = fmt(d.cuota);
  document.getElementById('pc-fuente-label').textContent = d.fuente || '—';
  document.getElementById('pc-cuotas-label').textContent = d.cuotas + ' restantes';
  document.getElementById('pc-saldo-label').textContent  = fmt(d.saldo);

  const fSel = document.getElementById('pc-fuente-pago');
  fSel.innerHTML = '';
  sueldos.forEach(s => {
    const o = document.createElement('option');
    o.value = s.nombre; o.textContent = s.nombre;
    fSel.appendChild(o);
  });
  if (d.fuente) fSel.value = d.fuente;

  preview.style.display = 'block';
  btn.disabled = false;
}

function confirmarPagarCuota() {
  const id = parseInt(document.getElementById('pc-deuda').value);
  if (!id) return;
  const d = deudas.find(x => x.id === id);
  if (!d) return;

  const fuente = document.getElementById('pc-fuente-pago').value;
  const nota   = document.getElementById('pc-nota').value.trim() || ('Cuota deuda: ' + d.nombre);
  const key    = mkKey(mesActual);

  if (d.cuotas > 0) d.cuotas -= 1;
  d.saldo -= d.cuota;
  if (d.saldo <= 0) { d.saldo = 0; d.pagada = true; }
  fbGuardarDeuda(d);

  if (!gastosPorMes[key]) gastosPorMes[key] = [];
  const nuevoGasto = {
    id:        g(),
    concepto:  'Cuota: ' + d.nombre,
    monto:     d.cuota,
    categoria: 'Deudas',
    fuente,
    nota,
    ts:        Date.now(),
    mes:       key,
  };
  gastosPorMes[key].push(nuevoGasto);
  fbGuardarGasto(nuevoGasto);

  closePagarCuotaModal();
  renderDeudas();
  renderGastos();
  showToast(`Cuota de "${d.nombre}" descontada del saldo y registrada ✓`, 'success');
}

function getSugerenciasGastos(filtro = '') {
  const todos = Object.values(gastosPorMes).flat();
  const agrupados = {};
  todos.forEach(g => {
    const key = g.concepto.toLowerCase().trim();
    if (!agrupados[key]) {
      agrupados[key] = {
        concepto:  g.concepto,
        categoria: g.categoria,
        fuente:    g.fuente,
        montos:    [],
        veces:     0,
      };
    }
    agrupados[key].montos.push(g.monto);
    agrupados[key].veces++;
  });

  return Object.values(agrupados)
    .map(s => ({
      ...s,
      promedio: Math.round(s.montos.reduce((a, b) => a + b, 0) / s.montos.length),
    }))
    .filter(s => filtro === '' || s.concepto.toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => b.veces - a.veces);
}

function renderFrecuentes() {
  const sugerencias = getSugerenciasGastos().slice(0, 5);
  const el = document.getElementById('gastos-frecuentes');
  if (!el) return;

  if (!sugerencias.length) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'flex';
  el.innerHTML = sugerencias.map((s, i) => {
    const colores = ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#ef4444'];
    const col = colores[i % colores.length];
    return `
      <button class="filter-chip" onclick="aplicarSugerencia('${s.concepto.replace(/'/g, "\\'")}', '${s.categoria}', '${s.fuente}', ${s.promedio})"
        style="display:flex;align-items:center;gap:6px;white-space:nowrap;background:${col}12;border-color:${col}30;color:${col};padding:6px 12px;">
        <span style="font-weight:700;">${s.concepto}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;background:${col}20;padding:2px 6px;border-radius:6px;">${fmt(s.promedio)}</span>
      </button>`;
  }).join('');
}

function renderAutocompletado(filtro) {
  const el = document.getElementById('gastos-autocomplete');
  if (!el) return;
  if (!filtro) { el.style.display = 'none'; return; }

  const sugerencias = getSugerenciasGastos(filtro).slice(0, 5);
  if (!sugerencias.length) { el.style.display = 'none'; return; }

  el.style.display = 'block';
  el.innerHTML = sugerencias.map(s => `
    <div onclick="aplicarSugerencia('${s.concepto.replace(/'/g, "\\'")}', '${s.categoria}', '${s.fuente}', ${s.promedio})"
      style="padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:13px;transition:background 0.15s;"
      onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
      <span style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:600;color:var(--text);">${s.concepto}</span>
        <span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${s.categoria}</span>
      </span>
      <span style="display:flex;align-items:center;gap:6px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--accent);">${fmt(s.promedio)}</span>
        <span style="font-size:10px;color:var(--text3);">${s.veces}x</span>
      </span>
    </div>`
  ).join('');
}

function aplicarSugerencia(concepto, categoria, fuente, monto) {
  document.getElementById('g-concepto').value  = concepto;
  document.getElementById('g-monto').value     = monto;
  document.getElementById('g-categoria').value = categoria;
  document.getElementById('g-fuente').value    = fuente;
  document.getElementById('gastos-autocomplete').style.display = 'none';
  document.getElementById('g-concepto').focus();
  showToast(`💡 "${concepto}" cargado — ajusta el monto si es necesario`, 'info');
}

function mostrarDisponibleGasto() {
  const fuente = document.getElementById('g-fuente').value;
  const monto  = parseFloat(document.getElementById('g-monto').value) || 0;
  const el     = document.getElementById('g-fuente-disponible');
  if (!el || !fuente) { if (el) el.innerHTML = ''; return; }

  const disponible = disponibleFuente(fuente);
  const insuficiente = monto > disponible;

  el.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:4px 10px;border-radius:20px;
      background:${insuficiente ? 'var(--red-bg)' : 'var(--green-bg)'};
      font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;
      color:${insuficiente ? 'var(--danger)' : 'var(--success)'};">
      ${insuficiente ? fmt(disponible) + ' disponible' : fmt(disponible) + ' disponible'}
    </span>`;
}