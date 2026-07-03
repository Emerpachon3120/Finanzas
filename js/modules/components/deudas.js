/* =====================================================================
   js/modules/components/deudas.js — Gestión de deudas
   CRUD: renderizado con filtros/búsqueda, modal, liquidación, pago.
   ===================================================================== */

// ── Filtros ───────────────────────────────────────────────────────

function setDebtFilter(f, el) {
  debtFilter = f;
  document.querySelectorAll('#debt-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderDeudas();
}

// ── Renderizado ───────────────────────────────────────────────────

function renderDeudas() {
  const search = (document.getElementById('debt-search')?.value || '').toLowerCase();
  let list = deudas.filter(d => {
    if (debtFilter === 'activas' && d.pagada)  return false;
    if (debtFilter === 'pagadas' && !d.pagada) return false;
    if (search && !d.nombre.toLowerCase().includes(search)) return false;
    return true;
  });

  const el = document.getElementById('debt-list');
  el.innerHTML = '';

  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div>No se encontraron deudas</div>';
    return;
  }

  list.forEach(d => {
    const col = pctColor(d.tasa);
    let venceHtml = `<span style="color:var(--text3);font-family:'JetBrains Mono',monospace;font-size:11px;">—</span>`;

    if (d.fechaFin && !d.pagada) {
      const [y, m] = d.fechaFin.split('-').map(Number);
      const vence  = new Date(y, m - 1, 1);
      const hoy    = new Date();
      const diffMeses = (vence.getFullYear() - hoy.getFullYear()) * 12 + (vence.getMonth() - hoy.getMonth());
      const label  = `${String(m).padStart(2,'0')}/${y}`;
      if (diffMeses < 0) {
        venceHtml = `<span class="badge badge-danger" title="Venció hace ${Math.abs(diffMeses)} mes(es)">⚠ ${label}</span>`;
      } else if (diffMeses <= 2) {
        venceHtml = `<span class="badge badge-warning" title="Vence pronto">${label}</span>`;
      } else {
        venceHtml = `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3);">${label}</span>`;
      }
    }

    el.innerHTML += `
    <div class="debt-row ${d.pagada ? 'pagada' : ''}">
      <span class="debt-name">${d.nombre}
        ${d.pagada
          ? '<span class="pagada-badge">✓ PAGADA</span>'
          : `<span class="badge badge-${d.badge}" style="margin-left:4px;">${d.tasa > 0 ? d.tasa + '%' : '0%'}</span>`}
      </span>
      <span class="debt-amt">${d.pagada ? '—' : fmt(d.cuota)}</span>
      <span class="debt-amt">${d.pagada ? fmt(0) : fmt(d.saldo)}</span>
      <span class="debt-amt">${d.pagada ? '0' : d.cuotas}</span>
      <span class="debt-amt" style="color:${col};">${d.tasa > 0 ? d.tasa + '%' : '—'}</span>
      <span>${venceHtml}</span>
      <span style="display:flex;gap:3px;justify-content:center;align-items:center;">
        <button class="btn-edit" onclick="editDebt(${d.id})" title="Editar deuda">✏</button>
        ${!d.pagada ? `
          <button class="btn-edit" style="color:#8b5cf6;"
                  onclick="liquidarDeudaCompleta(${d.id})" title="⚡ Liquidar: paga el saldo total y crea gasto automático">⚡</button>
          <button class="btn-edit" style="color:var(--success);"
                  onclick="marcarPagada(${d.id})" title="✓ Archivar: marca como pagada sin registrar gasto">✓</button>` : ''}
        <button class="btn-delete" onclick="deleteDebt(${d.id})" title="Eliminar permanentemente">×</button>
      </span>
    </div>`;
  });
}

// ── Modal ─────────────────────────────────────────────────────────

function openDebtModal(id = null) {
  editingDebtId = id;
  populateDeuFuente();
  if (id) {
    const d = deudas.find(x => x.id === id);
    document.getElementById('debt-modal-title').textContent = 'Editar deuda';
    document.getElementById('deu-nombre').value  = d.nombre;
    document.getElementById('deu-cuota').value   = d.cuota;
    document.getElementById('deu-saldo').value   = d.saldo;
    document.getElementById('deu-cuotas').value  = d.cuotas;
    document.getElementById('deu-tasa').value    = d.tasa;
    document.getElementById('deu-fuente').value  = d.fuente || '';
    document.getElementById('deu-fechafin').value = d.fechaFin || '';
  } else {
    document.getElementById('debt-modal-title').textContent = 'Nueva deuda';
    ['deu-nombre','deu-cuota','deu-saldo','deu-cuotas','deu-tasa'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('deu-fechafin').value = '';
  }
  document.getElementById('debt-modal').classList.add('active');
}

function closeDebtModal() {
  document.getElementById('debt-modal').classList.remove('active');
}

function editDebt(id) { openDebtModal(id); }

// ── CRUD ──────────────────────────────────────────────────────────

function saveDebt() {
  const nombre   = document.getElementById('deu-nombre').value.trim();
  const cuota    = parseFloat(document.getElementById('deu-cuota').value) || 0;
  const saldo    = parseFloat(document.getElementById('deu-saldo').value) || 0;
  const cuotas   = parseInt(document.getElementById('deu-cuotas').value)  || 0;
  const tasa     = parseFloat(document.getElementById('deu-tasa').value)  || 0;
  const fuente   = document.getElementById('deu-fuente').value;
  const fechaFin = document.getElementById('deu-fechafin').value || '';
  if (!nombre || !saldo) { showToast('Completa los campos requeridos', 'danger'); return; }

  const badge = tasa >= 40 ? 'danger' : tasa >= 20 ? 'warning' : tasa > 0 ? 'info' : 'success';

  if (editingDebtId) {
    const d = deudas.find(x => x.id === editingDebtId);
    Object.assign(d, { nombre, cuota, saldo, cuotas, tasa, badge, fuente, fechaFin });
    fbGuardarDeuda(d);
    showToast('Deuda actualizada ✓', 'success');
  } else {
    const nueva = { id: g(), nombre, cuota, saldo, cuotas, tasa, badge, fuente, fechaFin, pagada: false };
    deudas.push(nueva);
    fbGuardarDeuda(nueva);
    showToast('Deuda agregada ✓', 'success');
  }
  closeDebtModal();
  renderDeudas();
  populateAmortSelect();
  populateAbonoSelect();
}

function deleteDebt(id) {
  const d = deudas.find(x => x.id === id);
  openConfirm('¿Eliminar deuda?', `"${d.nombre}" será eliminada permanentemente.`, 'Eliminar', 'btn-danger', () => {
    deudas = deudas.filter(x => x.id !== id);
    fbEliminarDeuda(id);
    renderDeudas();
    populateAmortSelect();
    populateAbonoSelect();
    showToast('Deuda eliminada', 'danger');
  }, '🗑️');
}

function marcarPagada(id) {
  const d = deudas.find(x => x.id === id);
  openConfirm(
    '¿Marcar como pagada?',
    `"${d.nombre}" quedará marcada como liquidada. Puedes reactivarla editándola.`,
    '¡Pagada! 🎉', 'btn-success',
    () => {
      d.pagada = true; d.saldo = 0; d.cuotas = 0;
      fbGuardarDeuda(d);
      renderDeudas();
      renderResumen();
      populateAbonoSelect();
      showToast(`🎉 ¡${d.nombre} pagada! Excelente!`, 'success');
    }, '✅'
  );
}

// ── Liquidación completa ──────────────────────────────────────────

function liquidarDeudaCompleta(id) {
  const d = deudas.find(x => x.id === id);
  if (!d) return;
  openConfirm(
    `⚡ Liquidar "${d.nombre}"`,
    `Se pagará el saldo total de ${fmt(d.saldo)}. Creará un gasto automático y registrará el abono.`,
    '⚡ Sí, liquidar', 'btn-danger',
    () => _ejecutarLiquidacion(d), '⚡'
  );
}

function _ejecutarLiquidacion(d) {
  const montoFinal = d.saldo;
  const mesClave   = mkKey(mesActual);

  if (!gastosPorMes[mesClave]) gastosPorMes[mesClave] = [];
  const nuevoGasto = {
    id:        g(),
    concepto:  `Liquidación total: ${d.nombre}`,
    monto:     montoFinal,
    categoria: 'Deudas',
    fuente:    d.fuente || '',
    nota:      `Pago final. Saldo cancelado: ${fmt(montoFinal)}`,
    ts:        Date.now(),
    mes:       mesClave,
  };
  gastosPorMes[mesClave].push(nuevoGasto);
  console.log('Guardando gasto:', nuevoGasto);
  fbGuardarGasto(nuevoGasto).then(() => console.log('Gasto guardado ✅')).catch(e => console.error('Error gasto:', e));

  const nuevoAbono = {
    id:          g(),
    fecha:       new Date().toLocaleDateString(),
    deudaId:     d.id,
    deudaNombre: d.nombre,
    tipo:        'Liquidación Total',
    monto:       montoFinal,
    nota:        'Cierre definitivo',
    ts:          Date.now(),
  };
  abonoHistorial.push(nuevoAbono);
  console.log('Guardando abono:', nuevoAbono);
  fbGuardarAbono(nuevoAbono).then(() => console.log('Abono guardado ✅')).catch(e => console.error('Error abono:', e));

  d.saldo = 0; d.cuotas = 0; d.pagada = true;
  fbGuardarDeuda(d);

  actualizarTodo();
  showToast(`🎊 "${d.nombre}" ha sido liquidada con éxito`, 'success');
}
