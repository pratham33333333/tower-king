/* Tower Lines gameplay. Coordinates are on a 390 x 844 portrait board. */
(function (root) {
  'use strict';
  const TYPES = Object.freeze({
    troop: Object.freeze({ name: 'TROOPS', speed: 106, hp: 1, attack: 1, cost: 1, spawn: 0.53, growth: 0.90, radius: 5 }),
    bike:  Object.freeze({ name: 'BIKES',  speed: 188, hp: 1, attack: 1, cost: 1, spawn: 0.56, growth: 0.82, radius: 6 }),
    car:   Object.freeze({ name: 'CARS',   speed: 135, hp: 3, attack: 2, cost: 2, spawn: 1.05, growth: 0.83, radius: 8 }),
    tank:  Object.freeze({ name: 'TANKS',  speed: 75,  hp: 6, attack: 5, cost: 4, spawn: 1.65, growth: 0.72, radius: 11 })
  });
  // x, y, owner (-1 neutral, 0 player, 1 enemy), garrison, factory type.
  const LEVELS = [
    { title:'FIRST CONTACT', hint:'Drag blue to capture a tower', ai:6.0, nodes:[[76,565,0,30,'troop'],[301,267,1,10,'troop'],[188,405,-1,5,'troop']] },
    { title:'FAST LANE', hint:'Capture the bike factory', ai:3.0, nodes:[[76,590,0,28,'troop'],[302,270,1,22,'troop'],[143,380,-1,9,'bike'],[292,500,-1,10,'troop']] },
    { title:'BIKE RUSH', hint:'Race directly to the red base', ai:2.9, nodes:[[77,570,0,25,'bike'],[303,275,1,26,'troop'],[193,410,-1,12,'troop'],[88,286,-1,8,'troop']] },
    { title:'HEAVY TRAFFIC', hint:'Cars survive several hits', ai:2.7, nodes:[[75,600,0,29,'troop'],[305,250,1,23,'bike'],[180,385,-1,12,'car'],[299,548,-1,11,'troop']] },
    { title:'TWO FRONTS', hint:'Redirect routes as the map changes', ai:3.2, nodes:[[74,591,0,42,'car'],[74,310,0,28,'troop'],[309,245,1,17,'car'],[305,574,1,15,'bike'],[194,424,-1,14,'troop']] },
    { title:'IRON FOUNDRY', hint:'Capture the tank factory', ai:3.0, nodes:[[74,581,0,35,'car'],[104,315,0,20,'troop'],[306,248,1,18,'bike'],[305,568,1,16,'troop'],[192,416,-1,9,'tank']] },
    { title:'ARMOR COLUMN', hint:'Tanks are slow but powerful', ai:2.45, nodes:[[69,599,0,31,'tank'],[93,328,0,20,'troop'],[311,263,1,27,'car'],[310,565,1,24,'bike'],[193,420,-1,13,'troop']] },
    { title:'CROSSING ROADS', hint:'Opposing units fight when they meet', ai:2.3, nodes:[[73,618,0,27,'bike'],[75,270,0,22,'car'],[315,262,1,26,'bike'],[315,608,1,27,'car'],[191,443,-1,18,'tank'],[194,224,-1,13,'troop']] },
    { title:'ARMORED RIVAL', hint:'Use fast units to take empty ground', ai:3.2, nodes:[[70,589,0,45,'car'],[81,305,0,30,'bike'],[309,252,1,16,'tank'],[310,573,1,16,'troop'],[183,423,-1,10,'bike'],[219,595,-1,8,'troop']] },
    { title:'SURROUND THEM', hint:'Attack from several towers', ai:2.2, nodes:[[66,617,0,29,'troop'],[77,342,0,26,'tank'],[306,239,1,30,'car'],[308,610,1,27,'bike'],[194,415,-1,17,'car'],[194,235,-1,13,'bike'],[188,626,-1,12,'troop']] },
    { title:'VEHICLE WAR', hint:'Reinforce allied towers when needed', ai:3.3, nodes:[[73,603,0,50,'bike'],[78,275,0,40,'car'],[315,220,1,16,'tank'],[311,600,1,15,'car'],[191,388,-1,10,'tank'],[202,555,-1,9,'bike'],[297,404,-1,9,'troop']] },
    { title:'FINAL OFFENSIVE', hint:'Control the center, then push forward', ai:2.0, nodes:[[70,625,0,38,'tank'],[72,312,0,26,'bike'],[319,224,1,38,'tank'],[319,617,1,35,'car'],[184,421,-1,24,'car'],[191,234,-1,18,'bike'],[200,592,-1,19,'tank'],[302,422,-1,16,'troop']] }
  ];
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  class Game {
    constructor(level=0) { this.load(level); }
    load(level) {
      this.level=Math.max(0,Math.min(LEVELS.length-1,level|0));
      const data=LEVELS[this.level];
      this.towers=data.nodes.map(([x,y,owner,count,type])=>({x,y,owner,count,type,route:-1,growClock:0,sendClock:0,pulse:0}));
      this.units=[]; this.result=0; this.enemyClock=0; this.elapsed=0; this.nextUnitId=1;
      return this;
    }
    connect(from,to) {
      if (this.result || from===to || !this.towers[from] || !this.towers[to] || this.towers[from].owner!==0) return false;
      this.towers[from].route=to; this.towers[from].sendClock=0; return true;
    }
    stop(from) {
      if (!this.towers[from] || this.towers[from].owner!==0) return false;
      this.towers[from].route=-1; return true;
    }
    spawn(source,index,target) {
      const type=TYPES[source.type];
      source.count-=type.cost;
      this.units.push({id:this.nextUnitId++, owner:source.owner, type:source.type,
        x:source.x,y:source.y,sx:source.x,sy:source.y,ex:target.x,ey:target.y,
        target:index,progress:0,hp:type.hp,maxHp:type.hp,hitLock:0});
    }
    chooseEnemyRoutes() {
      for (let i=0;i<this.towers.length;i++) {
        const a=this.towers[i]; if (a.owner!==1 || a.count<TYPES[a.type].cost+2) continue;
        if (a.route>=0 && this.towers[a.route].owner!==1) continue;
        let best=-1,score=Infinity;
        for (let j=0;j<this.towers.length;j++) {
          if (i===j) continue; const b=this.towers[j];
          if (b.owner===1) continue;
          let value=dist(a,b)*0.34+b.count*2.4;
          if (b.owner===0) value-=15;
          if (a.type==='bike') value-=dist(a,b)*0.07;
          if (value<score) { score=value; best=j; }
        }
        if (best>=0) { a.route=best; a.sendClock=0; }
      }
    }
    arrive(u) {
      const t=this.towers[u.target];
      const stats=TYPES[u.type];
      const effective=Math.max(1,Math.ceil(stats.attack*u.hp/u.maxHp));
      if (t.owner===u.owner) { t.count=Math.min(75,t.count+stats.cost); return; }
      t.count-=effective; t.pulse=0.7;
      if (t.count<=0) {
        t.owner=u.owner; t.count=Math.max(1,1-t.count);
        t.route=-1; t.sendClock=0; t.growClock=0;
      }
    }
    update(dt) {
      if (this.result) return this.result;
      dt=Math.max(0,Math.min(dt,0.08)); this.elapsed+=dt;
      for (const t of this.towers) {
        t.pulse=Math.max(0,t.pulse-dt*2);
        if (t.owner<0) continue;
        const type=TYPES[t.type];
        t.growClock+=dt;
        while(t.growClock>=type.growth) {t.growClock-=type.growth;t.count=Math.min(75,t.count+1);}
        if (t.route>=0 && this.towers[t.route] && t.count>=type.cost+1) {
          t.sendClock+=dt;
          if (t.sendClock>=type.spawn) {t.sendClock-=type.spawn;this.spawn(t,t.route,this.towers[t.route]);}
        } else t.sendClock=0;
      }
      this.enemyClock+=dt;
      if(this.enemyClock>=LEVELS[this.level].ai) {this.enemyClock=0;this.chooseEnemyRoutes();}
      for(const u of this.units) {
        const type=TYPES[u.type]; const length=Math.hypot(u.ex-u.sx,u.ey-u.sy);
        u.progress+=type.speed*dt/Math.max(1,length);
        const p=Math.min(1,u.progress);
        u.x=u.sx+(u.ex-u.sx)*p;u.y=u.sy+(u.ey-u.sy)*p;
        u.hitLock=Math.max(0,u.hitLock-dt);
      }
      // One simultaneous exchange per collision. Surviving vehicles keep their remaining armor.
      for(let i=0;i<this.units.length;i++) {
        const a=this.units[i];if(a.hp<=0 || a.hitLock>0 || a.progress>=1)continue;
        for(let j=i+1;j<this.units.length;j++) {
          const b=this.units[j];if(b.hp<=0 || b.hitLock>0 || b.progress>=1 || a.owner===b.owner)continue;
          if (dist(a,b)<=TYPES[a.type].radius+TYPES[b.type].radius) {
            const da=TYPES[a.type].attack,db=TYPES[b.type].attack;
            a.hp-=db;b.hp-=da;a.hitLock=b.hitLock=0.22;break;
          }
        }
      }
      for(let i=this.units.length-1;i>=0;i--) {
        const u=this.units[i];
        if(u.hp<=0) this.units.splice(i,1);
        else if(u.progress>=1){this.arrive(u);this.units.splice(i,1);}
      }
      const blue=this.towers.some(t=>t.owner===0),red=this.towers.some(t=>t.owner===1);
      if(!blue&&!this.units.some(u=>u.owner===0))this.result=-1;
      else if(!red&&!this.units.some(u=>u.owner===1))this.result=1;
      return this.result;
    }
  }
  const api={Game,TYPES,LEVELS};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  root.TowerCore=api;
})(typeof window!=='undefined'?window:globalThis);
