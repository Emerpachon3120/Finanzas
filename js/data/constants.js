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
  'Mercado':                '#10b981',
  'Restaurantes':           '#10b981',
  'Domicilios':             '#10b981',
  'Snacks y onces':         '#10b981',
  'Bebidas':                '#10b981',
  'Arriendo':               '#0ea5e9',
  'Luz':                    '#0ea5e9',
  'Gas':                    '#0ea5e9',
  'Agua':                   '#0ea5e9',
  'Internet y TV':          '#0ea5e9',
  'Mantenimiento hogar':    '#0ea5e9',
  'Mascotas':               '#0ea5e9',
  'Gasolina':               '#f59e0b',
  'Transporte público':     '#f59e0b',
  'Mantenimiento vehículo': '#f59e0b',
  'Parqueadero':            '#f59e0b',
  'Peajes':                 '#f59e0b',
  'Médico y citas':         '#06b6d4',
  'Medicamentos':           '#06b6d4',
  'Gym y deporte':          '#06b6d4',
  'Óptica':                 '#06b6d4',
  'Odontología':            '#06b6d4',
  'Cursos':                 '#3b82f6',
  'Libros':                 '#3b82f6',
  'Útiles':                 '#3b82f6',
  'Matrícula':              '#3b82f6',
  'Academia hijos':         '#3b82f6',
  'Streaming':              '#ec4899',
  'Salidas':                '#ec4899',
  'Viajes':                 '#ec4899',
  'Cine':                   '#ec4899',
  'Juegos':                 '#ec4899',
  'Ropa y calzado':         '#8b5cf6',
  'Belleza y cuidado personal': '#8b5cf6',
  'Regalos':                '#8b5cf6',
  'Préstamos a otros':      '#8b5cf6',
  'Deudas':                 '#ef4444',
  'Ahorro':                 '#22c55e',
  'Seguros':                '#94a3b8',
  'Impuestos':              '#94a3b8',
  'Ayuda a padres':         '#f97316',
  'Hijos':                  '#f97316',
  'Otros familiares':       '#f97316',
  'Herramientas trabajo':   '#64748b',
  'Suscripciones trabajo':  '#64748b',
  'Otro':                   '#94a3b8',
};

// Credenciales Google Sheets (BD externa)
const GS_CLIENT_ID = '415620967213-bv39a2f097ut8e5askabhd4h8g7pkg48.apps.googleusercontent.com';
const GS_SHEET_ID  = '1z6QLwhrfKpcd9QSfnwKURZ58g-MTSSOY3pRutVVbz1U';
const GS_SCOPES    = 'https://www.googleapis.com/auth/spreadsheets';
