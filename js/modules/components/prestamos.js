/* =====================================================================
   js/modules/components/prestamos.js — Gestión de préstamos a terceros
   Registrar, cobrar, eliminar préstamos que le haces a otras personas.
   ===================================================================== */

var editingPrestamoId = null;
var prestamoFilter = 'todos';

// ── Filtros ───────────────────────────────────────────────────────

function setPrestamoFilter(f, el) {
  prestamoFilter = f;
  document.querySelectorAll('#prestamo-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderPrestamos();
}

// ── Renderizado ───────────────────────────────────────────────────

function renderPrestamos() {
  let list = prestamos.filter(p => {
    if (prestamoFilter === 'pendientes' && p.pagado) return false;
    if (prestamoFilter === 'pagados' && !p.pagado)   return false;
    return true;
  });

  // Métricas
  const totalPrestado  = prestamos.reduce((a, p) => a + p.monto, 0);
  const totalPendiente = prestamos.filter(p => !p.pagado).reduce((a, p) => a + p.monto, 0);
  const totalCobrado   = prestamos.filter(p => p.pagado).reduce((a, p) => a + p.monto, 0);
  const numPendientes  = prestamos.filter(p => !p.pagado).length;

  document.getElementById('prestamos-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total prestado</div><div class="metric-value blue">${fmt(totalPrestado)}</div><div class="metric-sub">${prestamos.length} préstamo(s)</div></div>
    <div class="metric"><div class="metric-label">Por cobrar</div><div class="metric-value amber">${fmt(totalPendiente)}</div><div class="metric-sub">${numPendientes} pendiente(s)</div></div>
    <div class="metric"><div class="metric-label">Ya cobrado</div><div class="metric-value green">${fmt(totalCobrado)}</div><div class="metric-sub">${prestamos.length - numPendientes} pagado(s)</div></div>`;

  const el = document.getElementById('prestamos-list');
  el.innerHTML = '';

  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🤝</div>No hay préstamos registrados</div>';
    return;
  }

  list
    .slice()
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .forEach(p => {
      el.innerHTML += `
      <div class="income-row" style="align-items:flex-start;padding:14px 0;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-weight:700;color:var(--text);font-size:14px;">${p.persona}</span>
            ${p.pagado
              ? '<span class="pagada-badge">✓ COBRADO</span>'
              : '<span class="badge badge-warning">Pendiente</span>'}
          </div>
          <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">
            ${p.fecha} · Desde ${p.fuente}${p.nota ? ' · ' + p.nota : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:800;font-family:'JetBrains Mono',monospace;color:${p.pagado ? 'var(--success)' : 'var(--warning)'};font-size:15px;">${fmt(p.monto)}</span>
          <span style="display:flex;gap:3px;">
            ${!p.pagado ? `<button class="btn-edit" style="color:var(--success);" onclick="cobrarPrestamo(${p.id})" title="Marcar como cobrado">✓</button>` : ''}
            <button class="btn-edit" onclick="editPrestamo(${p.id})" title="Editar">✏</button>
            <button class="btn-delete" onclick="deletePrestamo(${p.id})" title="Eliminar">×</button>
          </span>
        </div>
      </div>`;
    });
}

// ── Modal ─────────────────────────────────────────────────────────

function openPrestamoModal(id = null) {
  editingPrestamoId = id;
  const sel = document.getElementById('pre-fuente');
  sel.innerHTML = '';
  sueldos.forEach(s => {
    const o = document.createElement('option');
    o.value = s.nombre; o.textContent = s.nombre;
    sel.appendChild(o);
  });

  if (id) {
    const p = prestamos.find(x => x.id === id);
    document.getElementById('prestamo-modal-title').textContent = 'Editar préstamo';
    document.getElementById('pre-persona').value = p.persona;
    document.getElementById('pre-monto').value   = p.monto;
    document.getElementById('pre-fuente').value  = p.fuente;
    document.getElementById('pre-nota').value    = p.nota || '';
  } else {
    document.getElementById('prestamo-modal-title').textContent = 'Nuevo préstamo';
    document.getElementById('pre-persona').value = '';
    document.getElementById('pre-monto').value   = '';
    document.getElementById('pre-nota').value    = '';
  }
  document.getElementById('prestamo-modal').classList.add('active');
}

function closePrestamoModal() {
  document.getElementById('prestamo-modal').classList.remove('active');
}

function editPrestamo(id) { openPrestamoModal(id); }

// ── CRUD ──────────────────────────────────────────────────────────

function savePrestamo() {
  const persona = document.getElementById('pre-persona').value.trim();
  const monto   = parseFloat(document.getElementById('pre-monto').value);
  const fuente  = document.getElementById('pre-fuente').value;
  const nota    = document.getElementById('pre-nota').value.trim();
  if (!persona || !monto) { showToast('Completa persona y monto', 'danger'); return; }

  if (editingPrestamoId) {
    const p = prestamos.find(x => x.id === editingPrestamoId);
    p.persona = persona; p.monto = monto; p.fuente = fuente; p.nota = nota;
    fbGuardarPrestamo(p);
    showToast('Préstamo actualizado ✓', 'success');
  } else {
    const nuevo = {
      id: g(),
      persona,
      monto,
      fuente,
      nota,
      pagado: false,
      fecha: new Date().toLocaleDateString('es-CO'),
      ts: Date.now(),
    };
    prestamos.push(nuevo);
    fbGuardarPrestamo(nuevo);

    // Registrar automáticamente como gasto del mes actual
    const key = mkKey(mesActual);
    if (!gastosPorMes[key]) gastosPorMes[key] = [];
    const gasto = {
      id: g(),
      concepto: `Préstamo a ${persona}`,
      monto,
      categoria: 'Préstamos a otros',
      fuente,
      nota: nota || `Préstamo registrado`,
      ts: Date.now(),
      mes: key,
    };
    gastosPorMes[key].push(gasto);
    fbGuardarGasto(gasto);

    showToast(`Préstamo a "${persona}" registrado ✓`, 'success');
  }

  closePrestamoModal();
  renderPrestamos();
}

function deletePrestamo(id) {
  const p = prestamos.find(x => x.id === id);
  openConfirm('¿Eliminar préstamo?', `El registro de "${p.persona}" se eliminará permanentemente.`, 'Eliminar', 'btn-danger', () => {
    prestamos = prestamos.filter(x => x.id !== id);
    fbEliminarPrestamo(id);
    renderPrestamos();
    showToast('Préstamo eliminado', 'danger');
  }, '🗑️');
}

function cobrarPrestamo(id) {
  const p = prestamos.find(x => x.id === id);
  openConfirm(
    '¿Marcar como cobrado?',
    `Confirmas que "${p.persona}" te devolvió ${fmt(p.monto)}.`,
    '✓ Sí, cobrado', 'btn-success',
    () => {
      p.pagado = true;
      p.fechaCobro = new Date().toLocaleDateString('es-CO');
      fbGuardarPrestamo(p);
      renderPrestamos();
      showToast(`🎉 Préstamo a "${p.persona}" cobrado`, 'success');
    }, '💰'
  );
}