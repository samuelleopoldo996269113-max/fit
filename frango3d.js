/* =========================================================
   Frango 3D – demonstração dos exercícios do Fit
   Modelo liso (raymarching em WebGL), sem bibliotecas externas.
   Uso: Frango.montar(elementoContainer, idDoExercicio)  |  Frango.parar()
   ========================================================= */
(function () {
'use strict';
const V=(x,y,z)=>[x,y,z], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], len=a=>Math.hypot(a[0],a[1],a[2]),
  nrm=a=>{const l=len(a)||1;return mul(a,1/l)}, lerp=(a,b,t)=>a+(b-a)*t, lv=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)],
  cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function ik(a,c,l1,l2,pole){
  let d=sub(c,a),dist=Math.min(Math.max(len(d),.05),l1+l2-.002);const dir=nrm(d);
  const cosA=(l1*l1+dist*dist-l2*l2)/(2*l1*dist),sinA=Math.sqrt(Math.max(0,1-cosA*cosA));
  let p=sub(pole,a);p=nrm(sub(p,mul(dir,dot(p,dir))));
  return add(a,add(mul(dir,l1*cosA),mul(p,l1*sinA)));
}
const L={coxa:.45,canela:.43,braco:.30,ante:.27,tronco:.52};
let F={gord:.35,musc:.5,galo:true,tipo:'frango',vesgo:false,escala:1,cor:[.97,.96,.92]};

function corpo(P,M){
  const o=[],g=n=>M[n]==='p'?5:M[n]==='s'?6:0,fr=nrm(P.frente||[0,0,1]),up=nrm(sub(P.peito,P.pelve)),gd=F.gord,mu=F.musc,k=.8+.95*mu;
  const rb=(F.tipo==='pinto'?.13:.1)+.05*gd-.02*mu;
  const cintura=lv(P.pelve,P.peito,.45);
  o.push([P.pelve,cintura,rb-.005,g('abd')],[cintura,add(P.peito,mul(up,-.06)),rb+.01,g('abd')]);
  o.push([add(add(P.peito,mul(up,-.07)),[-.08,0,0]),add(add(P.peito,mul(up,-.07)),[.08,0,0]),.105+.025*mu+.02*gd,g('peito')]); // caixa torácica
  for(const x of [-1,1]) o.push([add(add(P.pelve,mul(fr,-.06)),[x*.065,-.02,0]),null,.085+.02*gd+.01*mu,g('gluteo')]); // glúteos
  if(gd>.3) o.push([add(lv(P.pelve,P.peito,.4),mul(fr,.02+.05*gd)),null,.04+.13*gd,g('abd')]); // barriga
  for(const x of [-1,1]) o.push([add(add(P.peito,mul(fr,.05+.03*mu)),add(mul(up,-.07),[x*(.075+.025*mu),0,0])),null,.07+.075*mu,g('peito')]); // peitoral
  if(mu>.2) for(const x of [-1,1]) o.push([add(P.peito,[x*(.1+.05*mu),-.02,0]),add(lv(P.pelve,P.peito,.42),[x*.05,0,0]),.05+.06*mu,g('costas')]); // dorsais (tronco em V)
  if(mu>.2) o.push([add(P.peito,mul(up,.02)),add(P.peito,mul(up,.13)),.06+.06*mu,g('ombro')]); // trapézio
  if(mu>.25&&gd<.6) for(const f of [.32,.52]) for(const x of [-1,1]) o.push([add(add(lv(P.pelve,P.peito,f),mul(fr,rb-.005)),[x*.038,0,0]),null,.03+.012*mu,g('abd')]); // abdômen
  o.push([P.qE,P.qD,.085+.04*gd,g('gluteo')]);
  const tr=mul(fr,-1);
  const pinto=F.tipo==='pinto';
  if(!pinto) for(const [dx,dy] of [[-.06,.04],[0,.11],[.06,.04]]) o.push([add(P.pelve,mul(tr,.08)),add(P.pelve,add(mul(tr,.25),add(mul(up,dy+.08),[dx,0,0]))),.035,1]);
  o.push([P.peito,P.cabeca,.065+.035*mu,0],[add(P.cabeca,mul(up,-.03)),add(P.cabeca,mul(up,.03)),pinto?.19:.125-.01*mu,0]);
  const bico=add(P.cabeca,mul(fr,pinto?.17:.12));
  o.push([bico,add(bico,add(mul(fr,.09),mul(up,-.035))),.03,1],[bico,add(bico,mul(fr,.05)),.046,1]);
  if(!pinto) o.push([add(add(P.cabeca,mul(fr,.11)),mul(up,-.1)),add(add(P.cabeca,mul(fr,.1)),mul(up,-.14)),F.galo?.032:.02,2]);
  if(pinto) o.push([add(P.cabeca,mul(up,.18)),add(add(P.cabeca,mul(up,.25)),mul(fr,-.04)),.02,1]); // topetinho
  else{const cs=F.galo?[.05,.068,.055]:[.028,.034,.028];
  [-.07,.0,.07].forEach((d,i)=>o.push([add(add(P.cabeca,mul(up,.145-Math.abs(d)*.3)),mul(fr,d)),null,cs[i],2]));}
  for(const x of [-1,1]){
    const e=pinto?add(add(add(P.cabeca,mul(fr,.155)),mul(up,.05)),[x*.08,0,0]):add(add(add(P.cabeca,mul(fr,.1)),mul(up,.03)),[x*.07,0,0]);
    const vz=F.vesgo?(x<0?[.016,.012,0]:[.004,-.014,0]):[-x*.008,0,0]; // sequelado: um olho pra cada lado
    o.push([e,null,pinto?.05:.04,3],[add(add(e,mul(fr,pinto?.035:.028)),vz),null,pinto?.022:.019,4]);
    // sobrancelha brava (ponta de dentro mais baixa)
    if(!pinto&&!F.vesgo) o.push([add(add(e,mul(up,.065)),add(mul(fr,.02),[x*.035,0,0])),add(add(e,mul(up,.035)),add(mul(fr,.035),[-x*.035,0,0])),.013,4]);
  }
  for(const s of ['E','D']){
    o.push([add(lv(P['q'+s],P['joe'+s],.3),mul(fr,.012)),null,.065*k+.035*gd,g('coxa')],[P['q'+s],P['joe'+s],.05*k+.025*gd,g('coxa')]);
    o.push([P['joe'+s],P['tor'+s],.04+.01*mu,g('pant')],[add(lv(P['joe'+s],P['tor'+s],.3),mul(fr,-.025)),null,.045+.025*mu,g('pant')]); // canela e panturrilha
    o.push([P['tor'+s],add(P['tor'+s],[0,.05,0]),.032,1]); // tornozelo laranja
    const t=P['tor'+s],lado=s==='E'?-1:1;
    for(const a2 of [-.5,0,.5]){const dz=fr[1]>.5?1:Math.sign(fr[2]||1);o.push([t,add(t,[Math.sin(a2)*.13+lado*.01,-.045,Math.cos(a2)*.13*dz]),.022,1]);}
    const om=P['ombro'+s],co=P['cot'+s],pu=P['pun'+s],dU=nrm(sub(co,om)),tw=sub(pu,co);
    let lad=sub(tw,mul(dU,dot(tw,dU)));lad=len(lad)>.02?nrm(lad):fr;
    o.push([om,co,.052*k,g('braco')],[add(lv(om,co,.5),mul(lad,.025+.015*mu)),null,.04+.06*mu,g('braco')]); // bíceps
    if(mu>.2) o.push([add(lv(om,co,.45),mul(lad,-.025)),null,.035+.045*mu,g('triceps')]); // tríceps
    o.push([add(om,[(s==='E'?-1:1)*.03*mu,.01*mu,0]),null,.06+.065*mu,g('ombro')]); // deltoide
    o.push([co,pu,.045*k,g('ante')]);
    o.push([add(pu,mul(nrm(tw),.035)),null,.05+.025*mu,g('ante')]); // punho fechado
  }
  return o;
}

// ---------- cargas ----------
function barra(e,d,raio,ext){
  const dir=nrm(sub(d,e)),c=lv(e,d,.5),o={caps:[[add(c,mul(dir,-ext)),add(c,mul(dir,ext)),.016,7]],discos:[]};
  for(const s of [-1,1]){const k=add(c,mul(dir,s*(ext-.1)));o.discos.push([k,dir,raio,.022]);}
  return o;
}
function halteres(e,d,eixo){ // um halter em cada mão; eixo = direção do cabo
  const o={caps:[],discos:[]};
  for(const m of [e,d]){const ax=nrm(eixo||[1,0,0]);o.caps.push([add(m,mul(ax,-.13)),add(m,mul(ax,.13)),.014,7]);
    o.discos.push([add(m,mul(ax,-.1)),ax,.065,.025]);o.discos.push([add(m,mul(ax,.1)),ax,.065,.025]);}
  return o;
}
function juntar(...l){const o={caps:[],discos:[]};for(const x of l){o.caps.push(...x.caps);o.discos.push(...x.discos);}return o;}
function pes(P){}

// ---------- bases de postura ----------
// em pé, com quadril em altura y0
function emPe(P,opt={}){
  const lean=opt.lean||0,dobra=opt.dobra||0,abre=opt.abre||.12;
  for(const [s,x] of [['E',-1],['D',1]]){
    const tor=[x*abre,.08,opt['tz'+s]||0];P['tor'+s]=tor;
    const q=[x*.1,0,opt.qz||0];
    // joelho por IK entre quadril e tornozelo
    P['q'+s]=q;
  }
  const altura=opt.hip??(.08+L.canela+L.coxa-.01-dobra*.25);
  for(const s of ['E','D']){P['q'+s][1]=altura;P['joe'+s]=ik(P['tor'+s],P['q'+s],L.canela,L.coxa,add(P['tor'+s],[0,.2,1]));}
  P.pelve=lv(P.qE,P.qD,.5);
  const u=[0,Math.cos(lean),Math.sin(lean)];
  P.peito=add(P.pelve,mul(u,L.tronco));P.pescoco=add(P.peito,mul(u,.1));P.cabeca=add(add(P.peito,mul(u,.27)),[0,0,.04]);
  P.frente=[0,-Math.sin(lean)*.5,1];
  P.ombroE=add(P.peito,[-.19,-.02,0]);P.ombroD=add(P.peito,[.19,-.02,0]);
  return u;
}
function bracos(P,punE,punD,pole){
  P.punE=punE;P.punD=punD;
  for(const s of ['E','D'])P['cot'+s]=ik(P['ombro'+s],P['pun'+s],L.braco,L.ante,add(P['ombro'+s],pole(s==='E'?-1:1)));
}

// ---------- famílias de movimento: pose(p) com p=0 início, p=1 fim da fase excêntrica ----------
const POSES={
 agach(p,o){const P={},a=lerp(.05,.62,p),b=lerp(.06,1.5,p),c=lerp(.12,.78,p);
   for(const [s,x] of [['E',-.17],['D',.17]]){const tor=[x,.08,0],joe=add(tor,[x*.2*p,L.canela*Math.cos(a),L.canela*Math.sin(a)]);
     P['tor'+s]=tor;P['joe'+s]=joe;P['q'+s]=add([Math.sign(x)*.1,0,0],[0,joe[1]+L.coxa*Math.cos(b),joe[2]-L.coxa*Math.sin(b)]);}
   P.pelve=lv(P.qE,P.qD,.5);const u=[0,Math.cos(c),Math.sin(c)],tras=[0,Math.sin(c),-Math.cos(c)];
   P.peito=add(P.pelve,mul(u,L.tronco));P.cabeca=add(add(P.peito,mul(u,.27)),[0,0,.05]);P.frente=[0,-Math.sin(c)*.4,1];
   P.ombroE=add(P.peito,[-.19,-.02,0]);P.ombroD=add(P.peito,[.19,-.02,0]);
   let carga={caps:[],discos:[]};
   if(o.carga==='halter'){const m=add(add(P.peito,mul(u,-.12)),mul(P.frente,.2));bracos(P,add(m,[-.05,0,0]),add(m,[.05,0,0]),x=>[x,-1,.3]);carga={caps:[[add(m,[0,-.12,0]),add(m,[0,.12,0]),.02,7]],discos:[[add(m,[0,.11,0]),[0,1,0],.08,.03]]};}
   else if(o.carga==='nenhuma'){const m=add(P.peito,add(mul(nrm(P.frente),.4),mul(u,-.05)));bracos(P,add(m,[-.15,0,0]),add(m,[.15,0,0]),x=>[x,-1,0]);}
   else{const bc=add(add(P.peito,mul(tras,.1)),mul(u,.02));bracos(P,add(bc,[-.43,0,0]),add(bc,[.43,0,0]),x=>[0,-1,-.3]);carga=barra(P.punE,P.punD,.2,.78);}
   return {P,carga};},
 supino(p,o){const P={},yT=.6;P.frente=[0,1,0];P.pelve=[0,yT+.02,.48];P.peito=[0,yT+.05,-.04];P.cabeca=[0,yT+.07,-.33];P.qE=[-.1,yT,.48];P.qD=[.1,yT,.48];
   for(const [s,x] of [['E',-1],['D',1]]){P['joe'+s]=[x*.2,yT-.12,.9];P['tor'+s]=[x*.24,.08,.78];P['ombro'+s]=[x*.19,yT+.02,-.04];}
   let carga;
   if(o.carga==='crucifixo'){const ab=lerp(.25,1.25,p);bracos(P,[-.19-Math.sin(ab)*.52,yT+.04+Math.cos(ab)*.52,-.02],[.19+Math.sin(ab)*.52,yT+.04+Math.cos(ab)*.52,-.02],x=>[x*.2,1,.6]);carga=halteres(P.punE,P.punD,[0,0,1]);}
   else{bracos(P,lv([-.36,yT+.6,-.02],[-.36,yT+.17,.06],p),lv([.36,yT+.6,-.02],[.36,yT+.17,.06],p),x=>[x,-.6,.35]);carga=o.carga==='halteres'?halteres(P.punE,P.punD,[1,0,0]):barra(P.punE,P.punD,.2,.8);}
   carga.caps.push([[0,.04,-.35],[0,.04,.55],.04,9]);
   return {P,carga,banco:[[-.17,.1,-.5],[.17,yT-.13,.7]]};},
 flexao(p,o){const P={},h=lerp(.62,.2,p),pe=[0,.06,.85];P.frente=[0,-.7,-.7];
   const ombroC=[0,h,-.42];P.peito=ombroC;P.pelve=lv(pe,ombroC,.42);P.pelve[1]+=.02;P.cabeca=add(ombroC,[0,.05,-.27]);
   for(const [s,x] of [['E',-1],['D',1]]){P['tor'+s]=[x*.1,.06,.85];P['q'+s]=add(P.pelve,[x*.1,0,0]);P['joe'+s]=lv(P['q'+s],P['tor'+s],.5);P['joe'+s][1]+=.01;P['ombro'+s]=add(ombroC,[x*.19,0,0]);}
   bracos(P,[-.3,.05,-.42],[.3,.05,-.42],x=>[x*1,.4,.4]);
   return {P,carga:{caps:[],discos:[]}};},
 rosca(p,o){const P={},t=lerp(2.35,.12,p);emPe(P);
   const pun=[];for(const [s,x] of [['E',-1],['D',1]]){P['cot'+s]=add(P['ombro'+s],[x*.02,-L.braco,.03]);P['pun'+s]=add(P['cot'+s],[x*.01,-L.ante*Math.cos(t),L.ante*Math.sin(t)]);}
   return {P,carga:o.carga==='halteres'?halteres(P.punE,P.punD,[o.martelo?0:1,o.martelo?1:0,0]):barra(P.punE,P.punD,.13,.6)};},
 desenv(p,o){const P={};emPe(P);const y0=P.ombroD[1];
   bracos(P,lv([-.42,y0+.62,.04],[-.36,y0+.05,.1],p),lv([.42,y0+.62,.04],[.36,y0+.05,.1],p),x=>[x*1,-1,.2]);
   return {P,carga:o.carga==='barra'?barra(P.punE,P.punD,.18,.75):halteres(P.punE,P.punD,[1,0,0])};},
 elevlat(p,o){const P={};emPe(P);const ab=lerp(1.45,.15,p);
   bracos(P,add(P.ombroE,[-Math.sin(ab)*.55,-Math.cos(ab)*.55,.04]),add(P.ombroD,[Math.sin(ab)*.55,-Math.cos(ab)*.55,.04]),x=>[0,1,-1]);
   return {P,carga:halteres(P.punE,P.punD,[0,0,1])};},
 remada(p,o){const P={};const u=emPe(P,{lean:1.0,dobra:.5,qz:-.12});
   const baixo=x=>add(add(P['ombro'+(x<0?'E':'D')],[0,-.55,.05]),[0,0,0]),cima=x=>add(P['ombro'+(x<0?'E':'D')],[x*.03,-.38,-.25]);
   bracos(P,lv(cima(-1),baixo(-1),p),lv(cima(1),baixo(1),p),x=>[x*.3,1,-1]);
   return {P,carga:o.carga==='halteres'?halteres(P.punE,P.punD,[0,0,1]):barra(P.punE,P.punD,.2,.75)};},
 puxada(p,o){const P={};emPe(P,{dobra:.15});const y0=P.ombroD[1];
   bracos(P,lv([-.3,y0+.18,.12],[-.5,y0+.55,.02],p),lv([.3,y0+.18,.12],[.5,y0+.55,.02],p),x=>[x*1,-1,-.3]);
   return {P,carga:{caps:[[add(P.punE,[-.25,0,0]),add(P.punD,[.25,0,0]),.018,7]],discos:[]}};},
 hinge(p,o){const P={};const u=emPe(P,{lean:lerp(.05,1.25,p),dobra:lerp(.05,.4,p),qz:lerp(0,-.18,p)});
   const pend=x=>{const om=P['ombro'+(x<0?'E':'D')];return [x*.22,Math.max(.2,om[1]-.56),om[2]+.02];};
   bracos(P,pend(-1),pend(1),x=>[0,0,-1]);
   return {P,carga:o.carga==='halteres'?halteres(P.punE,P.punD,[0,0,1]):barra(P.punE,P.punD,.22,.78)};},
 afundo(p,o){const P={},d=lerp(0,.42,p);
   P.torE=[-.13,.08,.42];P.torD=[.13,.12,-.45];
   const hip=[0,.98-d,0];P.qE=add(hip,[-.1,0,0]);P.qD=add(hip,[.1,0,0]);
   P.joeE=ik(P.torE,P.qE,L.canela,L.coxa,add(P.torE,[0,.2,1]));P.joeD=ik(P.torD,P.qD,L.canela,L.coxa,add(P.torD,[0,-.2,1]));
   P.pelve=hip;P.peito=add(hip,[0,L.tronco,.03]);P.cabeca=add(P.peito,[0,.27,.05]);P.frente=[0,0,1];
   P.ombroE=add(P.peito,[-.19,-.02,0]);P.ombroD=add(P.peito,[.19,-.02,0]);
   bracos(P,add(P.ombroE,[-.04,-.55,.02]),add(P.ombroD,[.04,-.55,.02]),x=>[0,0,-1]);
   return {P,carga:o.carga==='nenhuma'?{caps:[],discos:[]}:halteres(P.punE,P.punD,[0,0,1])};},
 triceps(p,o){const P={};emPe(P,{lean:.15,dobra:.1});const t=lerp(.05,1.45,p);
   for(const [s,x] of [['E',-1],['D',1]]){P['cot'+s]=add(P['ombro'+s],[x*.03,-L.braco,.06]);P['pun'+s]=add(P['cot'+s],[-x*.03,-L.ante*Math.cos(t),L.ante*Math.sin(t)]);}
   return {P,carga:{caps:[[P.punE,P.punD,.018,7],[lv(P.punE,P.punD,.5),add(lv(P.punE,P.punD,.5),[0,1.2,0]),.006,7]],discos:[]}};},
 panturrilha(p,o){const P={};const sobe=lerp(.09,0,p);emPe(P,{hip:.08+L.canela+L.coxa-.01+sobe});
   for(const s of ['E','D'])P['tor'+s][1]+=sobe; // calcanhar sobe
   bracos(P,add(P.ombroE,[-.04,-.55,.02]),add(P.ombroD,[.04,-.55,.02]),x=>[0,0,-1]);
   return {P,carga:{caps:[],discos:[]}};},
 encolh(p,o){const P={};emPe(P);const s2=lerp(.06,0,p);P.ombroE[1]+=s2;P.ombroD[1]+=s2;
   bracos(P,add(P.ombroE,[-.02,-.56,.04]),add(P.ombroD,[.02,-.56,.04]),x=>[0,0,-1]);
   return {P,carga:o.carga==='halteres'?halteres(P.punE,P.punD,[0,0,1]):barra(P.punE,P.punD,.2,.7)};},
 ponte(p,o){const P={},h=lerp(.5,.13,p);P.frente=[0,1,0];
   P.peito=[0,.13,-.45];P.cabeca=[0,.16,-.75];P.pelve=[0,h,.05];
   for(const [s,x] of [['E',-1],['D',1]]){P['q'+s]=add(P.pelve,[x*.1,0,0]);P['tor'+s]=[x*.16,.08,.5];P['joe'+s]=ik(P['tor'+s],P['q'+s],L.canela,L.coxa,add(P['tor'+s],[0,1,-.2]));P['ombro'+s]=add(P.peito,[x*.19,0,0]);}
   bracos(P,[-.3,.05,-.05],[.3,.05,-.05],x=>[x,.5,0]);
   return {P,carga:o.carga==='barra'?barra(P.punE,P.punD,.2,.75):{caps:[],discos:[]}};},
 abdominal(p,o){const P={},c=lerp(.55,0,p);P.frente=[0,Math.cos(c),Math.sin(c)*-1];P.frente=[0,1,0];
   P.pelve=[0,.12,.05];const u=[0,Math.sin(c),-Math.cos(c)];P.peito=add(P.pelve,mul(u,L.tronco));P.cabeca=add(P.peito,mul(u,.27));
   for(const [s,x] of [['E',-1],['D',1]]){P['q'+s]=add(P.pelve,[x*.1,0,0]);P['tor'+s]=[x*.14,.08,.62];P['joe'+s]=ik(P['tor'+s],P['q'+s],L.canela,L.coxa,add(P['tor'+s],[0,1,-.2]));P['ombro'+s]=add(P.peito,[x*.19,-.02,0]);}
   bracos(P,add(P.cabeca,[-.14,0,-.05]),add(P.cabeca,[.14,0,-.05]),x=>[x,0,.5]);
   return {P,carga:{caps:[],discos:[]}};},
 prancha(p,o){const P={},h=.32+.015*Math.sin(p*Math.PI);P.frente=[0,-.7,-.7];
   const om=[0,h,-.45];P.peito=om;P.pelve=[0,h-.06,.12];P.cabeca=add(om,[0,.06,-.27]);
   for(const [s,x] of [['E',-1],['D',1]]){P['tor'+s]=[x*.1,.06,.88];P['q'+s]=add(P.pelve,[x*.1,0,0]);P['joe'+s]=lv(P['q'+s],P['tor'+s],.5);P['ombro'+s]=add(om,[x*.19,0,0]);P['cot'+s]=[x*.19,.05,-.45];P['pun'+s]=[x*.12,.05,-.72];}
   return {P,carga:{caps:[],discos:[]}};},
 flex(p,o,t){const P={};emPe(P);const r=Math.sin((t||0)*2.2)*.5+.5;
   for(const [s,x] of [['E',-1],['D',1]]){P['cot'+s]=add(P['ombro'+s],[x*L.braco*.97,.04+.03*r,.02]);P['pun'+s]=add(P['cot'+s],[-x*.06,L.ante*.95,.05+.04*r]);}
   return {P,carga:{caps:[],discos:[]}};},
 andar(p,o,t){const P={},w=(t||0)*Math.PI*2/1.1,rap=o.rapido?1.4:1;
   const ang=s=>Math.sin(w+(s==='E'?0:Math.PI))*.38*rap;
   const hip=[0,.98+Math.abs(Math.sin(w))*.02*rap,0];P.pelve=hip;P.qE=add(hip,[-.1,0,0]);P.qD=add(hip,[.1,0,0]);
   for(const s of ['E','D']){const a=ang(s),q=P['q'+s];const joe=add(q,[0,-L.coxa*Math.cos(a),L.coxa*Math.sin(a)]);const fl=Math.max(0,-Math.sin(w+(s==='E'?0:Math.PI)))*.6*rap;
     P['joe'+s]=joe;P['tor'+s]=add(joe,[0,-L.canela*Math.cos(a-fl),L.canela*Math.sin(a-fl)]);if(P['tor'+s][1]<.08)P['tor'+s][1]=.08;}
   const lean=o.rapido?.25:.05,u=[0,Math.cos(lean),Math.sin(lean)];P.peito=add(hip,mul(u,L.tronco));P.cabeca=add(P.peito,add(mul(u,.27),[0,0,.04]));P.frente=[0,0,1];
   P.ombroE=add(P.peito,[-.19,-.02,0]);P.ombroD=add(P.peito,[.19,-.02,0]);
   for(const [s,x] of [['E',-1],['D',1]]){const a=-ang(s)*1.2;P['cot'+s]=add(P['ombro'+s],[x*.03,-L.braco*Math.cos(a),L.braco*Math.sin(a)]);const fb=o.rapido?1.4:.3;P['pun'+s]=add(P['cot'+s],[0,-L.ante*Math.cos(a+fb),L.ante*Math.sin(a+fb)]);}
   return {P,carga:{caps:[],discos:[]}};}
};
const CICLO={andar:true,flex:true}; // animação contínua (sem fase de descida/subida)

// exercício -> [família, opções]
const MAPA={
 agach_livre:['agach'],agach_smith:['agach'],hack:['agach'],agach_frontal:['agach'],leg_press:['agach'],goblet:['agach',{carga:'halter'}],agach_sumo_h:['agach',{carga:'halter'}],
 agach_corpo:['agach',{carga:'nenhuma'}],sissy:['agach',{carga:'nenhuma'}],pistol_assist:['agach',{carga:'nenhuma'}],cadeira_parede:['agach',{carga:'nenhuma',fixo:1}],extensora:['agach',{carga:'nenhuma'}],
 supino_reto:['supino'],supino_maq:['supino'],supino_inc_barra:['supino'],supino_dec:['supino'],supino_smith:['supino'],supino_fechado:['supino'],
 supino_inc_h:['supino',{carga:'halteres'}],supino_reto_h:['supino',{carga:'halteres'}],
 crucifixo_h:['supino',{carga:'crucifixo'}],crucifixo_inc:['supino',{carga:'crucifixo'}],crossover:['supino',{carga:'crucifixo'}],crossover_baixo:['supino',{carga:'crucifixo'}],peck_deck:['supino',{carga:'crucifixo'}],
 flexao:['flexao'],flexao_inc:['flexao'],flexao_declinada:['flexao'],flexao_aberta:['flexao'],flexao_diamante:['flexao'],flexao_tri:['flexao'],
 rosca_barra:['rosca'],rosca_ez:['rosca'],rosca_scott:['rosca'],rosca_polia:['rosca'],rosca_inversa:['rosca'],rosca_alt:['rosca',{carga:'halteres'}],rosca_conc:['rosca',{carga:'halteres'}],
 rosca_inc:['rosca',{carga:'halteres'}],rosca_martelo:['rosca',{carga:'halteres',martelo:1}],rosca_punho:['rosca',{carga:'halteres'}],rosca_punho_inv:['rosca',{carga:'halteres'}],
 desenv_h:['desenv'],arnold:['desenv'],desenv_maq:['desenv',{carga:'barra'}],desenv_barra:['desenv',{carga:'barra'}],pike:['flexao'],
 elev_lat:['elevlat'],elev_lat_polia:['elevlat'],elev_lat_maq:['elevlat'],crucifixo_inv:['elevlat'],voador_inv:['elevlat'],elev_front:['desenv'],
 remada_curvada:['remada'],remada_cavalinho:['remada'],remada_halteres:['remada',{carga:'halteres'}],remada_uni:['remada',{carga:'halteres'}],remada_baixa:['remada'],remada_maq:['remada'],
 remada_alta_polia:['remada'],remada_inv:['remada'],barra_aust:['remada'],serrote_toalha:['remada'],face_pull:['remada'],
 puxada:['puxada'],puxada_neutra:['puxada'],puxada_supinada:['puxada'],barra_fixa:['puxada'],chin_up:['puxada'],pulldown:['puxada'],
 terra:['hinge'],stiff:['hinge'],stiff_h:['hinge',{carga:'halteres'}],stiff_uni:['hinge',{carga:'halteres'}],stiff_uni_h:['hinge',{carga:'halteres'}],bom_dia:['hinge'],hiperextensao:['hinge',{carga:'halteres'}],
 afundo:['afundo'],bulgaro:['afundo'],passada_caminhando:['afundo'],step_up:['afundo'],agach_bulgaro_gluteo:['afundo'],afundo_corpo:['afundo',{carga:'nenhuma'}],
 tri_pulley:['triceps'],tri_barra:['triceps'],tri_unilateral:['triceps'],tri_coice_polia:['triceps'],coice:['triceps'],mergulho_maq:['triceps'],tri_testa:['triceps'],tri_frances:['triceps'],mergulho_banco:['triceps'],paralelas:['triceps'],
 pant_pe:['panturrilha'],pant_sent:['panturrilha'],pant_degrau:['panturrilha'],pant_leg:['panturrilha'],pant_smith:['panturrilha'],
 encolh_barra:['encolh'],encolh_h:['encolh',{carga:'halteres'}],farmer:['andar',{}],
 elev_pelvica:['ponte',{carga:'barra'}],elev_pelvica_h:['ponte'],hip_thrust_maq:['ponte',{carga:'barra'}],ponte:['ponte'],ponte_uni:['ponte'],ponte_pes_elevados:['ponte'],
 crunch:['abdominal'],abd_polia:['abdominal'],abd_maq:['abdominal'],bicicleta:['abdominal'],russian_twist:['abdominal'],abd_infra_banco:['abdominal'],
 prancha:['prancha'],prancha_lat:['prancha'],hollow:['prancha'],dead_bug:['abdominal'],
 esteira:['andar'],caminhada:['andar'],eliptico:['andar'],escada:['andar'],corrida_estacionaria:['andar',{rapido:1}],mountain:['prancha'],
};
const DESTAQUE={peito:{peito:'p',triceps:'s',ombro:'s'},costas:{costas:'p',braco:'s'},ombro:{ombro:'p',triceps:'s'},biceps:{braco:'p',ante:'s'},triceps:{triceps:'p',braco:'s'},
 antebraco:{ante:'p'},trapezio:{ombro:'p'},quadriceps:{coxa:'p',gluteo:'s'},posterior:{coxa:'p',gluteo:'s'},gluteo:{gluteo:'p',coxa:'s'},panturrilha:{pant:'p'},
 abdomen:{abd:'p'},lombar:{abd:'s',gluteo:'s'},cardio:{coxa:'s',pant:'s'}};
const ALVO={flex:[0,1.05,0],puxada:[0,1.12,0],desenv:[0,1.08,0],supino:[0,.62,.15],flexao:[0,.35,.15],ponte:[0,.3,-.1],abdominal:[0,.35,.1],prancha:[0,.3,.15],remada:[0,.8,0],hinge:[0,.8,0]};
const VISTA={supino:.9,flexao:1.25,ponte:1.2,abdominal:1.2,prancha:1.25,remada:1.1,hinge:1.2,afundo:1.3,triceps:.9,andar:1.1,panturrilha:1.2};

// ---------- renderização ----------
let cv=null,gl=null,U={},NMAX=40,W=0,H=0,escala=1,yaw=.8,yawAlvo=.8,pitch=.2,tempo=0,ult=0,ativo=false,cena=null,tempos=[],arr=null;
function iniciarGL(){
  cv=document.createElement('canvas');cv.className='frango-cv';
  gl=cv.getContext('webgl',{premultipliedAlpha:false,antialias:false});
  if(!gl)return false;
  NMAX=Math.max(40,Math.min(72,Math.floor((gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)-24)/2)));
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS=`precision highp float;
uniform vec2 uRes;uniform vec3 uRo,uF,uR,uU,uAlvo;uniform float uN,uBanco,uEscuro;uniform vec3 uPena;
uniform vec4 uA[${NMAX}],uB[${NMAX}],uDC[4],uDN[4];uniform vec3 uBmin,uBmax;
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);return length(pa-ba*h)-r;}
float cil(vec3 p,vec3 c,vec3 n,float r,float e){vec3 q=p-c;float y=dot(q,n);vec2 d=abs(vec2(length(q-n*y),y))-vec2(r,e);return min(max(d.x,d.y),0.)+length(max(d,0.))-.01;}
float caixa(vec3 p){vec3 c=(uBmin+uBmax)*.5,h=(uBmax-uBmin)*.5;vec3 q=abs(p-c)-h+.03;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-.03;}
vec3 cor(float m){
 if(m<.5)return uPena; if(m<1.5)return vec3(.98,.55,.12); if(m<2.5)return vec3(.9,.16,.16);
 if(m<3.5)return vec3(1.); if(m<4.5)return vec3(.06,.03,.02); if(m<5.5)return vec3(.52,.32,.95); if(m<6.5)return vec3(.76,.68,.99);
 if(m<7.5)return vec3(.62,.64,.68); if(m<8.5)return vec3(.12,.12,.14); return vec3(.27,.14,.55);}
bool suave(float m){return m<1.5||(m>4.5&&m<6.5);}
float mapa(vec3 p){float ds=1e5,dh=1e5;
 for(int i=0;i<${NMAX};i++){if(float(i)>=uN)break;vec4 A=uA[i],B=uB[i];float d=cap(p,A.xyz,B.xyz,A.w);
  if(suave(B.w))ds=smin(ds,d,.028);else dh=min(dh,d);}
 for(int i=0;i<4;i++)dh=min(dh,cil(p,uDC[i].xyz,uDN[i].xyz,uDC[i].w,uDN[i].w));
 if(uBanco>.5)dh=min(dh,caixa(p));
 return min(ds,dh);}
vec3 mapaCor(vec3 p){float ds=1e5,dh=1e5;vec3 cs=vec3(1),ch=vec3(1);
 for(int i=0;i<${NMAX};i++){if(float(i)>=uN)break;vec4 A=uA[i],B=uB[i];float d=cap(p,A.xyz,B.xyz,A.w);
  if(suave(B.w)){float h=clamp(.5+.5*(d-ds)/.028,0.,1.);cs=mix(cor(B.w),cs,h);ds=mix(d,ds,h)-.028*h*(1.-h);}
  else if(d<dh){dh=d;ch=cor(B.w);}}
 for(int i=0;i<4;i++){float d=cil(p,uDC[i].xyz,uDN[i].xyz,uDC[i].w,uDN[i].w);if(d<dh){dh=d;ch=cor(8.);}}
 if(uBanco>.5){float d=caixa(p);if(d<dh){dh=d;ch=cor(9.);}}
 return ds<dh?cs:ch;}
vec3 normal(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*mapa(p+e.xyy)+e.yyx*mapa(p+e.yyx)+e.yxy*mapa(p+e.yxy)+e.xxx*mapa(p+e.xxx));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 vec3 rd=normalize(uF*1.5+uR*uv.x+uU*uv.y),ro=uRo;
 vec4 saida=vec4(0.);
 // chão com sombra suave
 float tc=-1.;if(rd.y<0.){tc=-ro.y/rd.y;}
 // esfera envolvente
 vec3 oc=ro-uAlvo;float b=dot(oc,rd),c=dot(oc,oc)-1.45*1.45,hh=b*b-c;
 float t=-1.;
 if(hh>0.){float t0=max(-b-sqrt(hh),0.),t1=-b+sqrt(hh);float tt=t0;
  for(int i=0;i<90;i++){vec3 p=ro+rd*tt;float d=mapa(p);if(d<.0012*tt){t=tt;break;}tt+=d*.95;if(tt>t1)break;}}
 if(t>0.&&(tc<0.||t<tc)){
  vec3 p=ro+rd*t,n=normal(p),c0=mapaCor(p);
  vec3 L=normalize(vec3(-.35,.85,.0)-rd*.6);
  float dif=clamp(dot(n,L),0.,1.),wrap=.5+.5*dot(n,L);
  float ao=clamp(mapa(p+n*.07)/.07,0.,1.);
  float rim=pow(1.-clamp(dot(n,-rd),0.,1.),3.);
  float spec=pow(clamp(dot(reflect(-L,n),-rd),0.,1.),24.);
  vec3 col=c0*(.38+.5*wrap+.25*dif)*mix(.72,1.,ao)+vec3(.95,.9,1.)*rim*.28+spec*.18;
  col=mix(vec3(.25,.2,.3),col,smoothstep(.08,.32,dot(n,-rd)));
  saida=vec4(col,1.);
 } else if(tc>0.){
  vec3 p=ro+rd*tc;float r=length(p.xz-uAlvo.xz);
  float sh=clamp(mapa(p+vec3(0.,.09,0.))/.3,0.,1.);
  float a=(1.-smoothstep(.6,1.5,r))*(1.-sh)*.45;
  saida=vec4(mix(vec3(.18,.08,.38),vec3(0.),uEscuro)*a,a);
 }
 gl_FragColor=vec4(saida.rgb/max(saida.a,.0001),saida.a);
}`;

  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const lp=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
  for(const n of ['uRes','uRo','uF','uR','uU','uAlvo','uN','uBanco','uEscuro','uA','uB','uDC','uDN','uBmin','uBmax','uPena'])U[n]=gl.getUniformLocation(pr,n);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  cv.addEventListener('pointerdown',e=>{arr={x:e.clientX,y:e.clientY,yaw:yawAlvo,pitch};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!arr)return;yawAlvo=arr.yaw+(e.clientX-arr.x)*.012;yaw=yawAlvo;pitch=Math.max(-.05,Math.min(.8,arr.pitch+(e.clientY-arr.y)*.006));});
  cv.addEventListener('pointerup',()=>{arr=null;});
  new ResizeObserver(tamanho).observe(cv);
  return true;
}
function tamanho(){if(!cv)return;const r=cv.getBoundingClientRect();W=r.width;H=r.height;const d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,Math.round(W*escala*d));cv.height=Math.max(1,Math.round(H*escala*d));}
function fase(t){const c=3.8,u=t%c;const ez=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  if(u<2)return[ez(u/2),0];if(u<2.3)return[1,0];if(u<3.3)return[1-ez((u-2.3)/1),1];return[0,1];}
let A=null,B=null;
function desenhar(){
  if(!gl||!W||!cena)return;
  const [p,f]=cena.fixo?[.85,0]:fase(tempo);
  const r=POSES[cena.fam](cena.ciclo?0:p,cena.op,tempo),P=r.P;
  const lab=cena.el&&cena.el.querySelector('.frango-fase');if(lab)lab.textContent=cena.ciclo?'Em movimento':cena.fixo?'Segure a posição':f===0?'Fase 1 · devagar (2 s)':'Fase 2 · com força (1 s)';
  const todas=[...r.carga.caps,...corpo(P,cena.M)];
  const caps=[...todas.filter(c=>c[3]>=7),...todas.filter(c=>c[3]<7)].slice(0,NMAX);
  if(!A||A.length!==NMAX*4){A=new Float32Array(NMAX*4);B=new Float32Array(NMAX*4);}
  A.fill(0);B.fill(0);
  const e=F.escala||1;
  caps.forEach((c,i)=>{const a=c[0],b=c[1]||c[0];A.set([a[0]*e,a[1]*e,a[2]*e,c[2]*e],i*4);B.set([b[0]*e,b[1]*e,b[2]*e,c[3]],i*4);});
  const dc=new Float32Array(16),dn=new Float32Array(16);
  r.carga.discos.slice(0,4).forEach((d,i)=>{dc.set([d[0][0]*e,d[0][1]*e,d[0][2]*e,d[2]*e],i*4);dn.set([...d[1],d[3]*e],i*4);});
  for(let i=r.carga.discos.length;i<4;i++){dc.set([0,-50,0,.01],i*4);dn.set([0,1,0,.01],i*4);}
  const alvo=mul(ALVO[cena.fam]||[0,.9,0],e),dist=3.5*(.55+.45*e)*(cena.fam==='flex'?1.15:1),ro=[alvo[0]+dist*Math.sin(yaw)*Math.cos(pitch),alvo[1]+dist*Math.sin(pitch),alvo[2]+dist*Math.cos(yaw)*Math.cos(pitch)];
  const Fw=nrm(sub(alvo,ro)),Rt=nrm(cross(Fw,[0,1,0])),Up=cross(Rt,Fw);
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(U.uRes,cv.width,cv.height);gl.uniform3fv(U.uRo,ro);gl.uniform3fv(U.uF,Fw);gl.uniform3fv(U.uR,Rt);gl.uniform3fv(U.uU,Up);gl.uniform3fv(U.uAlvo,alvo);
  gl.uniform1f(U.uN,caps.length);gl.uniform4fv(U.uA,A);gl.uniform4fv(U.uB,B);gl.uniform4fv(U.uDC,dc);gl.uniform4fv(U.uDN,dn);
  gl.uniform1f(U.uBanco,r.banco?1:0);if(r.banco){gl.uniform3fv(U.uBmin,mul(r.banco[0],e));gl.uniform3fv(U.uBmax,mul(r.banco[1],e));}
  gl.uniform3fv(U.uPena,F.cor||[.97,.96,.92]);
  gl.uniform1f(U.uEscuro,0);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function loop(agora){
  if(!ativo)return;
  if(!document.body.contains(cv)){ativo=false;return;}
  const dt=Math.min(.05,(agora-(ult||agora))/1000);ult=agora;
  if(!window.__frangoParado){tempo+=dt;yaw+=(yawAlvo-yaw)*.12;desenhar();}
  tempos.push(dt);if(tempos.length>40){const m=tempos.reduce((a,b)=>a+b)/tempos.length;tempos=[];if(m>.045&&escala>.5){escala-=.15;tamanho();}}
  requestAnimationFrame(loop);
}
// monta o frango com os dados do perfil (peso, altura, nível, sexo e treinos feitos)
function configurar(perfil,pontos){
  let gd=.3;
  if(perfil&&perfil.peso&&perfil.altura){const imc=perfil.peso/Math.pow(perfil.altura/100,2);gd=imc<=20?0:imc<25?(imc-20)/5*.3:imc<30?.3+(imc-25)/5*.4:Math.min(1,.7+(imc-30)/10*.3);}
  const N=NIVEIS[nivelDe(pontos||0)];
  F={gord:gd*(N.tipo==='pinto'?.6:1),musc:N.musc,galo:N.tipo==='galo'&&!(perfil&&perfil.sexo==='f'),tipo:N.tipo,vesgo:!!N.vesgo,escala:N.escala,cor:N.cor};
  return F;
}
// níveis: tipo, cor, músculo, gordura base, escala
const NIVEIS=[
 {nome:'Pinto Sequelado',emoji:'🐣',pts:0,tipo:'pinto',vesgo:true,musc:0,escala:.62,cor:[1,.86,.3]},
 {nome:'Pintinho Mais ou Menos',emoji:'🐥',pts:5,tipo:'pinto',musc:.05,escala:.68,cor:[1,.84,.25]},
 {nome:'Pintinho Marrento',emoji:'🐥',pts:12,tipo:'pinto',musc:.18,escala:.74,cor:[1,.82,.22]},
 {nome:'Frango Magrelo',emoji:'🐔',pts:20,tipo:'frango',musc:0,escala:.86,cor:[.97,.96,.92]},
 {nome:'Frango de Academia',emoji:'🐔',pts:35,tipo:'frango',musc:.25,escala:.9,cor:[.97,.96,.92]},
 {nome:'Frango Marombeiro',emoji:'🐔',pts:50,tipo:'frango',musc:.45,escala:.94,cor:[.97,.96,.92]},
 {nome:'Galo Sequelado',emoji:'🐓',pts:75,tipo:'galo',vesgo:true,musc:.55,escala:1,cor:[.97,.96,.92]},
 {nome:'Galo Treinado',emoji:'🐓',pts:100,tipo:'galo',musc:.7,escala:1,cor:[.97,.96,.92]},
 {nome:'Galo Monstro',emoji:'🐓',pts:150,tipo:'galo',musc:.9,escala:1.04,cor:[.97,.96,.92]},
 {nome:'Galo Lenda',emoji:'👑',pts:250,tipo:'galo',musc:1,escala:1.08,cor:[1,.84,.35]}
];
function nivelDe(pts){let i=0;for(let k=0;k<NIVEIS.length;k++)if(pts>=NIVEIS[k].pts)i=k;return i;}
window.Frango={
  NIVEIS,nivelDe,
  mostrar(el){ // frango comemorando (para a tela de nível)
    if(!gl&&!iniciarGL())return false;
    cena={fam:'flex',op:{},M:{},ciclo:true,fixo:false,el};
    el.innerHTML='<div class="frango-giro">↔ arraste para girar</div>';el.appendChild(cv);
    yaw=yawAlvo=.35;pitch=.15;tempo=0;ult=0;tamanho();
    if(!ativo){ativo=true;requestAnimationFrame(loop);}return true;},
  tem:id=>!!MAPA[id],
  configurar,
  montar(el,exId,grupo){
    const m=MAPA[exId];if(!m)return false;
    if(!gl&&!iniciarGL())return false;
    const [fam,op]=m;cena={fam,op:op||{},M:DESTAQUE[grupo]||{},ciclo:!!CICLO[fam],fixo:!!(op&&op.fixo)||fam==='prancha',el};
    if(fam==='prancha')cena.fixo=false;
    el.innerHTML='<div class="frango-fase"></div><div class="frango-giro">↔ arraste para girar</div>';el.appendChild(cv);
    yaw=yawAlvo=VISTA[fam]??.8;pitch=.2;tempo=0;ult=0;tamanho();
    if(!ativo){ativo=true;requestAnimationFrame(loop);}
    return true;
  },
  parar(){ativo=false;cena=null;if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);},
  _teste(t,y){tempo=t;if(y!==undefined)yaw=yawAlvo=y;window.__frangoParado=true;desenhar();}
};
})();
