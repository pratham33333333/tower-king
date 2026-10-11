const assert=require('node:assert/strict');
const {Game,TYPES,LEVELS}=require('../app/src/main/assets/core.js');
assert.equal(LEVELS.length,12);
assert.ok(TYPES.bike.speed>TYPES.car.speed && TYPES.car.speed>TYPES.troop.speed && TYPES.troop.speed>TYPES.tank.speed);
assert.ok(TYPES.tank.attack>TYPES.car.attack && TYPES.car.attack>TYPES.bike.attack);
for(const [n,level] of LEVELS.entries()){
  assert.ok(level.nodes.some(x=>x[2]===0),`no blue tower on ${n+1}`);
  assert.ok(level.nodes.some(x=>x[2]===1),`no red tower on ${n+1}`);
  for(const [x,y,owner,count,type] of level.nodes){
    assert.ok(x>40&&x<350&&y>165&&y<660,`tower ${n+1} outside board`);
    assert.ok([-1,0,1].includes(owner) && count>0 && TYPES[type],`bad level ${n+1}`);
  }
}
const game=new Game(0);
assert.equal(game.connect(1,2),false);
assert.equal(game.connect(0,2),true);
for(let i=0;i<400;i++)game.update(.05);
assert.ok(game.towers[2].owner===0,'first level neutral tower can be captured');
const tank=new Game(6);let from=tank.towers.find(t=>t.owner===0&&t.type==='tank');
tank.spawn(from,2,tank.towers[2]);let armor=tank.units[0];
assert.equal(armor.hp,6);assert.equal(from.count,27);
const weak={...armor,id:999,owner:1,type:'bike',hp:1,maxHp:1,hitLock:0};
tank.units.push(weak);tank.update(0);
assert.ok(!tank.units.includes(weak),'bike loses to tank on contact');
assert.equal(armor.hp,5,'tank loses one armor point');
const bikeRush=new Game(2);bikeRush.connect(0,1);for(let i=0;i<1200&&!bikeRush.result;i++)bikeRush.update(.08);assert.equal(bikeRush.result,1,'direct bike rush beats level 3');
const capture=new Game(5);
let neutral=capture.towers.find(t=>t.owner===-1&&t.type==='tank'); neutral.count=4;
capture.arrive({target:capture.towers.indexOf(neutral),type:'tank',owner:0,hp:6,maxHp:6});
assert.equal(neutral.owner,0);
const win=new Game(0);for(const t of win.towers)if(t.owner===1)t.owner=0;assert.equal(win.update(0),1);
const lose=new Game(0);for(const t of lose.towers)if(t.owner===0)t.owner=1;assert.equal(lose.update(0),-1);
console.log('Core checks passed: 12 maps, troop stats, routes, armor, capture, win/loss');
