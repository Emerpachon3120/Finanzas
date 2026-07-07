/* =====================================================================
   js/modules/ui/ui.js — Utilidades de interfaz de usuario
   Toast, diálogo de confirmación, tabs, selects comunes.
   ===================================================================== */

// ── Toast ─────────────────────────────────────────────────────────

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ── Confirm dialog ────────────────────────────────────────────────

function openConfirm(title, msg, okLabel, okClass, fn, icon = '') {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  const iconEl = document.getElementById('confirm-icon');
  if (icon) { iconEl.textContent = icon; iconEl.style.display = 'block'; }
  else       { iconEl.style.display = 'none'; }
  const btn = document.getElementById('confirm-ok-btn');
  btn.textContent = okLabel;
  btn.className   = okClass;
  pendingConfirm  = fn;
  document.getElementById('confirm-overlay').classList.add('active');
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('active');
}

function confirmAction() {
  closeConfirm();
  if (pendingConfirm) pendingConfirm();
}

// ── Tabs ──────────────────────────────────────────────────────────

function showTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  el.classList.add('active');

  const renderMap = {
    resumen:    renderResumen,
    sueldos:    renderSueldos,
    deudas:     renderDeudas,
    abonos:     renderAbonos,
    prestamos:  renderPrestamos,
    amortizar:  buildAmort,
    gastos:     renderGastos,
    historial:  renderHistorial,
    analisis:   renderAnalisis,
    estrategia: renderEstrategia,
  };
  if (renderMap[id]) renderMap[id]();
}

// ── Selects de fuentes de ingreso ─────────────────────────────────

/** Rellena el select de "fuente" en Gastos — solo sueldos recibidos este mes */
function populateFuenteSelects() {
  const sel = document.getElementById('g-fuente');
  if (sel) {
    const cur = sel.value;
    const mes = mkKey(mesActual);
    sel.innerHTML = '';

    const disponibles = sueldos.filter(s => estaRecibido(mes, s.id));

    if (!disponibles.length) {
      const o = document.createElement('option');
      o.value = ''; o.textContent = '— Sin ingresos recibidos este mes —';
      sel.appendChild(o);
    } else {
      disponibles.forEach(s => {
        const o = document.createElement('option');
        o.value = s.nombre; o.textContent = s.nombre;
        sel.appendChild(o);
      });
    }
    if (cur) sel.value = cur;
  }

  // Fuente de deudas: mantiene todos los sueldos (no depende del mes)
  const selDeu = document.getElementById('deu-fuente');
  if (selDeu) {
    const cur = selDeu.value;
    selDeu.innerHTML = '';
    sueldos.forEach(s => {
      const o = document.createElement('option');
      o.value = s.nombre; o.textContent = s.nombre;
      selDeu.appendChild(o);
    });
    if (cur) selDeu.value = cur;
  }

  // Chips de filtro por fuente en la tab de gastos
  const fc = document.getElementById('fuente-filter-chips');
  if (fc) {
    fc.innerHTML = '';
    sueldos.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.textContent = s.nombre;
      btn.onclick = function () {
        gastoFilterFuente = s.nombre;
        document.getElementById('ff-todas').classList.remove('active');
        document.querySelectorAll('#fuente-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        renderGastos();
      };
      fc.appendChild(btn);
    });
  }
}

/** Rellena el select de fuente en el modal de deudas */
function populateDeuFuente() {
  const sel = document.getElementById('deu-fuente');
  if (!sel) return;
  sel.innerHTML = '';
  sueldos.forEach(s => {
    const o = document.createElement('option');
    o.value = s.nombre; o.textContent = s.nombre;
    sel.appendChild(o);
  });
}