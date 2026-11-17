const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const geometry = require("../Assets/Scripts/FrameLayout");

function sceneObject() {
  const node = {enabled:true, position:null};
  node.getTransform = () => ({setLocalPosition: value=>{node.position=value;}});
  return node;
}
function button() {
  const object = sceneObject();
  let trigger;
  return {onTriggerUp:{add: callback=>{trigger=callback;}}, press:()=>trigger(), getSceneObject:()=>object};
}
function setup() {
  let start;
  const script = {frames:Array.from({length:3},sceneObject), marks:Array.from({length:3},sceneObject),
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
