/* =====================================================================
   js/main.js — Punto de entrada de la aplicación
   Inicialización y función de actualización global.
   ===================================================================== */

/**
 * Refresca toda la interfaz de usuario.
 * Llamado tras cargar datos desde Sheets o aplicar cambios masivos.
 */
function actualizarTodo() {
  if (typeof populateFuenteSelects === 'function') populateFuenteSelects();
  if (typeof populateAmortSelect   === 'function') populateAmortSelect();
  if (typeof populateAbonoSelect   === 'function') populateAbonoSelect();
  renderResumen();
  renderDeudas();
  renderGastos();
  if (typeof renderHistorial  === 'function') renderHistorial();
  if (typeof renderAnalisis   === 'function') renderAnalisis();
}

// Alias para compatibilidad con llamadas existentes
var actualizarInterfazCompleta = actualizarTodo;

/**
 * Inicialización: se ejecuta al cargar la página.
 * Rellena selects y renderiza la vista inicial (resumen vacío hasta conectar GSheets).
 */
function init() {
  populateFuenteSelects();
  populateAmortSelect();
  populateAbonoSelect();
  renderResumen();
  renderDeudas();
  renderGastos();

  document.getElementById('header-date').textContent = `📅 ${MESES[now.getMonth()]} ${now.getFullYear()}`;
}

init();
