/* =====================================================================
   js/modules/components/amortizacion.js — Simulador de amortización
   Genera la tabla cuota a cuota para una deuda seleccionada.
   ===================================================================== */

function populateAmortSelect() {
  const sel = document.getElementById('select-debt-amort');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  deudas.filter(d => !d.pagada).forEach(d => {
    const opt = document.createElement('option');
    opt.value       = d.id;
    opt.textContent = `${d.nombre}  —  ${fmt(d.saldo)}`;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
  buildAmort();
}

function buildAmort() {
  const sel = document.getElementById('select-debt-amort');
  if (!sel || !sel.value) return;
  const id = parseInt(sel.value);
  const d  = deudas.find(x => x.id === id);
  if (!d) return;

  const meses         = d.cuotas;
  const tasaMes       = d.tasa > 0 ? Math.pow(1 + d.tasa / 100, 1 / 12) - 1 : 0;
  let saldo           = d.saldo;
  const cuota         = d.cuota;
  const totalPagar    = cuota * meses;
  const totalIntereses = Math.max(0, totalPagar - d.saldo);

  document.getElementById('amort-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Saldo actual</div><div class="metric-value">${fmt(d.saldo)}</div></div>
    <div class="metric"><div class="metric-label">Cuota mensual</div><div class="metric-value">${fmt(cuota)}</div></div>
    <div class="metric"><div class="metric-label">Total a pagar</div><div class="metric-value">${fmt(totalPagar)}</div></div>
    <div class="metric"><div class="metric-label">Total intereses</div><div class="metric-value red">${fmt(totalIntereses)}</div></div>`;

  const tbody = document.getElementById('amort-body');
  tbody.innerHTML = '';
  for (let i = 1; i <= meses; i++) {
    const interes = d.tasa > 0 ? saldo * tasaMes : 0;
    const capital = cuota - interes;
    saldo = Math.max(0, saldo - capital);
    const ultimo = i === meses;
    tbody.innerHTML += `<tr ${ultimo ? 'class="highlight-row"' : ''}>
      <td>${i}</td>
      <td>${fmt(cuota)}</td>
      <td>${fmt(interes)}</td>
      <td>${fmt(capital)}</td>
      <td>${fmt(saldo)}</td>
    </tr>`;
  }
}
