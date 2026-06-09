/* =====================================================================
   js/modules/services/firebase.js — Conector con Firebase Firestore
   Reemplaza sheets.js. Maneja lectura y escritura de datos.
   ===================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBqJZzlswDFjhY1A6XET1kdsRAR1tDSX9g",
  authDomain:        "finanzas-personales-bddb4.firebaseapp.com",
  projectId:         "finanzas-personales-bddb4",
  storageBucket:     "finanzas-personales-bddb4.firebasestorage.app",
  messagingSenderId: "804309758824",
  appId:             "1:804309758824:web:45715418a83e09dd6ddcdd"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Carga de datos ────────────────────────────────────────────────

async function cargarDesdeFirebase() {
  try {
    showToast('🔗 Cargando datos...', 'info');

    const [snapS, snapD, snapG, snapA] = await Promise.all([
      getDocs(collection(db, 'sueldos')),
      getDocs(collection(db, 'deudas')),
      getDocs(collection(db, 'gastos')),
      getDocs(collection(db, 'abonos')),
    ]);

    sueldos = snapS.docs.map(d => ({ ...d.data() }));

    deudas  = snapD.docs.map(d => {
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

    abonoHistorial = snapA.docs.map(d => ({ ...d.data() }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    _sincronizarContadorIds();
    actualizarTodo();

    const bv = document.getElementById('bienvenida-screen');
    if (bv) bv.style.display = 'none';

    // Mostrar botón guardar
    const btnSave = document.getElementById('btn-gsave');
    if (btnSave) btnSave.style.display = '';

    // Actualizar botón conectar
    const btnSync = document.getElementById('btn-gsync');
    if (btnSync) { btnSync.textContent = '✅ Conectado'; btnSync.disabled = true; }

    bdCargada = true;
    showToast('✅ Datos cargados correctamente', 'success');
  } catch (err) {
    console.error('[firebase]', err);
    showToast('❌ Error al cargar datos: ' + err.message, 'danger');
  }
}

// ── Guardado de datos ─────────────────────────────────────────────

async function guardarEnFirebase() {
  try {
    showToast('☁️ Guardando...', 'info');
    const batch = writeBatch(db);

    // Sueldos
    const snapS = await getDocs(collection(db, 'sueldos'));
    snapS.docs.forEach(d => batch.delete(d.ref));
    sueldos.forEach(s => {
      batch.set(doc(db, 'sueldos', String(s.id)), s);
    });

    // Deudas
    const snapD = await getDocs(collection(db, 'deudas'));
    snapD.docs.forEach(d => batch.delete(d.ref));
    deudas.forEach(d => {
      batch.set(doc(db, 'deudas', String(d.id)), d);
    });

    // Gastos
    const snapG = await getDocs(collection(db, 'gastos'));
    snapG.docs.forEach(d => batch.delete(d.ref));
    Object.entries(gastosPorMes).forEach(([mes, lista]) => {
      lista.forEach(g => {
        batch.set(doc(db, 'gastos', String(g.id)), { ...g, mes });
      });
    });

    // Abonos
    const snapA = await getDocs(collection(db, 'abonos'));
    snapA.docs.forEach(d => batch.delete(d.ref));
    abonoHistorial.forEach(a => {
      batch.set(doc(db, 'abonos', String(a.id)), { ...a, ts: a.ts || Date.now() });
    });

    await batch.commit();
    showToast('☁️ Todo guardado correctamente', 'success');
  } catch (err) {
    console.error('[firebase]', err);
    showToast('❌ Error al guardar: ' + err.message, 'danger');
  }
}

// ── Sincronización de IDs ─────────────────────────────────────────

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
