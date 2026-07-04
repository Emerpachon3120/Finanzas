/* =====================================================================
   js/modules/services/auth.js — Autenticación con Google
   ===================================================================== */

const auth = firebase.auth();
let currentUser = null;

// ── Login con Google ──────────────────────────────────────────────

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      currentUser = result.user;
      showToast(`👋 Bienvenido, ${currentUser.displayName}`, 'success');
    })
    .catch((err) => {
      console.error('[auth]', err);
      showToast('❌ Error al iniciar sesión: ' + err.message, 'danger');
    });
}

// ── Logout ─────────────────────────────────────────────────────────

function cerrarSesion() {
  auth.signOut().then(() => {
    currentUser = null;
    location.reload();
  });
}

// ── Observador de estado de sesión ────────────────────────────────
// Se ejecuta automáticamente cuando cambia el estado de login

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    mostrarAppLogueada(user);
  } else {
    currentUser = null;
    mostrarPantallaLogin();
  }
});

function mostrarAppLogueada(user) {
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'none';

  const userBadge = document.getElementById('user-badge');
  if (userBadge) {
    userBadge.style.display = 'flex';
    userBadge.innerHTML = `
      <img src="${user.photoURL}" style="width:24px;height:24px;border-radius:50%;" referrerpolicy="no-referrer"/>
      <span>${user.displayName}</span>
      <button onclick="cerrarSesion()" style="background:none;border:none;cursor:pointer;color:var(--text3);margin-left:4px;" title="Cerrar sesión">✕</button>
    `;
  }

  // Cargar datos del usuario desde Firebase
  if (typeof cargarDesdeFirebase === 'function') cargarDesdeFirebase();
}

function mostrarPantallaLogin() {
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'flex';

  const bienvenida = document.getElementById('bienvenida-screen');
  if (bienvenida) bienvenida.style.display = 'none';

  const userBadge = document.getElementById('user-badge');
  if (userBadge) userBadge.style.display = 'none';
}