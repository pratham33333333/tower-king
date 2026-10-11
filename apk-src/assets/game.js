(function () {
  'use strict';
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  const {Game,TYPES,LEVELS}=window.TowerCore;
  const W=390,H=844, BLUE='#268df1',RED='#ed5355',NEUTRAL='#91a6a1',INK='#244247';
  const palette=[BLUE,RED,NEUTRAL];
  let saved=0;
  try {saved=Number(localStorage.getItem('towerlines-level')||localStorage.getItem('tllevel')||0);} catch(e) {}
  let game=new Game(saved),paused=false,speed=1,selected=-1,dragX=0,dragY=0,startX=0,startY=0;
  let scale=1,offX=0,offY=0,ratio=1,last=performance.now(),shownResult=0;
  function color(owner){return palette[owner===0?0:owner===1?1:2];}
  function resize(){const box=canvas.getBoundingClientRect();ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);scale=Math.min(box.width/W,box.height/H);offX=(box.width-W*scale)/2;offY=(box.height-H*scale)/2;}
  window.addEventListener('resize',resize);resize();
  function rr(x,y,w,h,r,fill){r=Math.min(r,w/2,h/2);ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}
  function circle(x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function label(s,x,y,size,col,bold){ctx.fillStyle=col;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=(bold?'700 ':'500 ')+size+'px system-ui,sans-serif';ctx.fillText(String(s),x,y);}
  function line(x1,y1,x2,y2,col,w){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawUnit(u){const c=color(u.owner);ctx.save();ctx.translate(u.x,u.y);let a=Math.atan2(u.ey-u.sy,u.ex-u.sx);ctx.rotate(a);const t=u.type;
    circle(2,6,TYPES[t].radius+1,'rgba(30,80,70,.17)');
    if(t==='troop'){circle(0,0,5,c);circle(-1,-2,2,'#f9fff4');}
    if(t==='bike'){circle(-6,5,3.5,'#374651');circle(6,5,3.5,'#374651');line(-5,1,6,1,c,3);circle(0,-2,4,c);}
    if(t==='car'){rr(-10,-5,20,12,4,c);rr(-4,-8,9,6,2,'#eaf8ed');circle(-6,7,3,'#354855');circle(6,7,3,'#354855');}
    if(t==='tank'){rr(-12,-8,24,17,5,'#405d65');rr(-9,-6,18,13,4,c);line(0,0,16,0,'#354b57',4);circle(0,0,5,'#e4dcaf');}
    if(u.hp<u.maxHp){rr(-10,-16,20,3,2,'#ffffffbb');rr(-10,-16,20*(u.hp/u.maxHp),3,2,c);}
    ctx.restore();
  }
  function drawTower(t,i){const c=color(t.owner),ring=selected===i?'rgba(38,141,241,.3)':t.pulse>0?'rgba(237,83,85,.25)':null;
    if(ring)circle(t.x,t.y,45,ring);
    circle(t.x+2,t.y+23,35,'rgba(31,81,59,.24)');circle(t.x,t.y+16,35,'#fff7d9');circle(t.x,t.y+16,30,'#f6d9a0');
    rr(t.x-22,t.y-12,44,31,7,'#836c5c');rr(t.x-24,t.y-16,44,32,7,c);rr(t.x-28,t.y-28,52,16,5,c);
    for(let n=0;n<4;n++)rr(t.x-25+n*14,t.y-35,9,12,2,c);
    circle(t.x-1,t.y+3,12,'#eef8e6');label(t.count,t.x-1,t.y+3,17,INK,true);
    let short={troop:'TROOPS',bike:'BIKES',car:'CARS',tank:'TANKS'}[t.type];
    rr(t.x-26,t.y+36,52,17,7,t.owner<0?'#dce5d5':'#fff9e4');label(short,t.x,t.y+45,9,INK,true);
    if(t.type!=='troop'){let glyph={bike:'●',car:'◆',tank:'▣'}[t.type];circle(t.x,t.y-26,10,'#fff2ce');label(glyph,t.x,t.y-26,12,INK,true);}
  }
  function drawBoard(){let grad=ctx.createLinearGradient(0,145,0,730);grad.addColorStop(0,'#d6eddf');grad.addColorStop(1,'#b9ddc4');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);circle(190,425,245,'rgba(255,255,255,.08)');
    for(const t of game.towers){circle(t.x+4,t.y+21,51,'rgba(74,126,86,.14)');circle(t.x,t.y+15,47,'#add69a');circle(t.x-4,t.y+9,42,'#c8e8a9');}
    for(let n=0;n<25;n++){let x=22+n*127%345,y=162+n*191%535;if(game.towers.every(t=>Math.hypot(t.x-x,t.y-y)>58)){circle(x,y,3+n%3,'rgba(94,166,97,.3)');circle(x+6,y-2,2,'rgba(65,145,80,.2)');}}
    for(const t of game.towers){if(t.route<0||t.owner<0)continue;const b=game.towers[t.route];line(t.x,t.y,b.x,b.y,t.owner===0?'rgba(38,141,241,.4)':'rgba(237,83,85,.4)',8);line(t.x,t.y,b.x,b.y,'rgba(255,255,255,.55)',2);}
    if(selected>=0){let t=game.towers[selected];line(t.x,t.y,dragX,dragY,'rgba(38,141,241,.75)',5);}
    for(const u of game.units)drawUnit(u);
    game.towers.forEach(drawTower);
  }
  function drawHud(){rr(18,40,354,82,23,'rgba(255,255,255,.74)');rr(24,46,342,70,20,'#fff9e4');circle(52,81,17,BLUE);label('★',52,81,18,'#fff',true);
    label('TOWER LINES',169,71,18,INK,true);label('LEVEL '+(game.level+1)+' / '+LEVELS.length,169,96,11,'#678a7e',true);
    rr(269,59,42,43,11,'#e5efe0');label(speed+'×',290,81,17,INK,true);
    rr(318,59,40,43,11,'#e5efe0');label(paused?'▶':'Ⅱ',338,81,23,INK,true);
    rr(24,706,342,91,18,'rgba(255,249,228,.94)');
    label(LEVELS[game.level].title,195,729,16,INK,true);
    if(selected>=0){let t=game.towers[selected],type=TYPES[t.type];label(type.name+'  •  SPEED '+type.speed+'  •  HIT '+type.attack,195,755,12,'#53766c',true);}
    else label(LEVELS[game.level].hint,195,755,12,'#53766c',false);
    label('Drag to connect   •   Tap tower to stop',195,780,11,'#68887f',false);
  }
  function drawOverlay(){ctx.fillStyle='rgba(24,49,42,.69)';ctx.fillRect(0,0,W,H);rr(32,283,326,290,25,'#f7f0d9');
    if(paused){label('PAUSED',195,352,29,INK,true);label('Choose your next route.',195,390,15,'#688078',false);rr(74,432,242,53,17,BLUE);label('RESUME',195,459,19,'#fff',true);label('RESTART LEVEL',195,527,15,INK,true);return;}
    let win=game.result===1,final=win&&game.level===LEVELS.length-1;
    circle(195,342,33,win?'#a9d48c':'#ffb1a2');label(win?'★':'!',195,342,35,'#fff',true);
    label(final?'CAMPAIGN CLEAR':win?'VICTORY!':'TRY AGAIN',195,406,final?24:29,INK,true);
    label(win?'All enemy towers captured':'Your towers were captured',195,441,14,'#688078',false);
    rr(74,471,242,54,17,win?BLUE:RED);label(final?'PLAY AGAIN':win?'NEXT LEVEL':'RETRY',195,498,18,'#fff',true);
  }
  function frame(now){let dt=Math.min(.08,(now-last)/1000);last=now;
    if(!paused&&!game.result){let state=game.update(dt*speed);if(state===1&&shownResult!==1){try{localStorage.setItem('towerlines-level',String(Math.min(LEVELS.length-1,game.level+1)));}catch(e){}shownResult=1;}}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,canvas.width/ratio,canvas.height/ratio);ctx.save();ctx.translate(offX,offY);ctx.scale(scale,scale);
    drawBoard();drawHud();if(paused||game.result)drawOverlay();ctx.restore();requestAnimationFrame(frame);
  }
  function point(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-offX)/scale,y:(e.clientY-r.top-offY)/scale};}
  function hitTower(x,y){let id=-1,nearest=45;game.towers.forEach((t,i)=>{let d=Math.hypot(t.x-x,t.y-y);if(d<nearest){nearest=d;id=i;}});return id;}
  function load(level){game.load(level);paused=false;selected=-1;shownResult=0;last=performance.now();}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch(err){}const p=point(e);startX=p.x;startY=p.y;
    if(paused||game.result)return;
    if(p.y<125){if(p.x>315)paused=true;else if(p.x>266)speed=speed===1?2:1;return;}
    const id=hitTower(p.x,p.y);if(id>=0&&game.towers[id].owner===0){selected=id;dragX=p.x;dragY=p.y;}
  });
  canvas.addEventListener('pointermove',e=>{if(selected>=0){const p=point(e);dragX=p.x;dragY=p.y;}});
  canvas.addEventListener('pointerup',e=>{e.preventDefault();const p=point(e);
    if(game.result){if(p.y>=460&&p.y<=540){if(game.result===1)load(game.level===LEVELS.length-1?0:game.level+1);else load(game.level);}return;}
    if(paused){if(p.y>=420&&p.y<=495)paused=false;else if(p.y>=500&&p.y<=545)load(game.level);return;}
    if(selected>=0){let target=hitTower(p.x,p.y);if(target>=0&&target!==selected)game.connect(selected,target);
      else if(Math.hypot(p.x-startX,p.y-startY)<20)game.stop(selected);selected=-1;}
  });
  canvas.addEventListener('pointercancel',()=>{selected=-1;});
  requestAnimationFrame(frame);
})();
