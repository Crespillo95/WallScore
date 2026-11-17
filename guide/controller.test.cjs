const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const geometry = require("../Assets/Scripts/FrameLayout");

function sceneObject() {
  const node = {enabled:true, position:{x:0,y:0,z:0}, scale:{x:1,y:1,z:1}};
  node.getTransform = () => ({setLocalPosition: value=>{node.position=value;},getLocalPosition:()=>node.position,
    setLocalScale:value=>{node.scale=value;},getLocalScale:()=>node.scale});
  return node;
}
function button() {
  const object = sceneObject();
  let trigger;
  return {onTriggerUp:{add: callback=>{trigger=callback;}}, press:()=>trigger(), getSceneObject:()=>object};
}
function setup(mixedHardware=false,planJson="") {
  let start;
  const script = {mixedHardware, planJson, frames:Array.from({length:3},sceneObject), marks:Array.from({length:3},sceneObject),
    markButtons:Array.from({length:3},button),outlines:[{},{},{}], gapButton:button(),modeButton:button(),
    readout:{}, modeCaption:{}, centerLine:sceneObject(), brightOutline:"bright",dimOutline:"dim",
    createEvent:name=>{assert.equal(name,"OnStartEvent");return {bind:callback=>{start=callback;}};}};
  const file=path.join(__dirname,"../Assets/Scripts/WallScoreController.js");
  class Vec3 {constructor(x,y,z){Object.assign(this,{x,y,z});}}
  vm.runInNewContext(fs.readFileSync(file,"utf8"),{script,vec3:Vec3,require:(name)=>{
    assert.equal(name,"./FrameLayout"); return geometry;
  }});
  start();
  return script;
}
test("Lens controller cycles spacing, locks marks and preserves the layout on return",()=>{
  const s=setup();
  assert.equal(s.readout.text,"Gap   8 cm");
  assert.ok(s.marks.every(m=>!m.enabled));
  for (const [gap,x] of [[12,[-44,3,47]],[4,[-36,3,39]],[8,[-40,3,43]]]) {
    s.gapButton.press();
    assert.deepEqual(s.frames.map(m=>m.position.x),x);
    assert.match(s.readout.text,new RegExp(gap+" cm$"));
  }
  s.modeButton.press();
  assert.ok(s.marks.every(m=>m.enabled));
  assert.ok(s.outlines.every(m=>m.mainMaterial==="dim"));
  assert.equal(s.gapButton.getSceneObject().enabled,false);
  s.gapButton.press();
  assert.match(s.readout.text,/B.*123 cm.*162 cm/);
  for (const [i,position] of [[0,[80,166]],[1,[123,162]],[2,[163,163]]]) {
    s.markButtons[i].press();
    assert.deepEqual([s.marks[i].position.x+120,s.marks[i].position.y+150],position);
    assert.ok(s.readout.text.includes(position[0]+" cm from left"));
  }
  s.modeButton.press();
  assert.equal(s.readout.text,"Gap   8 cm");
  assert.ok(s.marks.every(m=>!m.enabled));
  assert.ok(s.outlines.every(m=>m.mainMaterial==="bright"));
});

test("independent hanger locations, cycling and reset on a mixed-hardware wall",()=>{
  const s=setup(true);
  s.markButtons[1].press();
  s.modeButton.press();
  assert.match(s.readout.text,/B1\/2.*108 cm.*162 cm/);
  assert.equal(s.marks[1].scale.x,1.25);
  s.markButtons[1].press();
  assert.match(s.readout.text,/B2\/2.*138 cm.*161 cm/);
  assert.equal(s.frames[1].position.x,3);
  assert.equal(s.marks[1].position.x,18);
  s.markButtons[2].press();
  assert.equal(s.marks[1].scale.x,1);
  assert.equal(s.marks[2].scale.x,1.25);
  assert.match(s.readout.text,/C.*159 cm.*163 cm/);
  assert.equal(s.frames[2].position.x,43);
  s.markButtons[1].press();
  s.markButtons[1].press();
  assert.match(s.readout.text,/B1\/2/);
  s.markButtons[1].press();
  s.modeButton.press();
  s.gapButton.press();
  s.modeButton.press();
  assert.match(s.readout.text,/B1\/2.*108 cm/);
});

test("a saved companion plan resizes the outlines and uses the measured wall datum",()=>{
  const plan={version:1,wall:300,center:160,gap:5.5,ceiling:210,
    frames:[{width:60,height:80,inset:5},{width:50,height:35,hooks:[{fromLeft:8,inset:4},{fromLeft:42,inset:6}]},{width:20,height:32,inset:3}]};
  const s=setup(true,JSON.stringify(plan));
  assert.equal(s.readout.text,"Saved plan · Gap 5.5 cm");
  assert.equal(s.gapButton.getSceneObject().enabled,false);
  assert.deepEqual([s.frames[0].scale.x,s.frames[0].scale.y],[2,2]);
  assert.equal(s.frames[0].position.y,10);
  assert.equal(s.centerLine.position.y,10);
  assert.equal(s.centerLine.scale.x,1.25);
  s.gapButton.press();
  s.modeButton.press();
  const marks=geometry.calculate(plan.wall,plan.center,plan.gap,plan.frames,plan.ceiling);
  for(const [idx,hook] of marks[1].hooks.entries()){
    if(idx) s.markButtons[1].press();
    assert.deepEqual([s.marks[1].position.x+150,s.marks[1].position.y+150],[hook.x,hook.y]);
  }
  s.modeButton.press();
  assert.equal(s.readout.text,"Saved plan · Gap 5.5 cm");
  assert.equal(s.frames[0].scale.x,2);
});

test("an invalid imported plan suppresses every mark and demo control",()=>{
  for(const json of ["broken",'{"version":2}',JSON.stringify({version:1,wall:1,center:1,gap:0,frames:[]})]){
    const s=setup(false,json);
    assert.ok([...s.frames,...s.marks,s.centerLine,s.modeButton.getSceneObject(),s.gapButton.getSceneObject()].every(o=>!o.enabled));
    assert.match(s.readout.text,/Check the saved plan/);
  }
});
