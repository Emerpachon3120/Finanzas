/* =====================================================================
   js/modules/services/sheets.js — Conector con Google Sheets (BD)
   Maneja autenticación OAuth, lectura y escritura de datos.
   ===================================================================== */

let gsToken = null;

// ── Autenticación OAuth ───────────────────────────────────────────

function gsLogin() {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GS_CLIENT_ID,
    scope:     GS_SCOPES,
    callback: async (resp) => {
      if (resp.error) {
        showToast('❌ Error al autenticar: ' + resp.error, 'danger');
        return;
      }
      gsToken = resp.access_token;
      showToast('🔗 Conectado. Cargando datos...', 'info');

      const btnSync = document.getElementById('btn-gsync');
      const btnSave = document.getElementById('btn-gsave');
      if (btnSync) { btnSync.textContent = '✅ Conectado'; btnSync.disabled = true; }
      if (btnSave) btnSave.style.display = '';

      await cargarDesdeSheets();
    }
  });
  client.requestAccessToken();
}

// ── Lectura de rangos ─────────────────────────────────────────────

async function gsGetRange(range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GS_SHEET_ID}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
  const res  = await fetch(url, { headers: { Authorization: 'Bearer ' + gsToken } });
  const data = await res.json();
  return data.values || [];
}

// ── Carga y procesamiento de datos ───────────────────────────────

async function cargarDesdeSheets() {
  try {
    const [rowsS, rowsD, rowsG, rowsA] = await Promise.all([
      gsGetRange('Sueldos!B4:G200'),
      gsGetRange('Deudas!B4:K200'),
      gsGetRange('Gastos!B4:J2000'),
      gsGetRange('Abonos!B4:I2000'),
    ]);

    sueldos = _procesarSueldos(rowsS);
    deudas  = _procesarDeudas(rowsD);
    gastosPorMes  = _procesarGastos(rowsG);
    abonoHistorial = _procesarAbonos(rowsA);

    // Sincronizar el contador de IDs para que nunca colisione
    // con los IDs que ya existen en Sheets
    _sincronizarContadorIds();

    actualizarTodo();

    const bv = document.getElementById('bienvenida-screen');
    if (bv) bv.style.display = 'none';

    bdCargada = true;
    showToast('✅ Datos sincronizados correctamente', 'success');
  } catch (err) {
    console.error('[sheets]', err);
    showToast('❌ Error al leer datos: ' + err.message, 'danger');
  }
}

function _procesarSueldos(rows) {
  const resultado = [];
  rows.forEach(row => {
    if (!row || row.length < 2) return;
    const nombre = row[1], activo = String(row[4] || 'SI').toUpperCase();
    if (nombre && activo === 'SI') {
      resultado.push({
        id:     parseInt(row[0]) || g(),
        nombre,
        monto:  parsearMonto(row[2]),
        tipo:   (row[3] || 'fijo').toLowerCase(),
      });
    }
  });
  return resultado;
}

function _procesarDeudas(rows) {
  const resultado = [];
  rows.forEach(row => {
    if (!row || row.length < 2) return;
    const nombre = row[1];
    if (!nombre) return;
    const tasa   = parsearMonto(row[5]);
    const badge  = tasa >= 40 ? 'danger' : tasa >= 20 ? 'warning' : tasa > 0 ? 'info' : 'success';
    resultado.push({
      id:       parseInt(row[0]) || g(),
      nombre,
      cuota:    parsearMonto(row[2]),
      saldo:    parsearMonto(row[3]),
      cuotas:   parseInt(row[4]) || 0,
      tasa,
      fuente:   row[6] || '',
      badge,
      pagada:   String(row[8] || 'NO').toUpperCase() === 'SI',
      fechaFin: row[9] || '',
    });
  });
  return resultado;
}

function _procesarGastos(rows) {
  const resultado = {};
  rows.forEach(row => {
    if (!row || row.length < 3) return;
    const mes = String(row[1] || '').trim(), concepto = row[2] || '';
    if (!mes || !concepto) return;
    if (!resultado[mes]) resultado[mes] = [];
    resultado[mes].push({
      id:        parseInt(row[0]) || g(),
      concepto,
      monto:     parsearMonto(row[5]),
      categoria: row[3] || 'Otro',
      fuente:    row[4] || '',
      nota:      row[6] || '',
      ts:        row[7] ? new Date(row[7]).getTime() : Date.now(),
    });
  });
  return resultado;
}

function _procesarAbonos(rows) {
  const resultado = [];
  rows.forEach(row => {
    if (!row || row.length < 5) return;
    const monto = parsearMonto(row[5]);
    if (monto > 0) {
      resultado.push({
        id:           parseInt(row[0]) || g(),
        fecha:        row[1] || '',
        deudaId:      parseInt(row[2]) || 0,
        deudaNombre:  row[3] || '',
        tipo:         row[4] || 'capital',
        monto,
        nota:         row[6] || '',
      });
    }
  });
  return resultado;
}

/**
 * Después de cargar datos desde Sheets, avanza el contador nextId
 * hasta ser mayor que cualquier ID existente. Así los registros nuevos
 * nunca colisionan con los que ya vienen de la base de datos.
 */
function _sincronizarContadorIds() {
  const todosLosIds = [
    ...sueldos.map(x => x.id),
    ...deudas.map(x => x.id),
    ...abonoHistorial.map(x => x.id),
    ...Object.values(gastosPorMes).flat().map(x => x.id),
  ].filter(id => typeof id === 'number' && isFinite(id));

  if (todosLosIds.length > 0) {
    const maxId = Math.max(...todosLosIds);
    if (maxId >= nextId) nextId = maxId + 1;
  }
}

// ── Escritura en Sheets ───────────────────────────────────────────

async function gsClearAndWrite(sheetName, rows) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${GS_SHEET_ID}`;
  const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + gsToken };

  await fetch(`${base}/values/${encodeURIComponent(sheetName + '!B4:Z5000')}:clear`, {
    method: 'POST', headers: hdrs
  });

  if (!rows.length) return;

  await fetch(`${base}/values/${encodeURIComponent(sheetName + '!B4')}?valueInputOption=RAW`, {
    method: 'PUT', headers: hdrs,
    body: JSON.stringify({ values: rows })
  });
}

async function guardarEnSheets() {
  if (!gsToken) { showToast('⚠️ Conecta Google primero', 'warning'); return; }
  try {
    const rowsS = sueldos.map(s => [s.id, s.nombre, s.monto, s.tipo, 'SI']);
    const rowsD = deudas.map(d => [
      d.id, d.nombre, d.cuota, d.saldo, d.cuotas,
      d.tasa, d.fuente || '', d.pagada ? 'Pagada' : 'Activa',
      d.pagada ? 'SI' : 'NO', d.fechaFin || ''
    ]);
    const rowsG = [];
    Object.entries(gastosPorMes).forEach(([mes, lista]) => {
      lista.forEach(g => rowsG.push([g.id, mes, g.concepto, g.categoria, g.fuente, g.monto, g.nota, new Date(g.ts).toISOString()]));
    });
    const rowsA = abonoHistorial.map(a => [a.id, a.fecha, a.deudaId, a.deudaNombre, a.tipo, a.monto, a.nota]);

    await Promise.all([
      gsClearAndWrite('Sueldos', rowsS),
      gsClearAndWrite('Deudas', rowsD),
      gsClearAndWrite('Gastos', rowsG),
      gsClearAndWrite('Abonos', rowsA),
    ]);
    showToast('☁️ Todo guardado y actualizado', 'success');
  } catch (e) {
    showToast('❌ Error al guardar', 'danger');
  }
}
