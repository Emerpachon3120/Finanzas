/* =====================================================================
   js/modules/components/estrategia.js — Estrategia de pago de deudas
   Comparativa Avalancha vs Bola de Nieve con vistas: resumen, orden, timeline.
   ===================================================================== */

function renderEstrategia() {
  const extra = parseFloat(document.getElementById('est-extra')?.value) || 0;
  const vista = document.getElementById('est-vista')?.value || 'resumen';
  const el    = document.getElementById('estrategia-resultado');
  if (!el) return;

  const activas = deudas.filter(d => !d.pagada && d.saldo > 0 && d.cuota > 0);
  if (!activas.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div>No tienes deudas activas.</div>`;
    return;
  }

  const aval = simularEstrategia(ordenAvalanche, extra);
  const snow = simularEstrategia(ordenSnowball,  extra);
  if (!aval || !snow) return;

  const ganador      = aval.interesTotal <= snow.interesTotal ? 'avalanche' : 'snowball';
  const ahorroInteres = Math.abs(aval.interesTotal - snow.interesTotal);
  const ahorroMeses   = Math.abs(aval.meses - snow.meses);

  // ── Vista: Resumen ────────────────────────────────────────────
  if (vista === 'resumen') {
    el.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(99,102,241,0.04));border-color:rgba(14,165,233,0.22);margin-bottom:14px;">
        <p class="section-title">🏆 Recomendación para tu caso</p>
        <div style="font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:${extra === 0 ? '14px' : '0'};">
          ${ganador === 'avalanche'
            ? `Con tus deudas actuales, la <strong style="color:var(--accent);">Estrategia Avalancha</strong> te ahorra <strong style="color:var(--success);font-family:'JetBrains Mono',monospace;">${fmt(ahorroInteres)}</strong> en intereses${ahorroMeses > 0 ? ` y <strong style="color:var(--success);">${ahorroMeses} mes(es)</strong> de pagos` : ''} frente a la Bola de Nieve.`
            : `Con tus deudas actuales, la <strong style="color:var(--purple);">Bola de Nieve</strong> termina ${ahorroMeses > 0 ? `<strong style="color:var(--success);">${ahorroMeses} mes(es)</strong> antes y ` : ''}ahorra <strong style="color:var(--success);font-family:'JetBrains Mono',monospace;">${fmt(ahorroInteres)}</strong> en intereses frente a Avalancha.`}
        </div>
        ${extra === 0 ? `<div class="alert-box" style="margin-bottom:0;margin-top:14px;">💡 <strong>Tip:</strong> Agrega un monto extra mensual arriba para ver cómo aceleras tu libertad financiera.</div>` : ''}
      </div>

      <div class="two-col" style="margin-bottom:14px;">
        <div class="card" style="border-color:${ganador === 'avalanche' ? 'rgba(14,165,233,0.4)' : 'var(--border)'};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <span style="font-size:24px;">⚡</span>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:14px;color:var(--accent);">Avalancha</div>
              <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">Mayor tasa primero</div>
            </div>
            ${ganador === 'avalanche' ? '<span class="badge badge-info">✓ MEJOR</span>' : ''}
          </div>
          <div class="income-row"><span>Tiempo total</span><span style="font-family:'JetBrains Mono',monospace;font-weight:700;">${mesesATexto(aval.meses)}</span></div>
          <div class="income-row"><span>Intereses totales</span><span class="red" style="font-family:'JetBrains Mono',monospace;">${fmt(aval.interesTotal)}</span></div>
          <div class="income-row"><span>Libre en</span><span style="font-weight:700;color:var(--success);font-family:'JetBrains Mono',monospace;">${aval.fechaFin.toLocaleDateString('es-CO',{month:'short',year:'numeric'})}</span></div>
          <div class="income-row" style="border:none;"><span>Ataca primero</span><span style="font-weight:700;font-size:12px;">${ordenAvalanche(activas.map(d=>({...d,saldoSim:d.saldo})))[0]?.nombre||'—'}</span></div>
          <div style="margin-top:10px;padding:10px 12px;background:var(--blue-bg);border-radius:10px;font-size:12px;color:var(--text2);line-height:1.6;">
            <strong>Matemáticamente óptimo.</strong> Minimiza el costo total del dinero pagando primero lo más caro.
          </div>
        </div>

        <div class="card" style="border-color:${ganador === 'snowball' ? 'rgba(139,92,246,0.4)' : 'var(--border)'};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <span style="font-size:24px;">⛄</span>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:14px;color:var(--purple);">Bola de Nieve</div>
              <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">Menor saldo primero</div>
            </div>
            ${ganador === 'snowball' ? '<span class="badge" style="background:var(--purple-bg);color:var(--purple);border:1px solid rgba(139,92,246,0.25);">✓ MEJOR</span>' : ''}
          </div>
          <div class="income-row"><span>Tiempo total</span><span style="font-family:'JetBrains Mono',monospace;font-weight:700;">${mesesATexto(snow.meses)}</span></div>
          <div class="income-row"><span>Intereses totales</span><span class="red" style="font-family:'JetBrains Mono',monospace;">${fmt(snow.interesTotal)}</span></div>
          <div class="income-row"><span>Libre en</span><span style="font-weight:700;color:var(--success);font-family:'JetBrains Mono',monospace;">${snow.fechaFin.toLocaleDateString('es-CO',{month:'short',year:'numeric'})}</span></div>
          <div class="income-row" style="border:none;"><span>Ataca primero</span><span style="font-weight:700;font-size:12px;">${ordenSnowball(activas.map(d=>({...d,saldoSim:d.saldo})))[0]?.nombre||'—'}</span></div>
          <div style="margin-top:10px;padding:10px 12px;background:var(--purple-bg);border-radius:10px;font-size:12px;color:var(--text2);line-height:1.6;">
            <strong>Psicológicamente motivador.</strong> Victorias rápidas que mantienen el impulso de pago.
          </div>
        </div>
      </div>

      <div class="card" style="background:var(--green-bg);border-color:rgba(16,185,129,0.22);">
        <p class="section-title" style="color:var(--success);">💰 Diferencia entre estrategias</p>
        <div class="metric-grid">
          <div class="metric"><div class="metric-label">Ahorro en intereses</div><div class="metric-value green">${fmt(ahorroInteres)}</div><div class="metric-sub">a favor de ${ganador === 'avalanche' ? 'Avalancha' : 'Bola de nieve'}</div></div>
          <div class="metric"><div class="metric-label">Meses de diferencia</div><div class="metric-value">${ahorroMeses}</div><div class="metric-sub">mes(es) más rápido</div></div>
          <div class="metric"><div class="metric-label">Extra mensual</div><div class="metric-value blue">${fmt(extra)}</div><div class="metric-sub">${extra > 0 ? 'Aplicado a deuda líder' : 'Sin extra'}</div></div>
        </div>
      </div>`;

  // ── Vista: Orden ──────────────────────────────────────────────
  } else if (vista === 'orden') {
    const avalOrden = ordenAvalanche(activas.map(d => ({ ...d, saldoSim: d.saldo })));
    const snowOrden = ordenSnowball(activas.map(d => ({ ...d, saldoSim: d.saldo })));
    const row = (d, i, color, etiq) => `
      <li style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);">
        <div style="width:28px;height:28px;border-radius:50%;background:${color}18;border:1.5px solid ${color}40;color:${color};font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.nombre}</div>
          <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;">Saldo: ${fmt(d.saldo)} · ${d.tasa}% E.A.</div>
        </div>
        <span class="badge" style="background:${color}12;color:${color};border:1px solid ${color}30;flex-shrink:0;">${etiq(d)}</span>
      </li>`;
    el.innerHTML = `
      <div class="two-col">
        <div class="card"><p class="section-title" style="color:var(--accent);">⚡ Orden Avalancha</p>
          <p style="font-size:12px;color:var(--text3);margin-bottom:12px;">Mayor tasa → menor tasa</p>
          <ul style="list-style:none;">${avalOrden.map((d, i) => row(d, i, '#0ea5e9', d => d.tasa + '% E.A.')).join('')}</ul></div>
        <div class="card"><p class="section-title" style="color:var(--purple);">⛄ Orden Bola de Nieve</p>
          <p style="font-size:12px;color:var(--text3);margin-bottom:12px;">Menor saldo → mayor saldo</p>
          <ul style="list-style:none;">${snowOrden.map((d, i) => row(d, i, '#8b5cf6', d => fmt(d.saldo))).join('')}</ul></div>
      </div>`;

  // ── Vista: Timeline ───────────────────────────────────────────
  } else if (vista === 'timeline') {
    const avalMap = {}, snowMap = {};
    aval.deudas.forEach(d => { avalMap[d.nombre] = d.pagadaEnMes || aval.meses; });
    snow.deudas.forEach(d => { snowMap[d.nombre] = d.pagadaEnMes || snow.meses; });
    const maxM = Math.max(aval.meses, snow.meses, 1);

    const rows = activas.map(d => {
      const mA = avalMap[d.nombre] || maxM;
      const mS = snowMap[d.nombre] || maxM;
      const pA = Math.round(mA / maxM * 100);
      const pS = Math.round(mS / maxM * 100);
      return `<div style="margin-bottom:18px;">
        <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px;">${d.nombre}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
          <span style="font-size:11px;color:var(--accent);width:14px;">⚡</span>
          <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;"><div style="width:${pA}%;height:100%;background:var(--accent);border-radius:4px;"></div></div>
          <span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;min-width:44px;text-align:right;">${mesesATexto(mA)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:var(--purple);width:14px;">⛄</span>
          <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;"><div style="width:${pS}%;height:100%;background:var(--purple);border-radius:4px;"></div></div>
          <span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;min-width:44px;text-align:right;">${mesesATexto(mS)}</span>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `<div class="card">
      <p class="section-title">📅 Cuándo se paga cada deuda</p>
      <div style="display:flex;gap:16px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;"><div style="width:18px;height:3px;background:var(--accent);border-radius:2px;"></div> Avalancha</div>
        <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;"><div style="width:18px;height:3px;background:var(--purple);border-radius:2px;"></div> Bola de nieve</div>
      </div>
      ${rows}
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;border-top:1px solid var(--border);padding-top:8px;margin-top:4px;">
        <span>Hoy</span><span>${mesesATexto(maxM)}</span>
      </div>
    </div>`;
  }
}
