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

const layout = require("./FrameLayout");
const wallWidth = 240;
const centerHeight = 150;
const gaps = [8,12,4];
const frames = [
  {width:30,height:40,inset:4}, {width:40,height:30,inset:3}, {width:24,height:36,inset:5}
];
const labels = ["A","B","C"];
let gapIndex = 0;
let showMarks = false;
let selected = 1;

function render() {
  const marks = layout.calculate(wallWidth,centerHeight,gaps[gapIndex],frames);
  marks.forEach((mark,i)=>{
    // The anchor origin corresponds to (120, 150) on the wall.
    const x = mark.x - wallWidth/2;
    script.frames[i].getTransform().setLocalPosition(new vec3(x,0,0));
    script.marks[i].getTransform().setLocalPosition(new vec3(x,mark.y-centerHeight,0.5));
    script.marks[i].enabled = showMarks;
    script.outlines[i].mainMaterial = showMarks ? script.dimOutline : script.brightOutline;
  });
  script.centerLine.enabled = !showMarks;
  script.gapButton.getSceneObject().enabled = !showMarks;
  script.modeCaption.text = showMarks ? "Edit layout" : "Show marks";
  const m = marks[selected];
  script.readout.text = showMarks
    ? labels[selected]+"   "+m.x+" cm from left  ·  "+m.y+" cm above floor"
    : "Gap   "+gaps[gapIndex]+" cm";
}

script.createEvent("OnStartEvent").bind(()=>{
  if ([script.frames,script.marks,script.markButtons,script.outlines].some(list=>!list || list.length!==3)) {
    throw new Error("WallScore needs three frames, marks, marker buttons and outline visuals, ordered A, B, C.");
  }
  script.gapButton.onTriggerUp.add(()=>{
    if (showMarks) return;
    gapIndex = (gapIndex+1)%gaps.length;
    render();
  });
  script.modeButton.onTriggerUp.add(()=>{
    showMarks = !showMarks;
    selected = 1;
    render();
  });
  script.markButtons.forEach((button,i)=>button.onTriggerUp.add(()=>{
    if (!showMarks) return;
    selected = i;
    render();
  }));
  render();
});
