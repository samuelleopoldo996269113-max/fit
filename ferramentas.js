/* =========================================================
   Fit – ferramentas extras (v0.5)
   Todas opcionais: liga/desliga em Perfil → Recursos do app.
   Carregado depois de recursos.js e antes do script principal.
   ========================================================= */
'use strict';

RECURSOS.push(
  ['anilhas', '🏋️', 'Calculadora de anilhas', 'Quais anilhas colocar na barra', true],
  ['biset', '🔗', 'Bi-set e supersérie', 'Juntar 2 exercícios seguidos sem descanso', true],
  ['notas', '📝', 'Anotações por exercício', 'Ex.: "banco na posição 4"', true],
  ['alongamento', '🧘', 'Alongamento pós-treino', '5 min guiado com cronômetro', true],
  ['rounds', '🥊', 'Timer de rounds (lutas)', 'Muay Thai, boxe: rounds e descanso', true],
  ['hiit', '⏱️', 'Timer de intervalado', 'HIIT, Tabata e EMOM', true],
  ['metadata', '🗓️', 'Meta com data', 'Peso alvo com contagem regressiva', true],
  ['medidas', '📐', 'Mais medidas e % de gordura', 'Peito, coxa, panturrilha, pescoço', true],
  ['proteina', '🍗', 'Diário de proteína', 'Botões rápidos somando a proteína do dia', true],
  ['diasfixos', '📅', 'Dias fixos de treino', 'Nos outros dias o Início mostra descanso', true],
  ['relatorio', '📄', 'Relatório mensal (PDF)', 'Para o personal, nutricionista ou médico', true],
  ['cores', '🎨', 'Cor do app', 'Roxo, azul, verde, vermelho ou preto', true]
);
function prepararFerramentas() {
  S.notas = S.notas || {}; S.protHist = S.protHist || {}; S.diasFixos = S.diasFixos || []; S.cor = S.cor || 'roxo';
}

// ---------- 1. Calculadora de anilhas ----------
const ANILHAS = [25, 20, 15, 10, 5, 2.5, 1.25];
const COR_ANILHA = {25:'#dc2626', 20:'#2563eb', 15:'#eab308', 10:'#16a34a', 5:'#f8fafc', 2.5:'#1f2937', 1.25:'#9ca3af'};
function calcAnilhas(total, barra) {
  let lado = (total - barra) / 2; const r = [];
  if (lado < 0) return {ok:false, lado:[], sobra:0};
  for (const p of ANILHAS) while (lado >= p - 1e-9) { r.push(p); lado = Math.round((lado - p) * 100) / 100; }
  return {ok:true, lado:r, sobra:lado};
}
function abrirAnilhas(kg) {
  modal(`<h2>🏋️ Calculadora de anilhas</h2>
  <div class="form-grid"><label>Peso total (kg)<input id="anKg" inputmode="decimal" value="${kg || ''}" placeholder="ex.: 80" oninput="mostrarAnilhas()"></label>
  <label>Barra<select id="anBarra" onchange="mostrarAnilhas()"><option value="20">Olímpica 20 kg</option><option value="15">Feminina 15 kg</option><option value="10">Curta / W 10 kg</option><option value="0">Sem barra (máquina)</option></select></label></div>
  <div id="anRes"></div><button class="btn sec grande" onclick="fecharModal()">Fechar</button>`);
  mostrarAnilhas();
}
function mostrarAnilhas() {
  const el = $('#anRes'); if (!el) return;
  const kg = num($('#anKg').value), barra = +$('#anBarra').value;
  if (!kg) { el.innerHTML = '<p class="sub">Digite o peso total que você quer levantar.</p>'; return; }
  const r = calcAnilhas(kg, barra);
  if (!r.ok) { el.innerHTML = `<p class="sub">O peso é menor que a barra (${barra} kg).</p>`; return; }
  const desenho = r.lado.map(p => `<i style="background:${COR_ANILHA[p]};height:${40 + p * 3.2}px" title="${fmtN(p, 2)} kg"></i>`).join('');
  el.innerHTML = `<div class="barra-anilhas"><span class="ponta"></span>${desenho}<span class="haste"></span></div>
  <p><b>Em cada lado:</b> ${r.lado.length ? r.lado.map(p => fmtN(p, 2) + ' kg').join(' + ') : 'nenhuma anilha'}</p>
  ${r.sobra > 0 ? `<p class="aviso">Sobram ${fmtN(r.sobra * 2)} kg que não fecham com as anilhas comuns. Total possível: ${fmtN(kg - r.sobra * 2)} kg.</p>` : ''}`;
}

// ---------- 2. Bi-set ----------
function alternarBiset(pid, di, ei) {
  const x = acharPlano(pid).dias[di].exercicios[ei]; x.biset = !x.biset; save(); render();
  toast(x.biset ? '🔗 Bi-set criado com o próximo exercício' : 'Bi-set desfeito');
}

// ---------- 3. Anotações ----------
function linhaNota(exId) {
  if (!R('notas')) return '';
  const n = S.notas[exId];
  return `<button class="nota-ex" onclick="editarNota('${exId}')">📝 ${n ? h(n) : '<span class="sub">Adicionar anotação</span>'}</button>`;
}
function editarNota(exId) {
  window._notaEx = exId;
  modal(`<h2>📝 ${h(EXM[exId].nome)}</h2><p class="sub">Ex.: "banco na posição 4", "pegada fechada", "pino no 7".</p>
  <textarea class="codigo" id="notaTxt" style="min-height:90px;font-family:inherit;font-size:15px" maxlength="200">${h(S.notas[exId] || '')}</textarea>
  <div class="acoes"><button class="btn sec" onclick="S.notas[_notaEx]='';save();fecharModal();render()">Apagar</button><button class="btn" onclick="S.notas[_notaEx]=$('#notaTxt').value.trim();save();fecharModal();render()">Salvar</button></div>`);
}

// ---------- 4/5/6. Timer grande (alongamento, rounds, intervalado) ----------
const TM = {fases:[], i:0, fim:0, rest:0, pausado:false, iv:null, titulo:'', wake:null};
const ALONG = {
  geral:['Respiração profunda (inspire 4 s, solte 6 s)'],
  sup:['Peito na parede (cada lado)', 'Ombro cruzado (cada lado)', 'Tríceps atrás da cabeça (cada lado)', 'Pescoço: orelha no ombro (cada lado)'],
  inf:['Posterior de coxa sentado', 'Quadríceps em pé (cada lado)', 'Glúteo: perna cruzada deitado', 'Panturrilha na parede (cada lado)'],
  costas:['Postura da criança (costas)', 'Gato e vaca, devagar']
};
function iniciarAlongamento(grupos) {
  const g = new Set(grupos || []), l = [];
  const sup = !grupos || ['peito','costas','ombro','biceps','triceps','trapezio','antebraco'].some(x => g.has(x)), inf = !grupos || ['quadriceps','posterior','gluteo','panturrilha'].some(x => g.has(x));
  if (sup) l.push(...ALONG.sup); if (inf) l.push(...ALONG.inf); l.push(...ALONG.costas, ...ALONG.geral);
  const f = []; l.slice(0, 10).forEach(n => { f.push({nome:n, s:30, tipo:'trabalho'}); f.push({nome:'Troca', s:5, tipo:'pausa'}); }); f.pop();
  abrirTimer('🧘 Alongamento', f, true);
}
function configTimer(modo) {
  modo = modo || (R('rounds') ? 'rounds' : 'tabata');
  const M = {
    rounds:{t:'🥊 Rounds (lutas)', w:180, r:60, n:3, prep:10},
    tabata:{t:'🔥 Tabata', w:20, r:10, n:8, prep:10},
    hiit:{t:'⚡ HIIT 30/30', w:30, r:30, n:10, prep:10},
    emom:{t:'⏱️ EMOM', w:60, r:0, n:10, prep:10},
    livre:{t:'⚙️ Personalizado', w:45, r:15, n:8, prep:10}
  };
  const modos = Object.keys(M).filter(k => k === 'rounds' ? R('rounds') : R('hiit'));
  if (!modos.includes(modo)) modo = modos[0];
  const c = S.timerCfg && S.timerCfg[modo] || M[modo];
  window._tmModo = modo;
  modal(`<h2>${M[modo].t}</h2>
  <div class="chips">${modos.map(k => `<button class="chip-btn ${k === modo ? 'on' : ''}" onclick="configTimer('${k}')">${M[k].t}</button>`).join('')}</div>
  <div class="form-grid">
    <label>${modo === 'rounds' ? 'Tempo do round' : modo === 'emom' ? 'Cada minuto (s)' : 'Trabalho'} (seg)<input id="tmW" inputmode="numeric" value="${c.w}"></label>
    ${modo === 'emom' ? '' : `<label>Descanso (seg)<input id="tmR" inputmode="numeric" value="${c.r}"></label>`}
    <label>${modo === 'rounds' ? 'Rounds' : 'Rodadas'}<input id="tmN" inputmode="numeric" value="${c.n}"></label>
    <label>Preparar (seg)<input id="tmP" inputmode="numeric" value="${c.prep}"></label>
  </div>
  <p class="sub">${modo === 'rounds' ? 'Bipe no início e fim de cada round, e aviso nos 10 segundos finais.' : modo === 'emom' ? 'A cada minuto, faça as repetições e descanse o resto do minuto.' : 'Bipe a cada troca entre trabalho e descanso.'}</p>
  <button class="btn grande" onclick="comecarTimer()">▶ Começar</button>`);
}
function comecarTimer() {
  const modo = window._tmModo, w = Math.max(5, +$('#tmW').value || 30), r = $('#tmR') ? Math.max(0, +$('#tmR').value || 0) : 0, n = Math.max(1, Math.min(50, +$('#tmN').value || 1)), p = Math.max(0, +$('#tmP').value || 0);
  S.timerCfg = S.timerCfg || {}; S.timerCfg[modo] = {w, r, n, prep:p}; save();
  const f = []; if (p) f.push({nome:'Prepare-se', s:p, tipo:'pausa'});
  for (let i = 1; i <= n; i++) { f.push({nome:(modo === 'rounds' ? 'Round ' : 'Rodada ') + i + ' de ' + n, s:w, tipo:'trabalho', aviso10:modo === 'rounds'}); if (r && i < n) f.push({nome:'Descanso', s:r, tipo:'pausa'}); }
  fecharModal(); abrirTimer({rounds:'🥊 Rounds', tabata:'🔥 Tabata', hiit:'⚡ HIIT', emom:'⏱️ EMOM', livre:'⚙️ Intervalado'}[modo], f);
}
function abrirTimer(titulo, fases, calmo) {
  Object.assign(TM, {fases, i:0, titulo, pausado:false, calmo:!!calmo}); TM.fim = Date.now() + fases[0].s * 1000;
  desbloquearAudio(); try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => TM.wake = w).catch(() => {}); } catch (err) {}
  let el = $('#timerGrande'); if (!el) { el = document.createElement('div'); el.id = 'timerGrande'; document.body.appendChild(el); }
  el.className = 'tg' + (calmo ? ' calmo' : ''); el.innerHTML = `<div class="tg-topo"><b>${titulo}</b><button onclick="fecharTimer()">✕</button></div>
  <div class="tg-fase" id="tgFase"></div><div class="tg-num" id="tgNum"></div><div class="tg-prox" id="tgProx"></div>
  <div class="tg-barra"><i id="tgBarra"></i></div>
  <div class="tg-bts"><button onclick="pularFase(-1)">⏮</button><button id="tgPausa" onclick="pausarTimer()">⏸</button><button onclick="pularFase(1)">⏭</button></div>`;
  clearInterval(TM.iv); TM.iv = setInterval(tickTimer, 200); tickTimer(); bip();
}
function tickTimer() {
  const f = TM.fases[TM.i]; if (!f) return;
  const rest = TM.pausado ? TM.rest : Math.max(0, (TM.fim - Date.now()) / 1000), s = Math.ceil(rest);
  if (f.aviso10 && !TM.pausado && s === 10 && !f._av) { f._av = true; bipCurto(); }
  if (!TM.pausado && rest <= 0) { if (TM.i >= TM.fases.length - 1) { terminarTimer(); return; } TM.i++; TM.fim = Date.now() + TM.fases[TM.i].s * 1000; bip(); if (navigator.vibrate) navigator.vibrate([250, 100, 250]); return tickTimer(); }
  const el = $('#timerGrande'); if (!el) return;
  el.classList.toggle('pausa', f.tipo === 'pausa');
  $('#tgFase').textContent = f.nome; $('#tgNum').textContent = fmtTempo(s);
  const pr = TM.fases[TM.i + 1]; $('#tgProx').textContent = pr ? 'Depois: ' + pr.nome : 'Última!';
  $('#tgBarra').style.width = (100 - rest / f.s * 100) + '%';
  $('#tgPausa').textContent = TM.pausado ? '▶' : '⏸';
}
function pausarTimer() { if (TM.pausado) { TM.fim = Date.now() + TM.rest * 1000; TM.pausado = false; } else { TM.rest = Math.max(0, (TM.fim - Date.now()) / 1000); TM.pausado = true; } tickTimer(); }
function pularFase(d) { TM.i = Math.max(0, Math.min(TM.fases.length - 1, TM.i + d)); TM.fim = Date.now() + TM.fases[TM.i].s * 1000; TM.pausado = false; tickTimer(); }
function terminarTimer() { clearInterval(TM.iv); bip(); if (navigator.vibrate) navigator.vibrate([400, 150, 400]); const el = $('#timerGrande'); if (el) el.innerHTML = `<div class="tg-topo"><b>${TM.titulo}</b><button onclick="fecharTimer()">✕</button></div><div class="tg-num" style="font-size:64px">🎉</div><div class="tg-fase">Terminou! Mandou bem 💪</div><div class="tg-bts"><button style="width:auto;padding:0 28px" onclick="fecharTimer()">Fechar</button></div>`; }
function fecharTimer() { clearInterval(TM.iv); try { TM.wake && TM.wake.release(); } catch (err) {} const el = $('#timerGrande'); if (el) el.remove(); }
function bipCurto() { try { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 660; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(.3, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + .15); o.start(); o.stop(AC.currentTime + .15); } catch (err) {} }

// ---------- 7. Meta com data ----------
function cardMeta() {
  if (!R('metadata')) return '';
  const m = S.metaPeso, peso = S.perfil.peso;
  if (!m) return `<div class="card"><h3>🗓️ Meta com data</h3><p class="sub">Defina um peso alvo e uma data. O app mostra quanto falta e o ritmo semanal.</p><button class="btn sec grande" style="margin-top:6px" onclick="editarMeta()">Definir meta</button></div>`;
  const hoje = new Date(), fim = parseISO(m.data), dias = Math.ceil((fim - hoje) / 864e5), falta = Math.round((m.alvo - (peso || m.ini)) * 10) / 10;
  const sem = Math.max(dias / 7, .1), ritmo = falta / sem, perder = falta < 0;
  const tot = Math.abs(m.alvo - m.ini), feito = Math.abs((peso || m.ini) - m.ini), pct = tot ? Math.max(0, Math.min(100, feito / tot * 100 * (Math.sign(m.alvo - m.ini) === Math.sign((peso || m.ini) - m.ini) ? 1 : 0))) : 100;
  const alerta = perder ? ritmo < -1 : ritmo > .5;
  return `<div class="card"><div class="linha"><h3>🗓️ Meta: ${fmtN(m.alvo)} kg</h3><button class="btn-link" onclick="editarMeta()">Editar</button></div>
  <div class="barra"><div style="width:${pct}%"></div></div>
  <div class="dados"><div class="linha"><span>Faltam</span><b>${Math.abs(falta) < .05 ? 'Meta batida! 🎉' : fmtN(Math.abs(falta)) + ' kg para ' + (perder ? 'perder' : 'ganhar')}</b></div>
  <div class="linha"><span>Prazo</span><b>${dias > 0 ? dias + ' dias (' + fmtData(m.data) + ')' : 'encerrado'}</b></div>
  ${dias > 0 && Math.abs(falta) >= .05 ? `<div class="linha"><span>Ritmo necessário</span><b>${fmtN(Math.abs(ritmo), 2)} kg/semana</b></div>` : ''}</div>
  ${alerta && dias > 0 ? `<p class="aviso">⚠️ Esse ritmo é ${perder ? 'rápido demais para perder peso com saúde (o recomendado é até ~1 kg/semana)' : 'rápido demais para ganhar só músculo (o recomendado é até ~0,5 kg/semana)'}. Considere aumentar o prazo.</p>` : ''}</div>`;
}
function editarMeta() {
  const m = S.metaPeso || {}, d = new Date(); d.setMonth(d.getMonth() + 3);
  modal(`<h2>🗓️ Meta de peso</h2><form class="form-grid" onsubmit="salvarMeta(event)">
  <label>Peso alvo (kg)<input name="alvo" inputmode="decimal" value="${m.alvo ? String(m.alvo).replace('.', ',') : ''}" required></label>
  <label>Até quando<input type="date" name="data" value="${m.data || iso(d)}" required></label>
  <button class="btn span2">Salvar meta</button></form>${S.metaPeso ? `<button class="btn-link perigo centro" onclick="S.metaPeso=null;save();fecharModal();render()">Remover meta</button>` : ''}`);
}
function salvarMeta(ev) {
  ev.preventDefault(); const f = new FormData(ev.target), alvo = num(f.get('alvo'));
  if (!alvo || !S.perfil.peso) { toast(S.perfil.peso ? 'Digite o peso alvo' : 'Cadastre seu peso atual primeiro (Saúde → Avaliação)'); return; }
  S.metaPeso = {alvo, data:f.get('data'), ini:S.perfil.peso, criado:hojeISO()}; save(); fecharModal(); render(); toast('Meta salva 🗓️');
}

// ---------- 8. % de gordura pelas medidas (fórmula da Marinha dos EUA) ----------
function gorduraEstimada(a) {
  const p = S.perfil, alt = p.altura, c = a.cintura, pe = a.pescoco, q = a.quadril;
  if (!alt || !c || !pe) return null;
  let v;
  if (p.sexo === 'f') { if (!q || c + q - pe <= 0) return null; v = 495 / (1.29579 - .35004 * Math.log10(c + q - pe) + .221 * Math.log10(alt)) - 450; }
  else { if (c - pe <= 0) return null; v = 495 / (1.0324 - .19077 * Math.log10(c - pe) + .15456 * Math.log10(alt)) - 450; }
  return v > 2 && v < 60 ? Math.round(v * 10) / 10 : null;
}

// ---------- 9. Diário de proteína ----------
const ALIMENTOS = [['🥚', 'Ovo', 6], ['🍗', 'Frango 100 g', 31], ['🥩', 'Carne 100 g', 26], ['🐟', 'Atum (lata)', 25], ['🥤', 'Whey (dose)', 24], ['🥛', 'Leite (copo)', 8], ['🍦', 'Iogurte', 10], ['🧀', 'Queijo (fatia)', 5], ['🫘', 'Feijão (concha)', 7]];
function metaProteina() { return S.perfil.peso ? Math.round(S.perfil.peso * (({hipertrofia:1.6, forca:1.6, emagrecimento:1.6, condicionamento:1.4})[S.perfil.objetivo] || 1.2)) : 100; }
function protHoje() { return S.protHist[hojeISO()] || {g:0, itens:[]}; }
function addProt(i, gramas) {
  const d = protHoje(), [ic, nome, g] = i >= 0 ? ALIMENTOS[i] : ['✏️', 'Outro', gramas];
  if (!g) return;
  d.g = Math.round((d.g + g) * 10) / 10; d.itens.push({t:ic + ' ' + nome, g}); S.protHist[hojeISO()] = d; save(); render();
}
function outroProteina() {
  modal(`<h2>✏️ Outro alimento</h2><label class="rot-input">Gramas de proteína<input id="protG" inputmode="decimal" placeholder="ex.: 15"></label>
  <button class="btn grande" onclick="const g=num($('#protG').value);fecharModal();if(g)addProt(-1,g)">Adicionar</button>`);
}
function desfazerProt() { const d = protHoje(); if (!d.itens.length) return; const it = d.itens.pop(); d.g = Math.max(0, Math.round((d.g - (it.g || 0)) * 10) / 10); S.protHist[hojeISO()] = d; save(); render(); }
function cardProteina() {
  if (!R('proteina')) return '';
  const d = protHoje(), m = metaProteina();
  return `<div class="card"><div class="linha"><h3>🍗 Proteína hoje</h3><span class="sub">${fmtN(d.g, 0)} de ${m} g</span></div>
  <div class="barra"><div style="width:${Math.min(100, d.g / m * 100)}%"></div></div>
  <div class="alimentos">${ALIMENTOS.map(([ic, n, g], i) => `<button onclick="addProt(${i})"><span>${ic}</span>${n}<small>+${g} g</small></button>`).join('')}
  <button onclick="outroProteina()"><span>✏️</span>Outro<small>digitar</small></button></div>
  ${d.itens.length ? `<p class="sub" style="margin-top:6px">${d.itens.map(x => x.t || x).join(' · ')} <button class="btn-link" onclick="desfazerProt()">Desfazer último</button></p>` : ''}
  <p class="sub">Valores aproximados. A meta usa ${fmtN(m / (S.perfil.peso || 70), 1)} g por kg do seu peso.</p></div>`;
}
function tileProteina() {
  if (!R('proteina')) return '';
  const d = protHoje(), m = metaProteina();
  return `<div class="tile" onclick="ir('saude')"><span>🍗</span><b>${fmtN(d.g, 0)} / ${m} g</b><small>proteína hoje</small><div class="barra" style="margin:6px 0 0"><div style="width:${Math.min(100, d.g / m * 100)}%"></div></div></div>`;
}

// ---------- 10. Dias fixos ----------
const DSEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function diaDeDescanso() {
  if (!R('diasfixos') || !S.diasFixos.length) return false;
  const hj = hojeISO();
  return !S.diasFixos.includes(new Date().getDay()) && !S.sessoes.some(s => s.data === hj);
}
function configDiasFixos() {
  if (!R('diasfixos')) return '';
  return `<div class="card"><h3>📅 Meus dias de treino</h3><p class="sub">Toque nos dias em que você treina. Nos outros, o Início mostra "dia de descanso".</p>
  <div class="chips">${DSEM.map((d, i) => `<button class="chip-btn ${S.diasFixos.includes(i) ? 'on' : ''}" onclick="alternarDia(${i})">${d}</button>`).join('')}</div></div>`;
}
function alternarDia(i) { const k = S.diasFixos.indexOf(i); if (k >= 0) S.diasFixos.splice(k, 1); else S.diasFixos.push(i); S.diasFixos.sort(); save(); render(); }
function cardDescanso(p) {
  const prox = S.diasFixos.map(d => (d - new Date().getDay() + 7) % 7).filter(x => x > 0).sort((a, b) => a - b)[0];
  return `<div class="card proximo" style="border-color:var(--borda)"><div class="info-prox"><div class="rotulo">Hoje</div><b>😴 Dia de descanso</b>
  <div class="sub">${prox ? `Próximo treino ${prox === 1 ? 'amanhã' : 'em ' + prox + ' dias'} (${DSEM[(new Date().getDay() + prox) % 7]})` : ''} · descansar também faz o músculo crescer</div></div>
  ${p ? `<button class="btn-link" onclick="iniciarTreino('${p.id}',${p.proximo % p.dias.length})">Treinar mesmo assim</button>` : ''}</div>`;
}

// ---------- 11. Relatório mensal (imprimir / salvar PDF) ----------
function abrirRelatorio(mesesAtras) {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() - (mesesAtras || 0));
  const y = base.getFullYear(), m = base.getMonth(), noMes = d => { const x = parseISO(d); return x.getFullYear() === y && x.getMonth() === m; };
  const ses = S.sessoes.filter(s => noMes(s.data)), cor = S.corridas.filter(c => noMes(c.data)), av = S.avaliacoes.filter(a => noMes(a.data)).sort((a, b) => a.data.localeCompare(b.data));
  const series = ses.reduce((n, s) => n + s.exercicios.reduce((k, x) => k + x.series.length, 0), 0);
  const volume = ses.reduce((n, s) => n + s.exercicios.reduce((k, x) => k + x.series.reduce((j, z) => j + (num(z.kg) || 0) * (num(z.reps) || 0), 0), 0), 0);
  const dias = new Set([...ses.map(s => s.data), ...cor.map(c => c.data)]).size, km = cor.reduce((t, c) => t + c.dist, 0) / 1000;
  const sono = S.sono.filter(x => noMes(x.data)), sonoM = sono.length ? sono.reduce((t, x) => t + x.horas, 0) / sono.length : null;
  const agua = Object.entries(S.aguaHist).filter(([d]) => noMes(d)).map(([, c]) => c), aguaM = agua.length ? agua.reduce((a, b) => a + b, 0) / agua.length * .25 : null;
  // melhores cargas do mês
  const best = {}; ses.forEach(s => s.exercicios.forEach(x => { const k = Math.max(0, ...x.series.map(z => num(z.kg) || 0)); if (k > (best[x.exId] || 0)) best[x.exId] = k; }));
  const nomeMes = base.toLocaleDateString('pt-BR', {month:'long', year:'numeric'}), n = infoNivel();
  const p1 = av.find(a => a.peso), p2 = av.slice().reverse().find(a => a.peso);
  const html = `<div class="rel"><div class="rel-topo"><div><h1>Relatório mensal · Fit</h1><p>${nomeMes[0].toUpperCase() + nomeMes.slice(1)}</p></div><div class="rel-logo">💪</div></div>
  <p><b>${h(S.perfil.nome)}</b> · ${S.perfil.idade ? S.perfil.idade + ' anos · ' : ''}${S.perfil.altura ? S.perfil.altura + ' cm · ' : ''}Objetivo: ${OBJ[S.perfil.objetivo]} · Nível: ${NIVEL[S.perfil.nivel]}</p>
  <h2>Resumo</h2><table><tr><td>Dias de treino</td><td>${dias}</td><td>Treinos de musculação</td><td>${ses.length}</td></tr>
  <tr><td>Séries feitas</td><td>${series}</td><td>Carga total levantada</td><td>${fmtN(volume, 0)} kg</td></tr>
  <tr><td>Corridas/caminhadas</td><td>${cor.length} (${fmtN(km, 1)} km)</td><td>Personagem</td><td>${n.N.nome}</td></tr>
  <tr><td>Sono médio</td><td>${sonoM ? fmtN(sonoM, 1) + ' h' : '—'}</td><td>Água média</td><td>${aguaM ? fmtN(aguaM, 1) + ' L/dia' : '—'}</td></tr></table>
  <h2>Corpo</h2>${av.length ? `<table><tr><th>Data</th><th>Peso</th><th>% gordura</th><th>Cintura</th><th>Braço</th></tr>${av.map(a => `<tr><td>${fmtData(a.data)}</td><td>${a.peso ? fmtN(a.peso) + ' kg' : '—'}</td><td>${a.gordura ? fmtN(a.gordura) + '%' : '—'}</td><td>${a.cintura ? fmtN(a.cintura) + ' cm' : '—'}</td><td>${a.braco ? fmtN(a.braco) + ' cm' : '—'}</td></tr>`).join('')}</table>
  ${p1 && p2 && p1 !== p2 ? `<p>Variação de peso no mês: <b>${p2.peso - p1.peso > 0 ? '+' : ''}${fmtN(p2.peso - p1.peso)} kg</b></p>` : ''}` : '<p>Nenhuma avaliação física neste mês.</p>'}
  <h2>Maiores cargas do mês</h2>${Object.keys(best).length ? `<table><tr><th>Exercício</th><th>Carga</th><th>Recorde geral</th></tr>${Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, k]) => `<tr><td>${h(EXM[id]?.nome || id)}</td><td>${fmtN(k)} kg</td><td>${fmtN(recorde(id))} kg</td></tr>`).join('')}</table>` : '<p>Sem cargas registradas.</p>'}
  <h2>Treinos</h2>${ses.length ? `<table><tr><th>Data</th><th>Treino</th><th>Duração</th><th>Séries</th></tr>${ses.map(s => `<tr><td>${fmtData(s.data)}</td><td>${h(s.nome)}</td><td>${s.duracao} min</td><td>${s.exercicios.reduce((k, x) => k + x.series.length, 0)}</td></tr>`).join('')}</table>` : '<p>Nenhum treino neste mês.</p>'}
  ${S.dores.length ? `<h2>Dores registradas</h2><p>${S.dores.map(d => REGIOES[d.regiao] + ' (desde ' + fmtData(d.desde) + ')').join(', ')}</p>` : ''}
  <p class="rel-rodape">Gerado pelo app Fit em ${new Date().toLocaleDateString('pt-BR')}. Dados informados pelo próprio usuário; valores estimados não substituem avaliação profissional.</p></div>`;
  let el = $('#relatorio'); if (!el) { el = document.createElement('div'); el.id = 'relatorio'; document.body.appendChild(el); }
  el.innerHTML = `<div class="rel-bts"><button class="btn" onclick="window.print()">🖨️ Salvar PDF / Imprimir</button><button class="btn sec" onclick="abrirRelatorio(${(mesesAtras || 0) + 1})">‹ Mês anterior</button>${mesesAtras ? `<button class="btn sec" onclick="abrirRelatorio(${mesesAtras - 1})">Próximo ›</button>` : ''}<button class="btn sec" onclick="$('#relatorio').remove()">Fechar</button></div>${html}`;
  window.scrollTo(0, 0);
}

// ---------- 12. Cor do app ----------
const CORES_APP = {
  roxo:{n:'Roxo', c:['#7c3aed', '#4c1d95', '#6d28d9', '#ede9fe'], e:['#a78bfa', '#2e1065', '#4c1d95', '#2a1f45']},
  azul:{n:'Azul', c:['#2563eb', '#1e3a8a', '#1d4ed8', '#dbeafe'], e:['#60a5fa', '#172554', '#1e3a8a', '#172036']},
  verde:{n:'Verde', c:['#16a34a', '#14532d', '#15803d', '#dcfce7'], e:['#4ade80', '#052e16', '#14532d', '#132a1c']},
  vermelho:{n:'Vermelho', c:['#dc2626', '#7f1d1d', '#b91c1c', '#fee2e2'], e:['#f87171', '#450a0a', '#7f1d1d', '#331616']},
  preto:{n:'Preto', c:['#27272a', '#09090b', '#3f3f46', '#e4e4e7'], e:['#e4e4e7', '#000000', '#27272a', '#27272a']}
};
function aplicarCor(escuro) {
  const k = R('cores') ? (S.cor || 'roxo') : 'roxo', p = CORES_APP[k] || CORES_APP.roxo, v = escuro ? p.e : p.c, r = document.documentElement.style;
  r.setProperty('--pri', v[0]); r.setProperty('--topo1', v[1]); r.setProperty('--topo2', v[2]); r.setProperty('--pri-claro', v[3]); r.setProperty('--pri2', escuro ? p.e[1] : p.c[1]);
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = v[1];
}
function escolherCor() {
  if (!R('cores')) return '';
  return `<h4 style="margin-top:12px">Cor do app</h4><div class="chips">${Object.entries(CORES_APP).map(([k, c]) => `<button class="chip-btn cor-bt ${(S.cor || 'roxo') === k ? 'on' : ''}" onclick="S.cor='${k}';save();render()"><i style="background:${c.c[0]}"></i>${c.n}</button>`).join('')}</div>`;
}

// ---------- Ferramentas (aba em Treinos) ----------
function telaFerramentas() {
  const it = [];
  if (R('anilhas')) it.push(['🏋️', 'Calculadora de anilhas', 'Quais anilhas colocar em cada lado', 'abrirAnilhas()']);
  if (R('rounds')) it.push(['🥊', 'Timer de rounds', 'Muay Thai, boxe, jiu-jitsu', "configTimer('rounds')"]);
  if (R('hiit')) it.push(['⏱️', 'Timer de intervalado', 'HIIT, Tabata, EMOM e personalizado', "configTimer('tabata')"]);
  if (R('alongamento')) it.push(['🧘', 'Alongamento (5 min)', 'Corpo inteiro, guiado', 'iniciarAlongamento()']);
  if (R('relatorio')) it.push(['📄', 'Relatório do mês', 'Salvar em PDF ou imprimir', 'abrirRelatorio(0)']);
  return it.length ? it.map(([ic, t, d, f]) => `<div class="card ferr" onclick="${f}"><span>${ic}</span><div><b>${t}</b><small>${d}</small></div><span class="sub">›</span></div>`).join('')
    : '<p class="vazio">Todas as ferramentas estão desligadas. Ligue em Perfil → Recursos do app.</p>';
}

// ---------- Estilos ----------
document.head.insertAdjacentHTML('beforeend', `<style>
:root{--topo1:#4c1d95;--topo2:#6d28d9}
.topo,.escuro .topo{background:linear-gradient(135deg,var(--topo1),var(--topo2))!important}
.cor-bt i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.barra-anilhas{display:flex;align-items:center;gap:3px;height:150px;padding:10px;background:var(--fundo);border-radius:14px;margin:10px 0;overflow-x:auto}
.barra-anilhas i{width:16px;border-radius:4px;border:1px solid rgba(0,0,0,.25);flex-shrink:0}.barra-anilhas .ponta{width:10px;height:34px;background:#9ca3af;border-radius:3px}.barra-anilhas .haste{flex:1;min-width:40px;height:10px;background:#9ca3af;border-radius:3px}
.nota-ex{display:block;width:100%;text-align:left;background:var(--fundo);border:1px dashed var(--borda);border-radius:10px;padding:7px 10px;margin-top:8px;font-size:13px;color:var(--txt)}
.biset-tag{display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px;margin-top:6px}
.escuro .biset-tag{background:#3b2f0b;color:#fcd34d}
.ex-btns button.on{background:var(--pri);color:#fff}
.tg{position:fixed;inset:0;z-index:80;background:#b91c1c;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;transition:background .3s}
.tg.pausa{background:#15803d}.tg.calmo,.tg.calmo.pausa{background:linear-gradient(160deg,#1e3a8a,#6d28d9)}
.tg-topo{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:calc(16px + env(safe-area-inset-top)) 18px 0;font-size:17px}
.tg-topo button{background:rgba(255,255,255,.2);border:0;color:#fff;width:44px;height:44px;border-radius:12px;font-size:20px}
.tg-fase{font-size:26px;font-weight:800}.tg-num{font-size:min(30vw,150px);font-weight:900;font-variant-numeric:tabular-nums;line-height:1;margin:14px 0}.tg-prox{opacity:.85;font-size:16px}
.tg-barra{width:min(90%,420px);height:10px;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden;margin:22px 0}.tg-barra i{display:block;height:100%;background:#fff;width:0}
.tg-bts{display:flex;gap:16px}.tg-bts button{width:72px;height:72px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;font-size:28px}
.alimentos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.alimentos button{border:1px solid var(--borda);background:var(--fundo);color:var(--txt);border-radius:12px;padding:8px 4px;font-size:12px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:1px;min-height:64px}
.alimentos span{font-size:20px}.alimentos small{color:var(--pri);font-weight:800}
.ferr{display:flex;gap:14px;align-items:center;cursor:pointer}.ferr>span:first-child{font-size:28px}.ferr div{flex:1}.ferr b{display:block}.ferr small{color:var(--txt2);font-size:13px}
#relatorio{position:fixed;inset:0;z-index:90;background:#fff;color:#111;overflow:auto;padding:16px}
.rel-bts{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.rel{max-width:760px;margin:0 auto;font-size:13px}.rel h1{font-size:22px;margin:0}.rel h2{font-size:15px;margin:18px 0 6px;color:#4c1d95;border-bottom:2px solid #ede9fe;padding-bottom:3px}
.rel-topo{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4c1d95;padding-bottom:8px;margin-bottom:10px}.rel-logo{font-size:34px}
.rel table{width:100%;border-collapse:collapse;margin:4px 0}.rel td,.rel th{border:1px solid #ddd;padding:5px 7px;text-align:left;font-size:12px}.rel th{background:#f5f3ff}
.rel-rodape{color:#666;font-size:11px;margin-top:20px}
@media print{body>*:not(#relatorio){display:none!important}#relatorio{position:static;padding:0}.rel-bts{display:none}}
</style>`);
