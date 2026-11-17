"use strict";
const byId = (id) => document.getElementById(id);
const english = {
  print:"Print guide", title:"Mounting guide", intro:"Centre three pictures on a wall with equal gaps between their edges. All measurements are in centimetres.",
  wall:"Wall measurements", widthWall:"Available width", center:"Shared centre height", gap:"Gap between frames",
  frames:"Frame measurements", frame:"Frame", width:"Width", height:"Height", inset:"Top edge to hanger",
  caption:"Front view. Crosses show hanger positions. The drawing is a reference diagram.",
  marks:"Where to mark the wall", fromLeft:"From the left edge", aboveFloor:"Above the floor", measure:"Transfer the marks",
  one:"Measure the outside of each frame and the distance from the top edge to its central hanger. For picture wire, measure with the wire taut at its support point.",
  two:"Mark the left edge of the wall section you measured. Measure the horizontal position of every cross from that same origin. Measure each height from the floor.",
  three:"Check the three outlines with painter’s tape and a tape measure. The cross marks where the frame rests on its hook. Check the offset between the hook seat and its screw before drilling.",
  limit:"This guide calculates one centred hanger per frame. Frames with two rings or off-centre hangers need their own measurements."
};
const strings = [...document.querySelectorAll("[data-t]")];
const spanish = Object.fromEntries(strings.map(el=>[el.dataset.t,el.textContent]));
const letters = ["A","B","C"];
const presets = [[30,40,4],[40,30,3],[24,36,5]];
let lang = "es";
const cells = [];
for (const [i,letter] of letters.entries()) {
  const row = byId("inputs").insertRow();
  row.insertCell().textContent = letter;
  const inputs = [];
  for (const value of presets[i]) {
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.min = "0";
    input.value = String(value);
    row.insertCell().appendChild(input);
    inputs.push(input);
  }
  cells.push(inputs);
}
function draw(marks,wall) {
  const svg = byId("diagram");
  svg.replaceChildren();
  function shape(tag,attributes,text) {
    const el = document.createElementNS("http://www.w3.org/2000/svg",tag);
    for (const [key,value] of Object.entries(attributes)) el.setAttribute(key,value);
    if (text) el.textContent = text;
    svg.appendChild(el);
  }
  const tallest = Math.max(...marks.map(m=>m.height));
  const scale = Math.min(560 / wall, 118 / tallest);
  const origin = (600-wall*scale)/2;
  const mid = 80;
  shape("line",{x1:origin,y1:mid,x2:600-origin,y2:mid,stroke:"#81957c","stroke-dasharray":"5 5"});
  for (const [i,m] of marks.entries()) {
    const x = origin + m.left*scale;
    const y = mid - m.height*scale/2;
    const cx = origin + m.x*scale;
    const cy = y+(m.top-m.y)*scale;
    shape("rect",{x,y,width:m.width*scale,height:m.height*scale,fill:"#f9f8ee",stroke:"#35523b","stroke-width":2});
    shape("path",{d:"M"+(cx-4)+" "+cy+"h8 M"+cx+" "+(cy-4)+"v8",stroke:"#a1401b","stroke-width":2,fill:"none"});
    shape("text",{x:cx,y:mid+m.height*scale/2+19,"text-anchor":"middle",fill:"#25372a","font-size":14},letters[i]);
  }
}
function render() {
  const words = lang === "es" ? spanish : english;
  const fr = cells.map(([w,h,d],i)=>{
    [w,h,d].forEach((input,j)=>input.setAttribute("aria-label",letters[i]+" · "+words[["width","height","inset"][j]]));
    return {width:w.valueAsNumber,height:h.valueAsNumber,inset:d.valueAsNumber};
  });
  const wall = byId("wall").valueAsNumber;
  try {
    const marks = WallScore.calculate(wall,byId("center").valueAsNumber,byId("gap").valueAsNumber,fr);
    const tbody = document.querySelector("#marks tbody");
    tbody.replaceChildren();
    const format = new Intl.NumberFormat(lang,{maximumFractionDigits:2});
    for (const [i,m] of marks.entries()) {
      const row = tbody.insertRow();
      for (const v of [letters[i],format.format(m.x)+" cm",format.format(m.y)+" cm"]) row.insertCell().textContent=v;
    }
    draw(marks,wall);
    byId("error").textContent="";
    byId("result").hidden=false;
    byId("print").disabled=false;
  } catch (error) {
    byId("result").hidden=true;
    byId("print").disabled=true;
    byId("error").textContent=lang==="es"?error.message:"Check the wall width, frame dimensions, centre height and hanger positions. The full layout must fit.";
  }
}
function setLanguage(next) {
  lang=next;
  document.documentElement.lang=lang;
  const words=lang==="es"?spanish:english;
  for (const el of strings) el.textContent=words[el.dataset.t];
  document.title="WallScore · "+words.title;
  byId("language").textContent=lang==="es"?"English":"Español";
  render();
}
document.addEventListener("input",render);
byId("language").addEventListener("click",()=>setLanguage(lang==="es"?"en":"es"));
byId("print").addEventListener("click",()=>window.print());
setLanguage(new URLSearchParams(location.search).get("lang")==="en"?"en":"es");
