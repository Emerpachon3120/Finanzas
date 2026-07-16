/* =====================================================================
   js/modules/components/metas.js — Metas de ahorro
   CRUD de metas + modal de aporte con selección de fuente.
   ===================================================================== */

var editingMetaId = null;

// ── Iconos por lugar de guardado ────────────────────────────────────

const iconosLugar = {
  'Nequi':        { icon: '📱', color: '#e91e63' },
  'Daviplata':    { icon: '💳', color: '#ef4444' },
  'Bancolombia':  { icon: '🏦', color: '#f59e0b' },
  'Davivienda':   { icon: '🏛️', color: '#ef4444' },
  'Efectivo':     { icon: '💵', color: '#10b981' },
};

// ── Renderizado ───────────────────────────────────────────────────

function renderMetas() {
  const totalObjetivo = metas.reduce((a, m) => a + m.objetivo, 0);
  const totalAcumulado = metas.reduce((a, m) => a + m.acumulado, 0);
  const metasCompletas = metas.filter(m => m.acumulado >= m.objetivo).length;

  document.getElementById('metas-summary').innerHTML = `
    <div class="metric"><div class="metric-label">Total ahorrado</div><div class="metric-value green">${fmt(totalAcumulado)}</div></div>
    <div class="metric"><div class="metric-label">Meta total</div><div class="metric-value blue">${fmt(totalObjetivo)}</div></div>
    <div class="metric"><div class="metric-label">Metas activas</div><div class="metric-value">${metas.length}</div></div>
    <div class="metric"><div class="metric-label">Completadas</div><div class="metric-value" style="color:var(--purple);">${metasCompletas}</div></div>`;

  const el = document.getElementById('metas-grid');
  el.innerHTML = '';

  if (!metas.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🎯</div>No tienes metas de ahorro todavía<br><span style="font-size:11px;">Crea una para empezar a ahorrar con propósito</span></div>`;
    return;
  }

  metas.forEach(m => {
    const pct = Math.min(100, Math.round((m.acumulado / m.objetivo) * 100));
    const completa = m.acumulado >= m.objetivo;
    const lugar = iconosLugar[m.lugar] || { icon: '💰', color: '#94a3b8' };
    const falta = Math.max(0, m.objetivo - m.acumulado);

    let fechaInfo = '';
    if (m.fechaLimite) {
      const hoy = new Date();
      const limite = new Date(m.fechaLimite + '-01');
      const diffMeses = (limite.getFullYear() - hoy.getFullYear()) * 12 + (limite.getMonth() - hoy.getMonth());
      if (diffMeses < 0 && !completa) {
        fechaInfo = `<span class="badge badge-danger">Vencida</span>`;
      } else if (diffMeses <= 1 && !completa) {
        fechaInfo = `<span class="badge badge-warning">${diffMeses <= 0 ? 'Este mes' : '1 mes restante'}</span>`;
      } else if (!completa) {
        fechaInfo = `<span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;">${diffMeses} meses restantes</span>`;
      }
    }

    el.innerHTML += `
    <div class="card meta-card" style="${completa ? 'border-color:rgba(16,185,129,0.4);background:linear-gradient(135deg,rgba(16,185,129,0.04),rgba(255,255,255,0));' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:3px;">${m.nombre}</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">
            <span>${lugar.icon}</span> ${m.lugar}
          </div>
        </div>
        ${completa ? '<span class="badge badge-success">✓ Completa</span>' : fechaInfo}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <span style="font-size:19px;font-weight:800;font-family:'JetBrains Mono',monospace;color:${completa ? 'var(--success)' : 'var(--text)'};">${fmt(m.acumulado)}</span>
        <span style="font-size:12px;color:var(--text3);font-family:'JetBrains Mono',monospace;">de ${fmt(m.objetivo)}</span>
      </div>

      <div class="progress-bar" style="margin-bottom:6px;">
        <div class="progress-fill" style="width:${pct}%;background:${completa ? 'var(--success)' : lugar.color};"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:14px;">
        <span>${pct}%</span>
        <span>${completa ? '¡Meta lograda! 🎉' : `Faltan ${fmt(falta)}`}</span>
      </div>

      <div style="display:flex;gap:6px;">
        ${!completa ? `<button class="btn-add" style="flex:1;padding:9px;font-size:12px;" onclick="openAporteMetaModal(${m.id})">+ Aportar</button>` : ''}
        <button class="btn-secondary" style="padding:9px 12px;font-size:12px;" onclick="editMeta(${m.id})">✏</button>
        <button class="btn-secondary" style="padding:9px 12px;font-size:12px;color:var(--danger);" onclick="deleteMeta(${m.id})">🗑</button>
      </div>
    </div>`;
  });
}

// ── Modal: Nueva / Editar meta ──────────────────────────────────────

function openMetaModal(id = null) {
  editingMetaId = id;
  if (id) {
    const m = metas.find(x => x.id === id);
    document.getElementById('meta-modal-title').textContent = 'Editar meta';
    document.getElementById('meta-nombre').value    = m.nombre;
    document.getElementById('meta-objetivo').value  = m.objetivo;
    document.getElementById('meta-lugar').value     = m.lugar;
    document.getElementById('meta-fecha').value     = m.fechaLimite || '';
  } else {
    document.getElementById('meta-modal-title').textContent = 'Nueva meta de ahorro';
    document.getElementById('meta-nombre').value    = '';
    document.getElementById('meta-objetivo').value  = '';
    document.getElementById('meta-lugar').value     = 'Efectivo';
    document.getElementById('meta-fecha').value     = '';
  }
  document.getElementById('meta-modal').classList.add('active');
}

function closeMetaModal() {
  document.getElementById('meta-modal').classList.remove('active');
}

function editMeta(id) { openMetaModal(id); }

function saveMeta() {
  const nombre   = document.getElementById('meta-nombre').value.trim();
  const objetivo = parseFloat(document.getElementById('meta-objetivo').value);
  const lugar    = document.getElementById('meta-lugar').value;
  const fecha    = document.getElementById('meta-fecha').value;
  if (!nombre || !objetivo) { showToast('Completa nombre y monto objetivo', 'danger'); return; }

  if (editingMetaId) {
    const m = metas.find(x => x.id === editingMetaId);
    m.nombre = nombre; m.objetivo = objetivo; m.lugar = lugar; m.fechaLimite = fecha;
    fbGuardarMeta(m);
    showToast('Meta actualizada ✓', 'success');
  } else {
    const nueva = {
      id: g(),
      nombre,
      objetivo,
      acumulado: 0,
      lugar,
      fechaLimite: fecha,
      ts: Date.now(),
    };
    metas.push(nueva);
    fbGuardarMeta(nueva);
    showToast(`Meta "${nombre}" creada ✓`, 'success');
  }

  closeMetaModal();
  renderMetas();
}

function deleteMeta(id) {
  const m = metas.find(x => x.id === id);
  openConfirm('¿Eliminar meta?', `"${m.nombre}" se eliminará permanentemente. El progreso ahorrado no se recupera.`, 'Eliminar', 'btn-danger', () => {
    metas = metas.filter(x => x.id !== id);
    fbEliminarMeta(id);
    renderMetas();
    showToast('Meta eliminada', 'danger');
  }, '🗑️');
}

// ── Modal: Aportar a meta ────────────────────────────────────────────

function openAporteMetaModal(id) {
  editingMetaId = id;
  const m = metas.find(x => x.id === id);
  if (!m) return;

  document.getElementById('aporte-meta-nombre').textContent = m.nombre;
  document.getElementById('aporte-meta-falta').textContent  = fmt(Math.max(0, m.objetivo - m.acumulado));
  document.getElementById('aporte-monto').value = '';

  const mes = mkKey(mesActual);
  const disponibles = sueldos.filter(s => estaRecibido(mes, s.id));

  const sel = document.getElementById('aporte-fuente');
  sel.innerHTML = '';
  disponibles.forEach(s => {
    const o = document.createElement('option');
    o.value = s.nombre; o.textContent = s.nombre;
    sel.appendChild(o);
  });

  document.getElementById('aporte-fuente-disponible').innerHTML = '';
  document.getElementById('aporte-meta-modal').classList.add('active');
}

function closeAporteMetaModal() {
  document.getElementById('aporte-meta-modal').classList.remove('active');
}

function mostrarDisponibleAporte() {
  const fuente = document.getElementById('aporte-fuente').value;
  const monto  = parseFloat(document.getElementById('aporte-monto').value) || 0;
  const el     = document.getElementById('aporte-fuente-disponible');
  if (!el || !fuente) { if (el) el.innerHTML = ''; return; }

  const disponible = disponibleFuente(fuente);
  const insuficiente = monto > disponible;

  el.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:4px 10px;border-radius:20px;
      background:${insuficiente ? 'var(--red-bg)' : 'var(--green-bg)'};
      font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;
      color:${insuficiente ? 'var(--danger)' : 'var(--success)'};">
      ${fmt(disponible)} disponible
    </span>`;
}

function confirmarAporteMeta() {
  const m      = metas.find(x => x.id === editingMetaId);
  const monto  = parseFloat(document.getElementById('aporte-monto').value);
  const fuente = document.getElementById('aporte-fuente').value;
  if (!m || !monto || monto <= 0) { showToast('Ingresa un monto válido', 'danger'); return; }
  if (!fuente) { showToast('Selecciona una fuente', 'danger'); return; }

  m.acumulado += monto;
  fbGuardarMeta(m);

  // Registrar como gasto del mes actual
  const key = mkKey(mesActual);
  if (!gastosPorMes[key]) gastosPorMes[key] = [];
  const gasto = {
    id: g(),
    concepto: `Ahorro: ${m.nombre}`,
    monto,
    categoria: 'Ahorro',
    fuente,
    nota: `Guardado en ${m.lugar}`,
    ts: Date.now(),
    mes: key,
  };
  gastosPorMes[key].push(gasto);
  fbGuardarGasto(gasto);

  const completa = m.acumulado >= m.objetivo;
  closeAporteMetaModal();
  renderMetas();
  renderGastos();

  showToast(completa ? `🎉 ¡Meta "${m.nombre}" completada!` : `Aporte de ${fmt(monto)} registrado ✓`, 'success');
}