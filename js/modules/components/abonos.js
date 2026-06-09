/* =====================================================================
   js/modules/components/abonos.js — Abonos a capital
   Simulador de abono, aplicación, historial de abonos.
   ===================================================================== */

// ── Select de deudas activas ──────────────────────────────────────

function populateAbonoSelect() {
  const sel = document.getElementById('abono-select');
  if (!sel) return;
  sel.innerHTML = '';
  deudas.filter(d => !d.pagada).forEach(d => {
    const opt = document.createElement('option');
    opt.value       = d.id;
    opt.textContent = `${d.nombre}  —  ${fmt(d.saldo)}`;
    sel.appendChild(opt);
  });
  renderAbonoSimulator();
}

// ── Render principal de la tab ────────────────────────────────────

function renderAbonos() {
  populateAbonoSelect();
  renderAbonoSimulator();
  renderAbonoHistorial();
}

// ── Simulador ─────────────────────────────────────────────────────

function renderAbonoSimulator() {
  const sel = document.getElementById('abono-select');
  if (!sel || !sel.value) return;
  const id = parseInt(sel.value);
  const d  = deudas.find(x => x.id === id);
  if (!d) return;

  document.getElementById('abono-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Saldo actual</div><div class="metric-value red">${fmt(d.saldo)}</div></div>
    <div class="metric"><div class="metric-label">Cuota mensual</div><div class="metric-value">${fmt(d.cuota)}</div></div>
    <div class="metric"><div class="metric-label">Cuotas rest.</div><div class="metric-value">${d.cuotas}</div></div>
    <div class="metric"><div class="metric-label">Tasa E.A.</div><div class="metric-value" style="color:${pctColor(d.tasa)};">${d.tasa > 0 ? d.tasa + '%' : 'Sin interés'}</div></div>`;

  document.getElementById('abono-monto').value          = '';
  document.getElementById('abono-result').style.display = 'none';
}

function calcularAbono() {
  const sel = document.getElementById('abono-select');
  if (!sel || !sel.value) return;
  const d    = deudas.find(x => x.id === parseInt(sel.value));
  if (!d) return;

  const monto     = parseFloat(document.getElementById('abono-monto').value) || 0;
  const tipo      = document.getElementById('abono-tipo').value;
  const resultDiv = document.getElementById('abono-result');

  if (!monto || monto <= 0) { resultDiv.style.display = 'none'; return; }
  resultDiv.style.display = 'block';

  if (tipo === 'total') {
    const suficiente = monto >= d.saldo;
    document.getElementById('abono-info').innerHTML = suficiente
      ? `<strong style="color:var(--success);">✓ Puedes cancelar esta deuda.</strong> Con ${fmt(monto)} cubres el saldo de ${fmt(d.saldo)}.${monto > d.saldo ? ` Te sobrarían ${fmt(monto - d.saldo)}.` : ''}`
      : `<strong style="color:var(--danger);">⚠ Monto insuficiente.</strong> Necesitas ${fmt(d.saldo - monto)} adicionales para cancelar completamente.`;
    document.getElementById('abono-resultado-metrics').innerHTML = `
      <div class="metric"><div class="metric-label">Monto a pagar</div><div class="metric-value">${fmt(monto)}</div></div>
      <div class="metric"><div class="metric-label">Saldo a cancelar</div><div class="metric-value red">${fmt(d.saldo)}</div></div>
      <div class="metric"><div class="metric-label">Diferencia</div><div class="metric-value ${suficiente ? 'green' : 'red'}">${fmt(Math.abs(monto - d.saldo))}</div></div>
      <div class="metric"><div class="metric-label">Resultado</div><div class="metric-value ${suficiente ? 'green' : 'red'}">${suficiente ? '✓ OK' : '✗ Falta'}</div></div>`;
  } else {
    const nuevoSaldo = Math.max(0, d.saldo - monto);
    const tasaMes    = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
    let cuotasNuevas = 0;
    if (d.tasa > 0 && d.cuota > nuevoSaldo * tasaMes) {
      let s = nuevoSaldo;
      while (s > 0 && cuotasNuevas < 500) { s = Math.max(0, s - (d.cuota - s * tasaMes)); cuotasNuevas++; }
    } else {
      cuotasNuevas = nuevoSaldo > 0 ? Math.ceil(nuevoSaldo / d.cuota) : 0;
    }
    const cuotasAhorradas   = Math.max(0, d.cuotas - cuotasNuevas);
    const interesesAhorrados = cuotasAhorradas * d.cuota;

    document.getElementById('abono-info').innerHTML = `<strong style="color:var(--success);">✓ Abono a capital.</strong> Reduces el saldo de ${fmt(d.saldo)} a ${fmt(nuevoSaldo)} y te ahorras aprox. <strong>${cuotasAhorradas} cuota(s)</strong> — equiv. a <strong>${fmt(interesesAhorrados)}</strong>.`;
    document.getElementById('abono-resultado-metrics').innerHTML = `
      <div class="metric"><div class="metric-label">Saldo antes</div><div class="metric-value red">${fmt(d.saldo)}</div></div>
      <div class="metric"><div class="metric-label">Nuevo saldo</div><div class="metric-value green">${fmt(nuevoSaldo)}</div></div>
      <div class="metric"><div class="metric-label">Cuotas antes</div><div class="metric-value">${d.cuotas}</div></div>
      <div class="metric"><div class="metric-label">Cuotas nuevas</div><div class="metric-value green">${cuotasNuevas}</div></div>`;
  }
}

function aplicarAbono() {
  const sel  = document.getElementById('abono-select');
  const id   = parseInt(sel.value);
  const d    = deudas.find(x => x.id === id);
  const monto = parseFloat(document.getElementById('abono-monto').value) || 0;
  const tipo  = document.getElementById('abono-tipo').value;
  if (!monto || !d) return;

  if (tipo === 'total') {
    if (monto >= d.saldo) {
      abonoHistorial.unshift({ id: g(), deuda: d.nombre, monto: d.saldo, tipo: 'Pago total', fecha: new Date().toLocaleDateString('es-CO'), ts: Date.now() });
      d.pagada = true; d.saldo = 0; d.cuotas = 0;
      showToast(`🎉 ¡${d.nombre} PAGADA COMPLETAMENTE!`, 'success');
      populateAbonoSelect();
      renderDeudas();
    } else {
      abonoHistorial.unshift({ id: g(), deuda: d.nombre, monto, tipo: 'Abono parcial', fecha: new Date().toLocaleDateString('es-CO'), ts: Date.now() });
      d.saldo -= monto;
      showToast(`Abono de ${fmt(monto)} aplicado ✓`, 'success');
      renderAbonoSimulator();
    }
  } else {
    const nuevoSaldo = Math.max(0, d.saldo - monto);
    abonoHistorial.unshift({ id: g(), deuda: d.nombre, monto, tipo: 'Abono a capital', fecha: new Date().toLocaleDateString('es-CO'), ts: Date.now() });
    d.saldo = nuevoSaldo;
    if (nuevoSaldo === 0) { d.pagada = true; d.cuotas = 0; showToast(`🎉 ¡${d.nombre} liquidada!`, 'success'); }
    else { showToast(`Abono a capital de ${fmt(monto)} aplicado ✓`, 'success'); }
    renderAbonoSimulator();
    renderDeudas();
  }

  document.getElementById('abono-monto').value          = '';
  document.getElementById('abono-result').style.display = 'none';
  renderAbonoHistorial();
  renderResumen();
}

// ── Historial ─────────────────────────────────────────────────────

function renderAbonoHistorial() {
  const el = document.getElementById('abono-historial-list');
  if (!abonoHistorial.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">💸</div>No hay abonos registrados</div>';
    return;
  }
  el.innerHTML = `<table class="expense-table">
    <thead><tr><th>Fecha</th><th>Deuda</th><th>Tipo</th><th>Monto</th><th></th></tr></thead>
    <tbody>
    ${abonoHistorial.map(a => `<tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text3);">${a.fecha}</td>
      <td style="font-weight:700;color:var(--text);">${a.deuda}</td>
      <td><span class="badge badge-${a.tipo === 'Pago total' ? 'success' : a.tipo === 'Abono a capital' ? 'info' : 'warning'}">${a.tipo}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--success);">${fmt(a.monto)}</td>
      <td><button class="btn-delete" onclick="deleteAbono(${a.id})">×</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

function deleteAbono(id) {
  abonoHistorial = abonoHistorial.filter(a => a.id !== id);
  renderAbonoHistorial();
  showToast('Abono eliminado del historial');
}
