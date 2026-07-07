/* =====================================================================
   js/modules/components/sueldos.js — Gestión de fuentes de ingreso
   CRUD completo + frecuencia de pago + marcado "recibido" por mes.
   ===================================================================== */

// ── Helper: determina si un sueldo está marcado como recibido ──────
// Por defecto se asume recibido (true) para no romper datos existentes.

function estaRecibido(mes, sueldoId) {
  if (!ingresosRecibidos[mes]) return true;
  if (ingresosRecibidos[mes][sueldoId] === undefined) return true;
  return ingresosRecibidos[mes][sueldoId];
}

function toggleIngresoRecibido(sueldoId) {
  const mes = mkKey(mesActual);
  const nuevoEstado = !estaRecibido(mes, sueldoId);
  if (!ingresosRecibidos[mes]) ingresosRecibidos[mes] = {};
  ingresosRecibidos[mes][sueldoId] = nuevoEstado;
  fbGuardarIngresoRecibido(mes, sueldoId, nuevoEstado);
  renderSueldos();
  renderResumen();
  populateFuenteSelects();
  renderGastos();
  showToast(nuevoEstado ? '✅ Marcado como recibido' : '⏳ Marcado como pendiente', nuevoEstado ? 'success' : 'info');
}

// ── Renderizado ───────────────────────────────────────────────────

function renderSueldos() {
  const mes = mkKey(mesActual);
  const el = document.getElementById('salary-cards');
  el.innerHTML = '';

  sueldos.forEach(s => {
    const frecuenciaLabel = s.frecuencia === 'diario'    ? '📆 Diario'
                          : s.frecuencia === 'quincenal' ? '📅 Quincenal'
                          : '🗓️ Mensual';
    const recibido = estaRecibido(mes, s.id);

    el.innerHTML += `
    <div class="salary-card" style="${!recibido ? 'opacity:0.55;' : ''}">
      <div class="salary-card-name">${s.nombre}</div>
      <div class="salary-card-amount">${fmt(s.monto)}</div>
      <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:8px;">${frecuenciaLabel}</div>

      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;background:${recibido ? 'var(--green-bg)' : 'var(--bg3)'};border-radius:9px;margin-bottom:8px;">
        <input type="checkbox" ${recibido ? 'checked' : ''} onchange="toggleIngresoRecibido(${s.id})" style="width:16px;height:16px;cursor:pointer;accent-color:var(--success);"/>
        <span style="font-size:12px;font-weight:700;color:${recibido ? 'var(--success)' : 'var(--text3)'};">${recibido ? '✓ Recibido este mes' : 'Pendiente este mes'}</span>
      </label>

      <div class="salary-card-actions">
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px;" onclick="editSalary(${s.id})">✏ Editar</button>
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px;color:var(--danger);" onclick="deleteSalary(${s.id})">🗑</button>
      </div>
    </div>`;
  });

  // Resumen de ingresos (solo cuenta lo marcado como recibido este mes)
  const ti = totalIngresos();
  const tc = totalCuotaActiva();
  const sumEl = document.getElementById('salary-summary-rows');
  sumEl.innerHTML = '';
  sueldos.forEach(s => {
    const recibido = estaRecibido(mes, s.id);
    const pctS = ti > 0 ? Math.round(s.monto / ti * 100) : 0;
    sumEl.innerHTML += `<div class="income-row">
      <span>${s.nombre} ${!recibido ? '<span style="color:var(--text3);font-size:10px;">(pendiente)</span>' : ''}</span>
      <span class="${recibido ? 'green' : ''}" style="${!recibido ? 'color:var(--text3);text-decoration:line-through;' : ''}">${fmt(s.monto)} ${recibido ? `<span style="color:var(--text3);font-size:10px;">(${pctS}%)</span>` : ''}</span>
    </div>`;
  });
  sumEl.innerHTML += `
    <div class="divider"></div>
    <div class="income-row total-row"><span>Total ingresos recibidos</span><span class="green">${fmt(ti)}</span></div>
    <div class="income-row"><span>Total cuotas deudas</span><span class="red">−${fmt(tc)}</span></div>
    <div class="income-row total-row"><span>Disponible libre</span><span class="${ti - tc >= 0 ? 'green' : 'red'}">${fmt(ti - tc)}</span></div>`;
}

// ── Modal ─────────────────────────────────────────────────────────

function openSalaryModal(id = null) {
  editingSalaryId = id;
  if (id) {
    const s = sueldos.find(x => x.id === id);
    document.getElementById('salary-modal-title').textContent = 'Editar fuente de ingreso';
    document.getElementById('sal-nombre').value = s.nombre;
    document.getElementById('sal-monto').value  = s.monto;
    document.getElementById('sal-tipo').value   = s.tipo;
    document.getElementById('sal-frecuencia').value = s.frecuencia || 'mensual';
  } else {
    document.getElementById('salary-modal-title').textContent = 'Nueva fuente de ingreso';
    document.getElementById('sal-nombre').value = '';
    document.getElementById('sal-monto').value  = '';
    document.getElementById('sal-tipo').value   = 'fijo';
    document.getElementById('sal-frecuencia').value = 'mensual';
  }
  document.getElementById('salary-modal').classList.add('active');
}

function closeSalaryModal() {
  document.getElementById('salary-modal').classList.remove('active');
}

function editSalary(id) { openSalaryModal(id); }

// ── CRUD ──────────────────────────────────────────────────────────

function saveSalary() {
  const nombre     = document.getElementById('sal-nombre').value.trim();
  const monto      = parseFloat(document.getElementById('sal-monto').value);
  const tipo       = document.getElementById('sal-tipo').value;
  const frecuencia = document.getElementById('sal-frecuencia').value;
  if (!nombre || !monto) { showToast('Completa todos los campos', 'danger'); return; }

  if (editingSalaryId) {
    const s = sueldos.find(x => x.id === editingSalaryId);
    s.nombre = nombre; s.monto = monto; s.tipo = tipo; s.frecuencia = frecuencia;
    fbGuardarSueldo(s);
    showToast('Fuente de ingreso actualizada ✓', 'success');
  } else {
    const nuevo = { id: g(), nombre, monto, tipo, frecuencia };
    sueldos.push(nuevo);
    fbGuardarSueldo(nuevo);
    showToast('Fuente de ingreso agregada ✓', 'success');
  }
  closeSalaryModal();
  populateFuenteSelects();
  renderSueldos();
}

function deleteSalary(id) {
  if (sueldos.length <= 1) { showToast('Debe haber al menos una fuente de ingreso', 'danger'); return; }
  openConfirm(
    '¿Eliminar fuente?',
    'Esta acción eliminará la fuente de ingreso permanentemente.',
    'Eliminar', 'btn-danger',
    () => {
      sueldos = sueldos.filter(s => s.id !== id);
      fbEliminarSueldo(id);
      populateFuenteSelects();
      renderSueldos();
      showToast('Fuente eliminada', 'danger');
    }
  );
}