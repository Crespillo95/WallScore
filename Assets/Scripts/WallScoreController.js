// Attach to the wall anchor. Frame roots and mark roots are siblings in its coordinate space.
// @input SceneObject[] frames
// @input SceneObject[] marks
// @input Component.ScriptComponent[] markButtons
// @input Component.ScriptComponent gapButton
// @input Component.ScriptComponent modeButton
// @input Component.Text modeCaption
// @input Component.Text readout
// @input SceneObject centerLine
// @input Asset.Material brightOutline
// @input Asset.Material dimOutline
// @input Component.RenderMeshVisual[] outlines
// @input bool mixedHardware = false
// @input string planJson = ""

const layout = require("./FrameLayout");
const anchorHeight = 150;
let wallWidth = 240;
let centerHeight = anchorHeight;
const gaps = [8,12,4];
const frames = [
  {width:30,height:40,inset:4}, {width:40,height:30,inset:3}, {width:24,height:36,inset:5}
];
const labels = ["A","B","C"];
let gapIndex = 0;
let showMarks = false;
let selected = 1;
let activeHooks = [0,0,0];
let positions;
let savedPlan;
let markerScales;

function displayNumber(value) {
  return String(Number(value.toFixed(3)));
}

function loadSavedPlan(text) {
  const plan = JSON.parse(text);
  if (!plan || plan.version !== 1) throw new Error("Unsupported plan version.");
  positions = layout.calculate(plan.wall,plan.center,plan.gap,plan.frames,plan.ceiling);
  savedPlan = plan;
  wallWidth = plan.wall;
  centerHeight = plan.center;
}

function resizeSavedPlan() {
  positions.forEach((frame,i)=>{
    const transform = script.frames[i].getTransform();
    const scale = transform.getLocalScale();
    transform.setLocalScale(new vec3(scale.x*frame.width/frames[i].width,scale.y*frame.height/frames[i].height,scale.z));
  });
  const line = script.centerLine.getTransform();
  const position = line.getLocalPosition();
  line.setLocalPosition(new vec3(position.x,position.y+centerHeight-anchorHeight,position.z));
  const scale = line.getLocalScale();
  line.setLocalScale(new vec3(scale.x*wallWidth/240,scale.y,scale.z));
}

function showPlanError(error) {
  script.frames.forEach(object=>{object.enabled=false;});
  script.marks.forEach(object=>{object.enabled=false;});
  script.centerLine.enabled = false;
  script.gapButton.getSceneObject().enabled = false;
  script.modeButton.getSceneObject().enabled = false;
  const detail = error.frame == null ? "" : " (frame "+labels[error.frame]+")";
  script.readout.text = "Check the saved plan"+detail+" in WallScore.";
}

function calculatePositions() {
  let hardware = frames;
  if (script.mixedHardware) {
    hardware = [
      frames[0],
      {width:40,height:30,hooks:[{fromLeft:5,inset:3},{fromLeft:35,inset:4}]},
      {width:24,height:36,hooks:[{fromLeft:8,inset:5}]}
    ];
  }
  positions = layout.calculate(wallWidth,centerHeight,gaps[gapIndex],hardware);
}

function render() {
  positions.forEach((mark,i)=>{
    // The anchor is the midpoint of the measured wall, 150 cm above its floor datum.
    const hook = mark.hooks[activeHooks[i]];
    script.frames[i].getTransform().setLocalPosition(new vec3(mark.centerX-wallWidth/2,centerHeight-anchorHeight,0));
    const marker = script.marks[i].getTransform();
    marker.setLocalPosition(new vec3(hook.x-wallWidth/2,hook.y-anchorHeight,0.5));
    const scale = markerScales[i];
    const emphasis = showMarks && i === selected ? 1.25 : 1;
    marker.setLocalScale(new vec3(scale.x*emphasis,scale.y*emphasis,scale.z));
    script.marks[i].enabled = showMarks;
    script.outlines[i].mainMaterial = showMarks ? script.dimOutline : script.brightOutline;
  });
  script.centerLine.enabled = !showMarks;
  script.gapButton.getSceneObject().enabled = !showMarks && !savedPlan;
  script.modeCaption.text = showMarks ? (savedPlan ? "View frames" : "Edit layout") : "Show marks";
  const hooks = positions[selected].hooks;
  const m = hooks[activeHooks[selected]];
  const label = labels[selected] + (hooks.length > 1 ? (activeHooks[selected]+1)+"/"+hooks.length : "");
  script.readout.text = showMarks
    ? label+"   "+displayNumber(m.x)+" cm from left  ·  "+displayNumber(m.y)+" cm above floor" + (hooks.length > 1 ? "\nPinch mark for next hook" : "")
    : savedPlan ? "Saved plan · Gap "+displayNumber(savedPlan.gap)+" cm" : "Gap   "+gaps[gapIndex]+" cm";
}

script.createEvent("OnStartEvent").bind(()=>{
  if ([script.frames,script.marks,script.markButtons,script.outlines].some(list=>!list || list.length!==3)) {
    throw new Error("WallScore needs three frames, marks, marker buttons and outline visuals, ordered A, B, C.");
  }
  if (script.planJson && script.planJson.trim()) {
    try {loadSavedPlan(script.planJson);}
    catch (error) {showPlanError(error);return;}
    resizeSavedPlan();
  } else {
    calculatePositions();
  }
  markerScales = script.marks.map(mark=>mark.getTransform().getLocalScale());
  script.gapButton.onTriggerUp.add(()=>{
    if (showMarks || savedPlan) return;
    gapIndex = (gapIndex+1)%gaps.length;
    calculatePositions();
    render();
  });
  script.modeButton.onTriggerUp.add(()=>{
    showMarks = !showMarks;
    selected = 1;
    activeHooks = [0,0,0];
    render();
  });
  script.markButtons.forEach((button,i)=>button.onTriggerUp.add(()=>{
    if (!showMarks) return;
    if (selected === i) activeHooks[i] = (activeHooks[i]+1) % positions[i].hooks.length;
    selected = i;
    render();
  }));
  render();
});
