/* =====================================================================
   js/data/constants.js — Constantes globales de la aplicación
   ===================================================================== */

// Nombres de los meses en español
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

// Colores por categoría de gasto
const catColors = {
  'Vivienda':        '#0ea5e9',
  'Alimentación':    '#10b981',
  'Transporte':      '#f59e0b',
  'Servicios':       '#8b5cf6',
  'Deudas':          '#ef4444',
  'Salud':           '#06b6d4',
  'Educación':       '#3b82f6',
  'Entretenimiento': '#ec4899',
  'Ahorro':          '#22c55e',
  'Otro':            '#94a3b8'
};

// Credenciales Google Sheets (BD externa)
const GS_CLIENT_ID = '415620967213-bv39a2f097ut8e5askabhd4h8g7pkg48.apps.googleusercontent.com';
const GS_SHEET_ID  = '1z6QLwhrfKpcd9QSfnwKURZ58g-MTSSOY3pRutVVbz1U';
const GS_SCOPES    = 'https://www.googleapis.com/auth/spreadsheets';
