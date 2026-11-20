/* =========================================================
   Fit – recursos extras (v0.4)
   Tudo aqui é opcional: o usuário liga/desliga em Perfil → Recursos do app.
   Este arquivo é carregado ANTES do script principal e só define funções.
   ========================================================= */
'use strict';

// [chave, ícone, nome, descrição, ligado por padrão]
const RECURSOS = [
  ['desafios', '🎯', 'Desafios semanais', '3 metas novas toda semana', true],
  ['resumo', '📬', 'Resumo da semana', 'No sábado à noite, comparando com a semana anterior', true],
  ['aquecimento', '🔥', 'Aquecimento', 'Sugestão de aquecimento antes de cada treino', true],
  ['deload', '🛌', 'Semana de recuperação', 'Avisa quando é hora de pegar mais leve', true],
  ['sensacao', '😄', 'Ajuste pela sensação', 'Fácil / ok / difícil ajusta a carga da próxima vez', true],
  ['rapido', '⚡', 'Treino rápido', 'Botão de treino de 15–20 min na tela inicial', true],
  ['fotos', '📸', 'Fotos de evolução', 'Antes × agora, guardadas só no seu celular', true],
  ['sono', '😴', 'Registro de sono', 'Horas e qualidade do sono', true],
  ['dores', '🩹', 'Diário de dores', 'Evita exercícios que forçam a região dolorida', true],
  ['compartilhar', '📤', 'Compartilhar conquistas', 'Gera imagem para Instagram e WhatsApp', true],
  ['personal', '🧑‍🏫', 'Modo personal', 'Enviar e importar treinos por código', true],
  ['lembretes', '⏰', 'Lembretes', 'Notificação de treino e de água', false],
];
function R(k) { const d = RECURSOS.find(x => x[0] === k); return S.recursos && k in S.recursos ? !!S.recursos[k] : (d ? d[4] : true); }
function prepararEstado() {
  S.recursos = S.recursos || {}; S.aguaHist = S.aguaHist || {}; S.sono = S.sono || []; S.dores = S.dores || [];
  S.desafiosFeitos = S.desafiosFeitos || {}; S.corridas = S.corridas || []; S.lembretes = S.lembretes || {treino:'18:00', agua:true, avisos:{}};
  if (S.perfil && S.nivelVisto === undefined) S.nivelVisto = Frango.nivelDe(pontos());
}

// ---------- Pontos e níveis do frango ----------
function pontos() {
  const desafios = Object.keys(S.desafiosFeitos || {}).length;
  return (S.sessoes || []).length + (S.corridas || []).length + desafios;
}
function infoNivel() {
  const pts = pontos(), i = Frango.nivelDe(pts), N = Frango.NIVEIS[i], prox = Frango.NIVEIS[i + 1];
  return {pts, i, N, prox, falta: prox ? prox.pts - pts : 0, pct: prox ? (pts - N.pts) / (prox.pts - N.pts) * 100 : 100};
}
function cardNivel() {
  const n = infoNivel();
  return `<div class="card nivel-card" onclick="verMeuFrango()"><div class="nivel-emoji">${n.N.emoji}</div><div style="flex:1">
    <div class="rotulo">Nível ${n.i + 1} de ${Frango.NIVEIS.length}</div><b>${n.N.nome}</b>
    <div class="barra"><div style="width:${n.pct}%"></div></div>
    <small class="sub">${n.prox ? `Faltam ${n.falta} ${n.falta === 1 ? 'ponto' : 'pontos'} para virar <b>${n.prox.nome}</b>` : 'Nível máximo! Você é uma lenda 👑'}</small></div></div>`;
}
function verMeuFrango() {
  const n = infoNivel();
  modal(`<div class="frango-palco" id="frangoPalco"></div>
  <div class="rotulo">Nível ${n.i + 1} · ${n.pts} pontos</div><h2>${n.N.emoji} ${n.N.nome}</h2>
  <p class="sub">Cada treino, corrida ou desafio concluído vale 1 ponto.</p>
  <div class="niveis">${Frango.NIVEIS.map((x, k) => `<div class="${k < n.i ? 'feito' : k === n.i ? 'atual' : ''}"><span>${x.emoji}</span><b>${x.nome}</b><small>${x.pts} pts</small></div>`).join('')}</div>
  ${R('compartilhar') ? `<button class="btn sec grande" onclick="compartilharNivel()">📤 Compartilhar meu nível</button>` : ''}
  <button class="btn grande" onclick="fecharModal()">Fechar</button>`);
  mostrarFrango();
}
function mostrarFrango() { try { Frango.configurar(S.perfil, pontos()); Frango.mostrar($('#frangoPalco')); } catch (err) { const p = $('#frangoPalco'); if (p) p.remove(); } }
function checarNivel() {
  const n = infoNivel();
  if (S.nivelVisto === undefined) S.nivelVisto = n.i;
  if (n.i <= S.nivelVisto) return false;
  S.nivelVisto = n.i; save();
  setTimeout(() => {
    modal(`<div style="text-align:center"><div class="rotulo">Subiu de nível! 🎉</div><h2>Você virou ${n.N.emoji} ${n.N.nome}</h2></div>
    <div class="frango-palco" id="frangoPalco"></div>
    ${n.prox ? `<p class="sub" style="text-align:center">Próximo: ${n.prox.emoji} ${n.prox.nome} em ${n.falta} ${n.falta === 1 ? 'ponto' : 'pontos'}</p>` : ''}
    ${R('compartilhar') ? `<button class="btn sec grande" onclick="compartilharNivel()">📤 Compartilhar</button>` : ''}
    <button class="btn grande" onclick="fecharModal()">Bora! 💪</button>`);
    mostrarFrango();
  }, 400);
  return true;
}

// ---------- Semana (domingo a sábado) ----------
function chaveSemana(d) { return iso(inicioSemana(d || new Date())); }
function noIntervalo(dataISO, ini) { const d = parseISO(dataISO), f = new Date(ini); f.setDate(f.getDate() + 7); return d >= ini && d < f; }
function dadosSemana(ini) {
  const ses = S.sessoes.filter(s => noIntervalo(s.data, ini)), cor = S.corridas.filter(c => noIntervalo(c.data, ini));
  const series = ses.reduce((n, s) => n + s.exercicios.reduce((m, x) => m + x.series.length, 0), 0);
  const volume = ses.reduce((n, s) => n + s.exercicios.reduce((m, x) => m + x.series.reduce((k, y) => k + (num(y.kg) || 0) * (num(y.reps) || 0), 0), 0), 0);
  const dias = new Set([...ses.map(s => s.data), ...cor.map(c => c.data), ...S.manuais.filter(d => noIntervalo(d, ini))]);
  let aguaDias = 0, aguaTot = 0, aguaN = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(ini); d.setDate(d.getDate() + i); const c = S.aguaHist[iso(d)]; if (c !== undefined) { aguaTot += c; aguaN++; if (c >= metaAgua()) aguaDias++; } }
  // recordes batidos na semana
  let recs = 0; const max = {};
  for (const s of S.sessoes) for (const x of s.exercicios) {
    const k = Math.max(0, ...x.series.map(y => num(y.kg) || 0)); if (k <= 0) continue;
    if (max[x.exId] !== undefined && k > max[x.exId] && noIntervalo(s.data, ini)) recs++;
    max[x.exId] = Math.max(max[x.exId] || 0, k);
  }
  return {treinos:ses.length, dias:dias.size, series, volume, km:cor.reduce((t, c) => t + c.dist, 0) / 1000, ativ:cor.length, aguaDias, aguaMedia:aguaN ? aguaTot / aguaN * .25 : 0, recs,
    aval:S.avaliacoes.filter(a => noIntervalo(a.data, ini)).length, sono:S.sono.filter(x => noIntervalo(x.data, ini))};
}

// ---------- Desafios semanais ----------
const POOL_DESAFIOS = [
  {id:'series', txt:m => `Fazer ${m} séries de treino`, meta:() => Math.max(20, (S.perfil.dias || 3) * 12), v:d => d.series},
  {id:'agua', txt:m => `Bater a meta de água em ${m} dias`, meta:() => 4, v:d => d.aguaDias},
  {id:'km', txt:m => `Correr ou caminhar ${m} km`, meta:() => S.corridas.length ? 8 : 3, v:d => d.km},
  {id:'recorde', txt:() => 'Bater 1 recorde de carga', meta:() => 1, v:d => d.recs},
  {id:'ativ', txt:m => `Fazer ${m} corridas ou caminhadas`, meta:() => 2, v:d => d.ativ},
  {id:'aval', txt:() => 'Registrar uma avaliação física', meta:() => 1, v:d => d.aval},
  {id:'volume', txt:m => `Levantar ${fmtN(m, 0)} kg no total`, meta:() => { const p = new Date(inicioSemana(new Date())); p.setDate(p.getDate() - 7); const v = dadosSemana(p).volume; return Math.max(3000, Math.round(v * 1.05 / 500) * 500); }, v:d => d.volume},
];
function hash(s) { let h2 = 0; for (const c of s) h2 = (h2 * 31 + c.charCodeAt(0)) >>> 0; return h2; }
function desafiosDaSemana(ini) {
  const chave = iso(ini), d = dadosSemana(ini), lista = [{id:'treinos', txt:m => `Treinar ${m} dias`, meta:() => S.perfil.dias || 3, v:x => x.dias}];
  const pool = POOL_DESAFIOS.slice(); let hs = hash(chave);
  while (lista.length < 3 && pool.length) { const i = hs % pool.length; lista.push(pool.splice(i, 1)[0]); hs = Math.floor(hs / 7) + 13; }
  return lista.map(x => { const meta = x.meta(), v = x.v(d), id = chave + ':' + x.id; return {id, txt:x.txt(meta), meta, v, ok:!!S.desafiosFeitos[id] || v >= meta}; });
}
function checarDesafios() {
  if (!R('desafios') || !S.perfil) return;
  let novo = false;
  for (const x of desafiosDaSemana(inicioSemana(new Date()))) if (x.v >= x.meta && !S.desafiosFeitos[x.id]) { S.desafiosFeitos[x.id] = hojeISO(); novo = true; toast('🎯 Desafio concluído: ' + x.txt); }
  if (novo) { save(); checarNivel(); }
}
function cardDesafios(compacto) {
  if (!R('desafios')) return '';
  const l = desafiosDaSemana(inicioSemana(new Date())), feitos = l.filter(x => x.ok).length;
  const fim = new Date(inicioSemana(new Date())); fim.setDate(fim.getDate() + 6);
  const dias = Math.round((fim - new Date().setHours(0, 0, 0, 0)) / 864e5);
  return `<div class="card"><div class="linha"><h3>🎯 Desafios da semana</h3><span class="tag">${feitos}/3</span></div>
  ${l.map(x => `<div class="desafio ${x.ok ? 'ok' : ''}"><span>${x.ok ? '✅' : '⬜'}</span><div style="flex:1"><div>${x.txt}</div>
    ${compacto ? '' : `<div class="barra"><div style="width:${Math.min(100, x.v / x.meta * 100)}%"></div></div>`}
    <small class="sub">${fmtN(Math.min(x.v, x.meta), 1)} de ${fmtN(x.meta, 1)}</small></div></div>`).join('')}
  <p class="sub" style="margin-top:6px">Cada desafio vale 1 ponto para o seu frango · ${dias <= 0 ? 'termina hoje' : `termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}</p></div>`;
}

// ---------- Resumo semanal (sábado à noite) ----------
function checarResumo() {
  if (!R('resumo') || !S.perfil) return;
  const agora = new Date(), atual = inicioSemana(agora);
  let alvo;
  if (agora.getDay() === 6 && agora.getHours() >= 18) alvo = atual;
  else { alvo = new Date(atual); alvo.setDate(alvo.getDate() - 7); }
  const k = iso(alvo);
  if (S.resumoVisto === k) return;
  const d = dadosSemana(alvo);
  if (!d.treinos && !d.ativ && !d.series) { S.resumoVisto = k; save(); return; } // semana sem nada (ou antes de usar o app)
  S.resumoVisto = k; save();
  setTimeout(() => abrirResumo(alvo), 500);
}
function abrirResumo(ini) {
  ini = ini || inicioSemana(new Date());
  const ant = new Date(ini); ant.setDate(ant.getDate() - 7);
  const a = dadosSemana(ini), b = dadosSemana(ant), des = R('desafios') ? desafiosDaSemana(ini).filter(x => x.ok).length : null;
  const fim = new Date(ini); fim.setDate(fim.getDate() + 6);
  const seta = (x, y, menor) => x === y ? '' : (menor ? x < y : x > y) ? '<span class="bom">▲</span>' : '<span class="ruim">▼</span>';
  const ln = (rot, x, y, f, menor) => `<div class="cmp-l"><span>${rot}</span><b>${f(x)} ${seta(x, y, menor)}</b><b class="sub">${f(y)}</b></div>`;
  const n = infoNivel();
  window._resumo = {ini, a, des, n};
  modal(`<div style="text-align:center"><div class="grande-emoji">📬</div><h2>Resumo da semana</h2><p class="sub">${ini.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} a ${fim.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</p></div>
  <div class="cmp-l cab"><span></span><b>Esta</b><b class="sub">Anterior</b></div>
  ${ln('Dias de treino', a.dias, b.dias, v => v)}${ln('Séries', a.series, b.series, v => v)}${ln('Carga total', a.volume, b.volume, v => fmtN(v / 1000, 1) + ' t')}
  ${ln('Km', a.km, b.km, v => fmtN(v, 1))}${ln('Recordes', a.recs, b.recs, v => v)}${ln('Água (média/dia)', a.aguaMedia, b.aguaMedia, v => fmtN(v, 1) + ' L')}
  ${des !== null ? `<p style="margin-top:10px">🎯 Desafios concluídos: <b>${des}/3</b></p>` : ''}
  <p>${n.N.emoji} Seu frango: <b>${n.N.nome}</b>${n.prox ? ` · faltam ${n.falta} pontos para ${n.prox.nome}` : ''}</p>
  <p class="sub">${a.dias >= (S.perfil.dias || 3) ? '🔥 Meta da semana batida! Continue assim.' : a.dias > b.dias ? '📈 Você treinou mais que na semana passada. Boa!' : '💡 Semana que vem dá pra mais. Que tal deixar os horários de treino já marcados?'}</p>
  ${R('compartilhar') ? `<button class="btn sec grande" onclick="compartilharResumo()">📤 Compartilhar</button>` : ''}
  <button class="btn grande" onclick="fecharModal()">Fechar</button>`);
}

// ---------- Aquecimento ----------
function cardAquecimento() {
  const a = S.atual; if (!R('aquecimento') || !a || a.aqueceu) return '';
  const gr = new Set(a.exercicios.map(x => EXM[x.exId]?.g));
  const sup = ['peito','costas','ombro','biceps','triceps','trapezio','antebraco'].some(g => gr.has(g)), inf = ['quadriceps','posterior','gluteo','panturrilha'].some(g => gr.has(g));
  const p1 = a.exercicios.find(x => !ehTempo(EXM[x.exId])), kg = p1 ? num(p1.sets[0].kg) : null;
  const itens = ['5 min de cardio leve (esteira, bike ou polichinelo sem salto)'];
  if (sup) itens.push('Rotação de ombros e braços — 30 s para cada lado', 'Flexão inclinada leve — 10 repetições');
  if (inf) itens.push('Agachamento sem peso — 10 repetições', 'Balanço de pernas — 10 para cada lado');
  if (p1) itens.push(`2 séries leves de ${h(EXM[p1.exId].nome)}: ${kg ? `${fmtN(Math.round(kg * .5 * 2) / 2)} kg × 10 e ${fmtN(Math.round(kg * .7 * 2) / 2)} kg × 6` : '10 reps bem leve e 6 reps um pouco mais pesado'}`);
  return `<div class="card aquec"><div class="linha"><h3>🔥 Aquecimento · 5–8 min</h3><button class="btn-link" onclick="S.atual.aqueceu=true;save();render()">Pular</button></div>
  ${itens.map((t, i) => `<label class="aceite" style="margin:6px 0"><input type="checkbox"> <span>${t}</span></label>`).join('')}
  <button class="btn sec grande" style="margin-top:4px" onclick="S.atual.aqueceu=true;save();render()">✅ Pronto, aqueci</button></div>`;
}

// ---------- Ajustes ao começar o treino: semana leve e dores ----------
function deloadAtivo() { return R('deload') && S.deloadAte && S.deloadAte >= hojeISO(); }
function aplicarAjustesTreino(a) {
  if (deloadAtivo()) {
    a.deload = true;
    for (const x of a.exercicios) { const n = Math.max(1, Math.ceil(x.sets.length / 2)); x.sets = x.sets.slice(0, n).map(s => ({...s, kg: s.kg ? String(Math.round(num(s.kg) * .6 * 2) / 2) : ''})); }
  }
  if (R('dores') && S.dores.length) {
    const reg = S.dores.map(d => d.regiao), p = a.planoId ? acharPlano(a.planoId) : null, cfg = p ? p.cfg : cfgDe(S.perfil), eq = EQUIP[cfg.local] || EQUIP.academia;
    let trocas = 0;
    for (const x of a.exercicios) {
      const ex = EXM[x.exId]; if (!ex.ev.some(r => reg.includes(r))) continue;
      const usados = new Set(a.exercicios.map(y => y.exId));
      const alt = EX.find(y => y.g === ex.g && eq.includes(y.eq) && !usados.has(y.id) && !y.ev.some(r => reg.includes(r)));
      if (alt) { x.exId = alt.id; x.sets = setsIniciais(alt.id, x.sets.length); trocas++; } else x.alertaDor = true;
    }
    if (trocas) setTimeout(() => toast(`🩹 Troquei ${trocas} ${trocas === 1 ? 'exercício' : 'exercícios'} por causa da dor`), 300);
  }
}
function cardDeload() {
  if (!R('deload') || !S.perfil) return '';
  if (deloadAtivo()) return `<div class="card aviso-card">🛌 <b>Semana de recuperação</b> até ${fmtData(S.deloadAte)}: os treinos vêm com metade das séries e 60% da carga. <button class="btn-link" onclick="S.deloadAte=null;save();render()">Encerrar</button></div>`;
  const st = stats(), ult = S.deloadUltimo ? (new Date() - parseISO(S.deloadUltimo)) / 864e5 : 999, adiado = S.deloadAdiado && (new Date() - parseISO(S.deloadAdiado)) / 864e5 < 7;
  if (st.seq < 5 || ult < 42 || adiado) return '';
  return `<div class="card aviso-card">🛌 Você bateu a meta <b>${st.seq} semanas seguidas</b>. Uma semana mais leve ajuda o corpo a recuperar e voltar mais forte.
  <div class="acoes" style="justify-content:flex-start"><button class="btn peq" onclick="ativarDeload()">Ativar semana leve</button><button class="btn sec peq" onclick="S.deloadAdiado=hojeISO();save();render()">Agora não</button></div></div>`;
}
function ativarDeload() { const d = new Date(); d.setDate(d.getDate() + 6); S.deloadAte = iso(d); S.deloadUltimo = hojeISO(); save(); render(); toast('🛌 Semana leve ativada'); }

// ---------- Sensação (fácil / ok / difícil) ----------
function blocoSensacao(ei) {
  const x = S.atual.exercicios[ei];
  if (!R('sensacao') || ehTempo(EXM[x.exId]) || !x.sets.length || !x.sets.every(s => s.ok)) return '';
  const op = [['facil','😄 Fácil'],['ok','😐 Ok'],['dificil','😫 Difícil']];
  return `<div class="sensacao"><span class="sub">Como foi?</span>${op.map(([k, l]) => `<button class="${x.rpe === k ? 'on' : ''}" onclick="S.atual.exercicios[${ei}].rpe='${k}';save();render()">${l}</button>`).join('')}</div>`;
}
function sugestaoSensacao(exId, reps) {
  if (!R('sensacao')) return null;
  const ult = ultimaVez(exId); if (!ult || !ult.rpe) return null;
  const kg = Math.max(0, ...ult.series.map(y => num(y.kg) || 0)), inc = EXM[exId].t === 'c' ? 2.5 : 1;
  if (ult.rpe === 'facil') return kg > 0 ? `😄 Da última vez foi fácil. Hoje tente <b>${fmtN(kg + inc)} kg</b>!` : '😄 Da última vez foi fácil: faça mais repetições ou uma variação mais difícil.';
  if (ult.rpe === 'dificil') return kg > 0 ? `😫 Da última vez foi difícil. Mantenha <b>${fmtN(kg)} kg</b> e capriche na técnica.` : '😫 Da última vez foi difícil: mantenha e capriche na técnica.';
  return null;
}

// ---------- Treino rápido ----------
function iniciarTreinoRapido() {
  if (S.atual) { confirmar('Já existe um treino em andamento. Descartar ele e começar o treino rápido?', () => { S.atual = null; iniciarTreinoRapido(); }, 'Começar'); return; }
  const cfg = {...cfgDe(S.perfil), tempo:30, objetivo:S.perfil.objetivo === 'forca' ? 'hipertrofia' : S.perfil.objetivo};
  const d = gerarDia('fb', Math.floor(Math.random() * 3), cfg);
  const ex = d.exercicios.filter(x => EXM[x.exId].g !== 'cardio').slice(0, 4);
  S.atual = {planoId:null, diaIdx:0, nome:'⚡ Treino rápido', inicio:Date.now(), rapido:true,
    exercicios:ex.map(x => ({exId:x.exId, reps:x.reps, descanso:30, sets:setsIniciais(x.exId, 2)}))};
  aplicarAjustesTreino(S.atual); S.atual.aqueceu = true;
  save(); fecharModal(); tela = 'treino'; render(); window.scrollTo(0, 0);
}

// ---------- Dores ----------
const REGIOES = {joelho:'Joelho', lombar:'Lombar', ombro:'Ombro'};
function cardDores() {
  if (!R('dores')) return '';
  const at = S.dores.map(d => d.regiao);
  return `<div class="card"><h3>🩹 Está com alguma dor?</h3><p class="sub">Marque a região e os treinos vão trocar os exercícios que forçam ela. Desmarque quando melhorar.</p>
  <div class="chips">${Object.entries(REGIOES).map(([k, l]) => `<button class="chip-btn ${at.includes(k) ? 'on' : ''}" onclick="alternarDor('${k}')">${l}</button>`).join('')}</div>
  ${S.dores.map(d => `<p class="sub">• ${REGIOES[d.regiao]} desde ${fmtData(d.desde)}</p>`).join('')}
  <p class="aviso">Dor forte, que piora ou dura mais de uma semana: procure um médico ou fisioterapeuta.</p></div>`;
}
function alternarDor(k) { const i = S.dores.findIndex(d => d.regiao === k); if (i >= 0) { S.dores.splice(i, 1); toast('Que bom que melhorou! 💪'); } else S.dores.push({regiao:k, desde:hojeISO()}); save(); render(); }
function bannerDores() {
  if (!R('dores') || !S.dores.length) return '';
  return `<div class="card aviso-card">🩹 Dor registrada: <b>${S.dores.map(d => REGIOES[d.regiao].toLowerCase()).join(', ')}</b>. Os treinos vão evitar exercícios que forçam essa região. <button class="btn-link" onclick="ir('saude')">Atualizar</button></div>`;
}

// ---------- Sono ----------
function cardSono() {
  if (!R('sono')) return '';
  const hj = hojeISO(), reg = S.sono.find(x => x.data === hj), ult = S.sono.slice().sort((a, b) => a.data.localeCompare(b.data)).slice(-14);
  const dias = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const x = S.sono.find(y => y.data === iso(d)); dias.push({l:String(d.getDate()).padStart(2, '0'), v:x ? x.horas : 0}); }
  graficos.sono = {barras:dias, un:'h'};
  const sem = S.sono.filter(x => noIntervalo(x.data, inicioSemana(new Date()))), media = sem.length ? sem.reduce((t, x) => t + x.horas, 0) / sem.length : null;
  return `<div class="card"><h3>😴 Sono</h3>
  <form class="form-grid" onsubmit="salvarSono(event)"><label>Horas dormidas (última noite)<input name="horas" inputmode="decimal" value="${reg ? String(reg.horas).replace('.', ',') : ''}" placeholder="ex.: 7,5"></label>
  <label>Qualidade<select name="q"><option value="boa" ${reg && reg.q === 'boa' ? 'selected' : ''}>😊 Boa</option><option value="ok" ${!reg || reg.q === 'ok' ? 'selected' : ''}>😐 Ok</option><option value="ruim" ${reg && reg.q === 'ruim' ? 'selected' : ''}>😣 Ruim</option></select></label>
  <button class="btn span2">${reg ? 'Atualizar' : 'Salvar'} sono de hoje</button></form>
  ${ult.length ? `<canvas class="grafico" data-g="sono" style="height:150px"></canvas><p class="sub">${media !== null ? `Média desta semana: <b>${fmtN(media, 1)} h</b> · ` : ''}O ideal para quem treina é de 7 a 9 horas.</p>` : ''}</div>`;
}
function salvarSono(ev) {
  ev.preventDefault(); const f = new FormData(ev.target), hrs = num(f.get('horas'));
  if (!hrs || hrs > 16) { toast('Coloque as horas dormidas (ex.: 7,5)'); return; }
  S.sono = S.sono.filter(x => x.data !== hojeISO()); S.sono.push({data:hojeISO(), horas:hrs, q:f.get('q')}); save(); render(); toast('Sono registrado 😴');
}
function tileSono() {
  if (!R('sono')) return '';
  const x = S.sono.find(y => y.data === hojeISO());
  return `<div class="tile" onclick="ir('saude')"><span>😴</span><b>${x ? fmtN(x.horas, 1) + ' h' : 'Registrar'}</b><small>${x ? 'sono de hoje' : 'como dormiu?'}</small>${x && x.horas < 6 ? '<em class="ruim">Dormiu pouco: pegue leve hoje</em>' : ''}</div>`;
}

// ---------- Fotos de evolução (IndexedDB, só no aparelho) ----------
function bancoFotos() { return new Promise((ok, erro) => { const r = indexedDB.open('fit-fotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('fotos', {keyPath:'id'}); r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); }); }
async function fotosTodas() { try { const db = await bancoFotos(); return await new Promise(ok => { const q = db.transaction('fotos').objectStore('fotos').getAll(); q.onsuccess = () => ok(q.result.sort((a, b) => a.data.localeCompare(b.data))); q.onerror = () => ok([]); }); } catch (err) { return []; } }
async function fotoSalvar(f) { const db = await bancoFotos(); return new Promise((ok, erro) => { const t = db.transaction('fotos', 'readwrite'); t.objectStore('fotos').put(f); t.oncomplete = ok; t.onerror = () => erro(t.error); }); }
async function fotoApagar(id) { const db = await bancoFotos(); return new Promise(ok => { const t = db.transaction('fotos', 'readwrite'); t.objectStore('fotos').delete(id); t.oncomplete = ok; }); }
function cardFotos() {
  if (!R('fotos')) return '';
  setTimeout(carregarFotos, 0);
  return `<div class="card"><div class="linha"><h3>📸 Fotos de evolução</h3><button class="btn-link" onclick="compararFotos()">Comparar</button></div>
  <p class="sub">Tire sempre no mesmo lugar, com a mesma luz e a mesma pose. As fotos ficam <b>só no seu celular</b> (não entram no backup).</p>
  <div class="chips" id="ladoFoto">${['frente','lado','costas'].map((l, i) => `<button class="chip-btn ${i === 0 ? 'on' : ''}" data-l="${l}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this))">${l[0].toUpperCase() + l.slice(1)}</button>`).join('')}</div>
  <label class="btn grande" style="display:block;margin-top:0">📷 Adicionar foto<input type="file" accept="image/*" hidden onchange="adicionarFoto(this)"></label>
  <div class="fotos" id="listaFotos"><p class="sub">Carregando…</p></div></div>`;
}
async function carregarFotos() {
  const el = $('#listaFotos'); if (!el) return;
  const l = await fotosTodas();
  el.innerHTML = l.length ? l.slice().reverse().slice(0, 12).map(f => `<div class="foto" onclick="verFoto('${f.id}')"><img src="${f.img}" alt=""><small>${fmtData(f.data)} · ${f.lado}</small></div>`).join('') : '<p class="sub">Nenhuma foto ainda.</p>';
}
function adicionarFoto(inp) {
  const arq = inp.files[0]; if (!arq) return;
  const lado = ($('#ladoFoto .on') || {}).dataset?.l || 'frente';
  const img = new Image(), url = URL.createObjectURL(arq);
  img.onload = async () => {
    const esc = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    try { await fotoSalvar({id:uid(), data:hojeISO(), lado, img:c.toDataURL('image/jpeg', .8)}); toast('Foto salva 📸'); carregarFotos(); } catch (err) { toast('Não consegui salvar a foto'); }
  };
  img.onerror = () => toast('Não consegui abrir essa imagem');
  img.src = url; inp.value = '';
}
async function verFoto(id) {
  const f = (await fotosTodas()).find(x => x.id === id); if (!f) return;
  modal(`<img src="${f.img}" style="width:100%;border-radius:14px"><p class="sub">${fmtData(f.data)} · ${f.lado}</p>
  <div class="acoes"><button class="btn sec" style="color:var(--perigo)" onclick="confirmar('Apagar esta foto?',async()=>{await fotoApagar('${f.id}');render();},'Apagar')">Apagar</button><button class="btn" onclick="fecharModal()">Fechar</button></div>`);
}
async function compararFotos(lado) {
  lado = lado || 'frente';
  const l = (await fotosTodas()).filter(f => f.lado === lado);
  const abas = `<div class="chips">${['frente','lado','costas'].map(x => `<button class="chip-btn ${x === lado ? 'on' : ''}" onclick="compararFotos('${x}')">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>`;
  if (l.length < 2) { modal(`<h2>Antes × agora</h2>${abas}<p class="vazio">Você precisa de pelo menos 2 fotos de ${lado} para comparar.</p><button class="btn grande" onclick="fecharModal()">Fechar</button>`); return; }
  const a = l[0], b = l[l.length - 1], dias = Math.round((parseISO(b.data) - parseISO(a.data)) / 864e5);
  modal(`<h2>Antes × agora</h2>${abas}<div class="comparar"><div><img src="${a.img}"><small>${fmtData(a.data)}</small></div><div><img src="${b.img}"><small>${fmtData(b.data)}</small></div></div>
  <p class="sub" style="text-align:center">${dias} dias de diferença 💪</p><button class="btn grande" onclick="fecharModal()">Fechar</button>`);
}

// ---------- Compartilhar como imagem ----------
async function compartilharImagem(titulo, emoji, linhas, nomeArq) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2e1065'); g.addColorStop(1, '#7c3aed'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(W * .85, H * .12, 300, 0, 7); x.fill(); x.beginPath(); x.arc(W * .1, H * .9, 260, 0, 7); x.fill();
  x.textAlign = 'center'; x.fillStyle = '#fff';
  x.font = '220px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.fillText(emoji, W / 2, 380);
  x.font = '800 76px system-ui, sans-serif'; quebrar(x, titulo, W / 2, 520, 900, 88);
  x.font = '600 50px system-ui, sans-serif'; x.fillStyle = '#ede9fe';
  linhas.forEach((l, i) => x.fillText(l, W / 2, 720 + i * 82));
  x.font = '800 54px system-ui, sans-serif'; x.fillStyle = '#fff'; x.fillText('Fit 💪', W / 2, H - 130);
  x.font = '500 34px system-ui, sans-serif'; x.fillStyle = '#c4b5fd'; x.fillText('seu personal de bolso', W / 2, H - 80);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/png'));
  const arq = new File([blob], (nomeArq || 'fit') + '.png', {type:'image/png'});
  try { if (navigator.canShare && navigator.canShare({files:[arq]})) { await navigator.share({files:[arq], title:titulo, text:titulo + ' — Fit 💪'}); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arq.name; document.body.appendChild(a); a.click(); a.remove(); toast('Imagem salva 📥');
}
function quebrar(x, txt, cx, y, larg, alt) {
  const pal = txt.split(' '); let l = '', ls = [];
  for (const p of pal) { const t = l ? l + ' ' + p : p; if (x.measureText(t).width > larg && l) { ls.push(l); l = p; } else l = t; }
  ls.push(l); ls.forEach((t, i) => x.fillText(t, cx, y + i * alt));
}
function compartilharNivel() { const n = infoNivel(); compartilharImagem(`Virei ${n.N.nome}!`, n.N.emoji, [`Nível ${n.i + 1} de ${Frango.NIVEIS.length}`, `${n.pts} pontos de treino`], 'fit-nivel'); }
function compartilharTreino() { const r = window._ultimoTreino; if (!r) return; compartilharImagem('Treino concluído!', '🏋️', [r.nome, `${r.dur} min · ${r.series} séries`, r.volume ? `${fmtN(r.volume, 0)} kg levantados` : '', r.recs ? `🏆 ${r.recs} ${r.recs === 1 ? 'recorde novo' : 'recordes novos'}` : ''].filter(Boolean), 'fit-treino'); }
function compartilharCorrida() { const r = window._ultimaCorrida; if (!r) return; compartilharImagem(`${fmtN(r.dist / 1000, 2)} km ${r.tipo === 'corrida' ? 'corridos' : 'caminhados'}!`, r.tipo === 'corrida' ? '🏃' : '🚶', [`Tempo ${fmtDur(r.duracao)}`, `Ritmo ${fmtRitmo(ritmoDe(r))} /km`, `${r.kcal} kcal`], 'fit-corrida'); }
function compartilharResumo() { const r = window._resumo; if (!r) return; compartilharImagem('Minha semana no Fit', '📬', [`${r.a.dias} dias de treino · ${r.a.series} séries`, r.a.km ? `${fmtN(r.a.km, 1)} km de corrida/caminhada` : '', r.des !== null ? `🎯 ${r.des}/3 desafios` : '', `${r.n.N.emoji} ${r.n.N.nome}`].filter(Boolean), 'fit-semana'); }

// ---------- Modo personal: enviar / importar plano por código ----------
function codigoPlano(p) {
  const o = {v:1, n:p.nome, c:p.cfg, d:p.dias.map(d => ({n:d.nome, f:d.foco, e:d.exercicios.map(x => [x.exId, x.series, x.reps, x.descanso])}))};
  return 'FIT1-' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function enviarPlano(id) {
  const p = acharPlano(id), cod = codigoPlano(p); window._cod = cod;
  modal(`<h2>📤 Enviar plano</h2><p class="sub">Mande este código para o aluno (ou amigo). No Fit dele: Treinos → <b>Importar plano</b> → colar.</p>
  <textarea class="codigo" readonly onclick="this.select()">${cod}</textarea>
  <div class="acoes"><button class="btn sec" onclick="copiarCodigo()">Copiar</button>${navigator.share ? `<button class="btn" onclick="navigator.share({text:'Meu plano de treino no Fit 💪\\n\\n'+_cod}).catch(()=>{})">Compartilhar</button>` : ''}</div>`);
}
function copiarCodigo() { try { navigator.clipboard.writeText(window._cod).then(() => toast('Código copiado ✅'), () => toast('Selecione e copie o código')); } catch (err) { toast('Selecione e copie o código'); } }
function importarPlano() {
  modal(`<h2>📥 Importar plano</h2><p class="sub">Cole aqui o código que o seu personal (ou amigo) mandou:</p>
  <textarea class="codigo" id="codImp" placeholder="FIT1-..."></textarea><button class="btn grande" onclick="confirmarImport()">Importar</button>`);
}
function confirmarImport() {
  const t = ($('#codImp').value || '').trim(), m = t.match(/FIT1-([A-Za-z0-9+/=]+)/);
  try {
    if (!m) throw 0;
    const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    const dias = o.d.map(d => ({nome:String(d.n).slice(0, 40), foco:String(d.f).slice(0, 60), exercicios:d.e.filter(e => EXM[e[0]]).map(e => ({exId:e[0], series:Math.max(1, Math.min(10, +e[1] || 3)), reps:String(e[2]).slice(0, 30), descanso:Math.max(0, +e[3] || 0)}))})).filter(d => d.exercicios.length);
    if (!dias.length) throw 0;
    const cfg = {...cfgDe(S.perfil), ...(o.c || {})};
    const p = {id:uid(), nome:String(o.n || 'Plano importado').slice(0, 50) + ' (importado)', cfg, divisao:`${dias.length} treinos`, criado:hojeISO(), dias, proximo:0};
    S.planos.push(p); save(); fecharModal();
    confirmar(`Plano <b>${h(p.nome)}</b> importado com ${dias.length} treinos. Usar ele agora?`, () => { S.ativo = p.id; save(); render(); toast('Plano ativado ✅'); }, 'Usar agora');
    tela = 'treinos'; sub = {aba:'planos', plano:p.id}; render();
  } catch (err) { toast('Código inválido. Confira se copiou ele inteiro.'); }
}

// ---------- Boas-vindas (3 passos) ----------
function telaIntro() {
  const i = sub.intro || 0, P = [
    ['🧑‍🏫', 'Seu personal de bolso', 'Responda algumas perguntas e o Fit monta treinos para o seu objetivo, nível e tempo disponível.'],
    ['🎬', 'Veja como fazer', 'Um frango 3D mostra cada exercício. Gire com o dedo e veja quais músculos trabalham.'],
    ['🐣➜🐓', 'Evolua de verdade', 'Acompanhe cargas, corridas e corpo. Cada treino faz seu frango crescer: do Pinto Sequelado ao Galo Lenda!']];
  const [ic, t, d] = P[i];
  return `<div class="intro"><button class="btn-link pular" onclick="S.introVista=true;save();render()">Pular</button>
  <div class="intro-ic">${ic}</div><h1>${t}</h1><p>${d}</p>
  <div class="pontos">${P.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
  <button class="btn grande" onclick="${i < 2 ? `sub.intro=${i + 1};render()` : 'S.introVista=true;save();render()'}">${i < 2 ? 'Próximo' : 'Começar 💪'}</button></div>`;
}

// ---------- Painel de recursos (Perfil) ----------
function cardRecursos() {
  return `<div class="card"><h3>🧩 Recursos do app</h3><p class="sub">Desligue o que você não quiser usar.</p>
  ${RECURSOS.map(([k, ic, nome, desc]) => `<div class="recurso"><span>${ic}</span><div style="flex:1"><b>${nome}</b><small>${desc}</small></div>
    <button class="switch ${R(k) ? 'on' : ''}" role="switch" aria-checked="${R(k)}" aria-label="${nome}" onclick="alternarRecurso('${k}')"><i></i></button></div>
    ${k === 'lembretes' && R('lembretes') ? configLembretes() : ''}`).join('')}</div>`;
}
async function alternarRecurso(k) {
  const novo = !R(k);
  if (k === 'lembretes' && novo) {
    if (!('Notification' in window)) { toast('Este aparelho não aceita notificações'); return; }
    let p = Notification.permission; if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') { toast('Permita as notificações para usar os lembretes'); return; }
    registrarLembretes();
  }
  S.recursos[k] = novo; save(); render(); atualizarConfigSW();
}
function configLembretes() {
  return `<div class="lembrete-cfg"><label class="rot-input">Horário do lembrete de treino<input type="time" value="${S.lembretes.treino || '18:00'}" onchange="S.lembretes.treino=this.value;save();atualizarConfigSW()"></label>
  <label class="aceite"><input type="checkbox" ${S.lembretes.agua ? 'checked' : ''} onchange="S.lembretes.agua=this.checked;save();atualizarConfigSW()"> <span>Lembrar de beber água (10h, 13h, 16h e 19h)</span></label>
  <p class="sub">Com o app aberto ou em segundo plano recente, os avisos chegam na hora. Com o app fechado há muito tempo, o Android decide quando liberar — pode atrasar ou não chegar.</p></div>`;
}

// ---------- Lembretes ----------
async function notificar(titulo, corpo, tag) {
  try { const reg = await navigator.serviceWorker?.ready; if (reg) return reg.showNotification(titulo, {body:corpo, tag, icon:'icon-192.png', badge:'icon-192.png'}); new Notification(titulo, {body:corpo, tag}); } catch (err) {}
}
function checarLembretes() {
  if (!S.perfil || !R('lembretes') || !('Notification' in window) || Notification.permission !== 'granted') return;
  const agora = new Date(), hj = hojeISO(), hm = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0'), av = S.lembretes.avisos || (S.lembretes.avisos = {});
  const treinou = S.sessoes.some(s => s.data === hj) || S.corridas.some(c => c.data === hj);
  const folga = R('diasfixos') && S.diasFixos && S.diasFixos.length && !S.diasFixos.includes(agora.getDay());
  if (hm >= (S.lembretes.treino || '18:00') && av.treino !== hj && !treinou && !S.atual && !folga) { av.treino = hj; save(); const p = planoAtivo(); notificar('Hora do treino! 💪', p ? `Hoje: ${p.dias[p.proximo % p.dias.length].nome} — seu frango está esperando 🐔` : 'Bora treinar hoje?', 'treino'); }
  if (S.lembretes.agua) for (const hh of [10, 13, 16, 19]) {
    const k = hj + '-' + hh;
    if (agora.getHours() === hh && av.agua !== k) { av.agua = k; save(); const c = S.agua.data === hj ? S.agua.copos : 0, m = metaAgua(); if (c < m * (hh - 7) / 13) notificar('Bebe uma água 💧', `Você está em ${fmtN(c * .25, 2)} L de ${fmtN(m * .25, 1)} L hoje.`, 'agua'); }
  }
}
async function registrarLembretes() { try { const reg = await navigator.serviceWorker?.ready; if (reg && reg.periodicSync) await reg.periodicSync.register('lembretes', {minInterval:60 * 60 * 1000}); } catch (err) {} }
// o service worker lê esta configuração quando o Android acorda o app em segundo plano
async function atualizarConfigSW() {
  try {
    if (!('caches' in window) || !S.perfil) return;
    const hj = hojeISO(), cfg = {ativo:R('lembretes'), treino:S.lembretes.treino || '18:00', treinouHoje:S.sessoes.some(s => s.data === hj) || S.corridas.some(c => c.data === hj), data:hj};
    const c = await caches.open('fit-config'); await c.put('config-lembretes', new Response(JSON.stringify(cfg), {headers:{'Content-Type':'application/json'}}));
  } catch (err) {}
}
setInterval(() => { try { checarLembretes(); } catch (err) {} }, 60000);

// ---------- Estilos dos recursos ----------
document.head.insertAdjacentHTML('beforeend', `<style>
.nivel-card{display:flex;gap:14px;align-items:center;cursor:pointer}.nivel-card b{font-size:16px}.nivel-card .barra{margin:6px 0 4px}
.nivel-emoji{font-size:40px;width:56px;height:56px;border-radius:16px;background:var(--pri-claro);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.niveis{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0}.niveis div{display:flex;gap:6px;align-items:center;padding:7px 9px;border-radius:12px;background:var(--fundo);font-size:12.5px;opacity:.55}
.niveis div.feito{opacity:.9}.niveis div.atual{opacity:1;background:var(--pri-claro);outline:2px solid var(--pri)}.niveis span{font-size:18px}.niveis b{flex:1;font-size:12.5px}.niveis small{color:var(--txt2);font-size:11px}
.desafio{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--borda);font-size:14px}.desafio:last-of-type{border-bottom:0}.desafio .barra{height:7px;margin:5px 0 2px}.desafio.ok>div>div:first-child{text-decoration:line-through;color:var(--txt2)}
.aviso-card{font-size:14px;line-height:1.5;border-color:#f59e0b}
.aquec{border:2px dashed #f59e0b}
.sensacao{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px}.sensacao button{border:1.5px solid var(--borda);background:var(--card);color:var(--txt);border-radius:99px;padding:7px 11px;font-size:13px;font-weight:700;min-height:38px}
.sensacao button.on{background:var(--pri);border-color:var(--pri);color:#fff}
.fotos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.foto{cursor:pointer}.foto img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px;display:block}.foto small{font-size:11px;color:var(--txt2)}
.comparar{display:grid;grid-template-columns:1fr 1fr;gap:8px}.comparar img{width:100%;border-radius:12px;display:block}.comparar small{display:block;text-align:center;color:var(--txt2);font-size:12px;margin-top:3px}
.codigo{width:100%;min-height:110px;font-size:12px;font-family:ui-monospace,monospace;padding:10px;border-radius:12px;border:1px solid var(--borda);background:var(--fundo);color:var(--txt);word-break:break-all}
.recurso{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--borda)}.recurso:last-child{border-bottom:0}.recurso>span{font-size:22px;width:28px;text-align:center}.recurso b{display:block;font-size:14px}.recurso small{color:var(--txt2);font-size:12px}
.switch{width:50px;height:30px;border-radius:99px;border:0;background:var(--borda);position:relative;flex-shrink:0;transition:background .2s}.switch i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s}
.switch.on{background:var(--pri)}.switch.on i{left:23px}
.lembrete-cfg{background:var(--fundo);border-radius:12px;padding:10px 12px;margin:0 0 8px}.lembrete-cfg input[type=time]{max-width:160px}
.intro{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 28px;background:linear-gradient(160deg,#2e1065,#6d28d9);color:#fff;position:relative}
.intro h1{font-size:30px;line-height:1.15;margin:18px 0 10px}.intro p{font-size:17px;opacity:.9;max-width:360px}.intro-ic{font-size:84px;line-height:1}
.intro .btn{background:#fff;color:#4c1d95;max-width:360px}.intro .pular{position:absolute;top:18px;right:20px;color:#ddd6fe}
.pontos{display:flex;gap:8px;margin:28px 0 8px}.pontos i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.35)}.pontos i.on{background:#fff;width:24px;border-radius:99px}
</style>`);
