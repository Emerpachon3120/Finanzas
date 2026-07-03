/* =====================================================================
   js/data/state.js — Estado mutable de la aplicación
   Centraliza todas las variables que cambian durante el uso.
   ===================================================================== */

// ── Datos del dominio ─────────────────────────────────────────────
var sueldos       = [];
var deudas        = [];
var gastosPorMes  = {};
var abonoHistorial = [];
var prestamos = [];

// ── Sesión / tiempo ───────────────────────────────────────────────
var now       = new Date();
var mesActual = { year: now.getFullYear(), month: now.getMonth() };

// ── Estado de la base de datos ────────────────────────────────────
var bdCargada = false;

// ── Estado de UI: filtros y ordenamiento ──────────────────────────
var debtFilter        = 'todas';
var gastoFilterCat    = 'todas';
var gastoFilterFuente = 'todas';
var gastoSortField    = 'fecha-desc';
var gSortField        = null;
var gSortDir          = 1;

// ── Estado de edición activa ──────────────────────────────────────
var editingSalaryId = null;
var editingDebtId   = null;
var editingGastoId  = null;

// ── Confirmación pendiente ────────────────────────────────────────
var pendingConfirm = null;

// ── Selección de historial ────────────────────────────────────────
var selectedHistorialMes = null;

// ── Contador de IDs autoincremental ──────────────────────────────
var nextId = 100;
