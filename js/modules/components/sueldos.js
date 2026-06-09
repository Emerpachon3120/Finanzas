/* =====================================================================
   js/modules/components/sueldos.js — Gestión de fuentes de ingreso
   CRUD completo: renderizado, modal, alta, edición, eliminación.
   ===================================================================== */

function renderSueldos() {
  const el = document.getElementById('salary-cards');
  el.innerHTML = '';
  sueldos.forEach(s => {
    const tipoLabel = s.tipo === 'fijo' ? '🟢 Fijo'
                    : s.tipo === 'variable' ? '🟡 Variable'
                    : '🔵 Extra';
    el.innerHTML += `
    <div class="salary-card">
      <div class="salary-card-name">${s.nombre}</div>
      <div class="salary-card-amount">${fmt(s.monto)}</div>
      <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${tipoLabel} mensual</div>
      <div class="salary-card-actions">
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px;" onclick="editSalary(${s.id})">✏ Editar</button>
        <button class="btn-secondary" style="padding:6px 14px;font-size:12px;color:var(--danger);" onclick="deleteSalary(${s.id})">🗑</button>
      </div>
    </div>`;
  });

  // Resumen de ingresos
  const ti = totalIngresos();
  const tc = totalCuotaActiva();
  const sumEl = document.getElementById('salary-summary-rows');
  sumEl.innerHTML = '';
  sueldos.forEach(s => {
    const pctS = Math.round(s.monto / ti * 100);
    sumEl.innerHTML += `<div class="income-row">
      <span>${s.nombre}</span>
      <span class="green">${fmt(s.monto)} <span style="color:var(--text3);font-size:10px;">(${pctS}%)</span></span>
    </div>`;
  });
  sumEl.innerHTML += `
    <div class="divider"></div>
    <div class="income-row total-row"><span>Total ingresos</span><span class="green">${fmt(ti)}</span></div>
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
  } else {
    document.getElementById('salary-modal-title').textContent = 'Nueva fuente de ingreso';
    document.getElementById('sal-nombre').value = '';
    document.getElementById('sal-monto').value  = '';
    document.getElementById('sal-tipo').value   = 'fijo';
  }
  document.getElementById('salary-modal').classList.add('active');
}

function closeSalaryModal() {
  document.getElementById('salary-modal').classList.remove('active');
}

function editSalary(id) { openSalaryModal(id); }

// ── CRUD ──────────────────────────────────────────────────────────

function saveSalary() {
  const nombre = document.getElementById('sal-nombre').value.trim();
  const monto  = parseFloat(document.getElementById('sal-monto').value);
  const tipo   = document.getElementById('sal-tipo').value;
  if (!nombre || !monto) { showToast('Completa todos los campos', 'danger'); return; }

  if (editingSalaryId) {
    const s = sueldos.find(x => x.id === editingSalaryId);
    s.nombre = nombre; s.monto = monto; s.tipo = tipo;
    showToast('Fuente de ingreso actualizada ✓', 'success');
  } else {
    sueldos.push({ id: g(), nombre, monto, tipo });
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
      populateFuenteSelects();
      renderSueldos();
      showToast('Fuente eliminada', 'danger');
    }
  );
}
