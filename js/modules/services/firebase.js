/* =====================================================================
   js/modules/services/firebase.js — Conector con Firebase Firestore
   ===================================================================== */

const firebaseConfig = {
  apiKey:            "AIzaSyBqJZzlswDFjhY1A6XET1kdsRAR1tDSX9g",
  authDomain:        "finanzas-personales-bddb4.firebaseapp.com",
  projectId:         "finanzas-personales-bddb4",
  storageBucket:     "finanzas-personales-bddb4.firebasestorage.app",
  messagingSenderId: "804309758824",
  appId:             "1:804309758824:web:45715418a83e09dd6ddcdd"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function cargarDesdeFirebase() {
  try {
    showToast('🔗 Cargando datos...', 'info');

    const [snapS, snapD, snapG, snapA] = await Promise.all([
      db.collection('sueldos').get(),
      db.collection('deudas').get(),
      db.collection('gastos').get(),
      db.collection('abonos').get(),
    ]);

    sueldos = snapS.docs.map(d => d.data());

    deudas = snapD.docs.map(d => {
      const data = d.data();
      const tasa = data.tasa || 0;
      return {
        ...data,
        badge: tasa >= 40 ? 'danger' : tasa >= 20 ? 'warning' : tasa > 0 ? 'info' : 'success',
      };
    });

    gastosPorMes = {};
    snapG.docs.forEach(d => {
      const data = d.data();
      const mes  = data.mes;
      if (!gastosPorMes[mes]) gastosPorMes[mes] = [];
      gastosPorMes[mes].push(data);
    });

    abonoHistorial = snapA.docs.map(d => d.data())
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    _sincronizarContadorIds();
    actualizarTodo();

    const bv = document.getElementById('bienvenida-screen');
    if (bv) bv.style.display = 'none';

    const btnSave = document.getElementById('btn-gsave');
    if (btnSave) btnSave.style.display = '';

    const btnSync = document.getElementById('btn-gsync');
    if (btnSync) { btnSync.textContent = '✅ Conectado'; btnSync.disabled = true; }

    bdCargada = true;
    showToast('✅ Datos cargados correctamente', 'success');
  } catch (err) {
    console.error('[firebase]', err);
    showToast('❌ Error al cargar: ' + err.message, 'danger');
  }
}

async function guardarEnFirebase() {
  try {
    showToast('☁️ Guardando...', 'info');
    const batch = db.batch();

    const [snapS, snapD, snapG, snapA] = await Promise.all([
      db.collection('sueldos').get(),
      db.collection('deudas').get(),
      db.collection('gastos').get(),
      db.collection('abonos').get(),
    ]);

    snapS.docs.forEach(d => batch.delete(d.ref));
    sueldos.forEach(s => batch.set(db.collection('sueldos').doc(String(s.id)), s));

    snapD.docs.forEach(d => batch.delete(d.ref));
    deudas.forEach(d => batch.set(db.collection('deudas').doc(String(d.id)), d));

    snapG.docs.forEach(d => batch.delete(d.ref));
    Object.entries(gastosPorMes).forEach(([mes, lista]) => {
      lista.forEach(g => batch.set(db.collection('gastos').doc(String(g.id)), { ...g, mes }));
    });

    snapA.docs.forEach(d => batch.delete(d.ref));
    abonoHistorial.forEach(a => batch.set(db.collection('abonos').doc(String(a.id)), { ...a, ts: a.ts || Date.now() }));

    await batch.commit();
    showToast('☁️ Todo guardado correctamente', 'success');
  } catch (err) {
    console.error('[firebase]', err);
    showToast('❌ Error al guardar: ' + err.message, 'danger');
  }
}

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

// ── Operaciones individuales ──────────────────────────────────────

async function fbGuardarSueldo(s) {
  await db.collection('sueldos').doc(String(s.id)).set(s);
}

async function fbEliminarSueldo(id) {
  await db.collection('sueldos').doc(String(id)).delete();
}

async function fbGuardarDeuda(d) {
  await db.collection('deudas').doc(String(d.id)).set(d);
}

async function fbEliminarDeuda(id) {
  await db.collection('deudas').doc(String(id)).delete();
}