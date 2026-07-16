/* =====================================================================
   js/modules/services/firebase.js — Conector con Firebase Firestore
   Ahora con datos separados por usuario (multiusuario).
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

// ── Helper: obtiene la referencia a la carpeta del usuario actual ──

function userCollection(nombre) {
  if (!currentUser) throw new Error('No hay usuario autenticado');
  return db.collection('usuarios').doc(currentUser.uid).collection(nombre);
}

// ── Carga y procesamiento de datos ───────────────────────────────

async function cargarDesdeFirebase() {
  try {
    showToast('🔗 Cargando datos...', 'info');

    const [snapS, snapD, snapG, snapA, snapP, snapI, snapE, snapM] = await Promise.all([
      userCollection('sueldos').get(),
      userCollection('deudas').get(),
      userCollection('gastos').get(),
      userCollection('abonos').get(),
      userCollection('prestamos').get(),
      userCollection('ingresos_recibidos').get(),
      userCollection('ingresos_extra').get(),
      userCollection('metas').get(),
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

    prestamos = snapP.docs.map(d => d.data())
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    // Cada doc de ingresos_recibidos tiene el ID "mes_sueldoId" y un campo "recibido"
    ingresosRecibidos = {};
    snapI.docs.forEach(d => {
      const data = d.data();
      if (!ingresosRecibidos[data.mes]) ingresosRecibidos[data.mes] = {};
      ingresosRecibidos[data.mes][data.sueldoId] = data.recibido;
    });

    // Ingresos extra por mes (ej: préstamos cobrados)
    ingresosExtra = {};
    snapE.docs.forEach(d => {
      const data = d.data();
      if (!ingresosExtra[data.mes]) ingresosExtra[data.mes] = [];
      ingresosExtra[data.mes].push(data);
    });

    // Metas de ahorro
    metas = snapM.docs.map(d => d.data())
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    _sincronizarContadorIds();
    actualizarTodo();

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

    const [snapS, snapD, snapG, snapA, snapP, snapI, snapE, snapM] = await Promise.all([
      userCollection('sueldos').get(),
      userCollection('deudas').get(),
      userCollection('gastos').get(),
      userCollection('abonos').get(),
      userCollection('prestamos').get(),
      userCollection('ingresos_recibidos').get(),
      userCollection('ingresos_extra').get(),
      userCollection('metas').get(),
    ]);

    snapS.docs.forEach(d => batch.delete(d.ref));
    sueldos.forEach(s => batch.set(userCollection('sueldos').doc(String(s.id)), s));

    snapD.docs.forEach(d => batch.delete(d.ref));
    deudas.forEach(d => batch.set(userCollection('deudas').doc(String(d.id)), d));

    snapG.docs.forEach(d => batch.delete(d.ref));
    Object.entries(gastosPorMes).forEach(([mes, lista]) => {
      lista.forEach(g => batch.set(userCollection('gastos').doc(String(g.id)), { ...g, mes }));
    });

    snapA.docs.forEach(d => batch.delete(d.ref));
    abonoHistorial.forEach(a => batch.set(userCollection('abonos').doc(String(a.id)), { ...a, ts: a.ts || Date.now() }));

    snapP.docs.forEach(d => batch.delete(d.ref));
    prestamos.forEach(p => batch.set(userCollection('prestamos').doc(String(p.id)), p));

    snapI.docs.forEach(d => batch.delete(d.ref));
    Object.entries(ingresosRecibidos).forEach(([mes, sueldosObj]) => {
      Object.entries(sueldosObj).forEach(([sueldoId, recibido]) => {
        const docId = `${mes}_${sueldoId}`;
        batch.set(userCollection('ingresos_recibidos').doc(docId), { mes, sueldoId: parseInt(sueldoId), recibido });
      });
    });

    snapE.docs.forEach(d => batch.delete(d.ref));
    Object.entries(ingresosExtra).forEach(([mes, lista]) => {
      lista.forEach(e => batch.set(userCollection('ingresos_extra').doc(String(e.id)), { ...e, mes }));
    });

    snapM.docs.forEach(d => batch.delete(d.ref));
    metas.forEach(m => batch.set(userCollection('metas').doc(String(m.id)), m));

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
    ...prestamos.map(x => x.id),
    ...Object.values(gastosPorMes).flat().map(x => x.id),
    ...Object.values(ingresosExtra).flat().map(x => x.id),
    ...metas.map(x => x.id),
  ].filter(id => typeof id === 'number' && isFinite(id));

  if (todosLosIds.length > 0) {
    const maxId = Math.max(...todosLosIds);
    if (maxId >= nextId) nextId = maxId + 1;
  }
}

// ── Operaciones individuales ──────────────────────────────────────

async function fbGuardarSueldo(s) {
  await userCollection('sueldos').doc(String(s.id)).set(s);
}

async function fbEliminarSueldo(id) {
  await userCollection('sueldos').doc(String(id)).delete();
}

async function fbGuardarDeuda(d) {
  await userCollection('deudas').doc(String(d.id)).set(d);
}

async function fbEliminarDeuda(id) {
  await userCollection('deudas').doc(String(id)).delete();
}

async function fbGuardarAbono(a) {
  await userCollection('abonos').doc(String(a.id)).set(a);
}

async function fbEliminarAbono(id) {
  await userCollection('abonos').doc(String(id)).delete();
}

async function fbGuardarGasto(g) {
  await userCollection('gastos').doc(String(g.id)).set(g);
}

async function fbEliminarGasto(id) {
  await userCollection('gastos').doc(String(id)).delete();
}

async function fbGuardarPrestamo(p) {
  await userCollection('prestamos').doc(String(p.id)).set(p);
}

async function fbEliminarPrestamo(id) {
  await userCollection('prestamos').doc(String(id)).delete();
}

// ── Ingresos recibidos (por mes y sueldo) ─────────────────────────

async function fbGuardarIngresoRecibido(mes, sueldoId, recibido) {
  const docId = `${mes}_${sueldoId}`;
  await userCollection('ingresos_recibidos').doc(docId).set({ mes, sueldoId, recibido });
}

// ── Ingresos extra (ej: préstamos cobrados) ───────────────────────

async function fbGuardarIngresoExtra(e) {
  await userCollection('ingresos_extra').doc(String(e.id)).set(e);
}

async function fbEliminarIngresoExtra(id) {
  await userCollection('ingresos_extra').doc(String(id)).delete();
}

// ── Metas de ahorro ────────────────────────────────────────────────

async function fbGuardarMeta(m) {
  await userCollection('metas').doc(String(m.id)).set(m);
}

async function fbEliminarMeta(id) {
  await userCollection('metas').doc(String(id)).delete();
}