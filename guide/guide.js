"use strict";
const byId = id => document.getElementById(id);
const es = {
  frame:"Cuadro", width:"Ancho", height:"Alto", type:"Tipo de enganche", central:"Centrado",
  single:"Descentrado", dual:"Dos apoyos", offset:"Desde la izquierda", inset:"Desde arriba",
  support:"Apoyo", margin:"Margen a cada lado", span:"Ancho del conjunto", room:"Pared",
  loaded:"Plano abierto.", badFile:"No se ha podido abrir el plano. Elige un archivo JSON guardado con WallScore.",
  tooLarge:"El archivo supera el tamaño de un plano de WallScore."
};
const en = {
  print:"Print plan",title:"Mounting guide",intro:"Centre three pictures with equal gaps and locate each support. Enter measurements in centimetres.",
  wall:"Wall",wallWidth:"Available width",center:"Centre height",gap:"Gap",ceiling:"Clear height (optional)",
  frames:"Frames and hangers",front:"Measure horizontal offsets from the edge on the left when viewing the picture from the front. When you turn the picture over like a page, that edge is on your right.",
  save:"Save plan",open:"Open plan",marks:"Where to mark the wall",caption:"Front view. Each cross marks a support point. Use the drawing as a reference.",
  point:"Support",fromLeft:"From left wall edge",aboveFloor:"From floor",measure:"Transfer to the wall",
  one:"For picture wire, measure from the top edge to the taut wire at its support point.",
  two:"Mark one origin on the left and use the same level floor reference for every height. Check the outlines and distances with painter’s tape and a tape measure.",
  three:"Each cross locates the point where the picture rests on its hardware. Measure from the hardware seat to its screw before transferring the drill position.",
  frame:"Frame",width:"Width",height:"Height",type:"Hanger type",central:"Centred",single:"Off-centre",dual:"Two supports",
  offset:"From left edge",inset:"From top edge",support:"Support",margin:"Margin on each side",span:"Group width",room:"Wall",
  loaded:"Plan opened.",badFile:"Could not open this plan. Choose a JSON file saved by WallScore.",tooLarge:"This file is too large for a WallScore plan."
};
const errors = {wall:"Check the wall width, heights and gap.",count:"Enter exactly three frames.",
  size:"Enter a positive width and height.",floor:"This frame extends below the floor.",ceiling:"The top of this frame exceeds the available height.",
  hardware:"Enter one or two supports.",hook:"Each support must lie within the frame edges.",order:"The second support must be to the right of the first in the front view.",
  span:"The group is wider than the available wall."};
document.querySelectorAll("[data-t]").forEach(el => {es[el.dataset.t] = el.textContent;});
const letters = ["A","B","C"];
const initial = [[30,40,4],[40,30,3],[24,36,5]];
let lang = "es";
let words = es;
let format = new Intl.NumberFormat(lang,{maximumFractionDigits:3});
let current = null;
let fileStatus = "";

function translated(tag,key) {
  const element = document.createElement(tag);
  element.dataset.t = key;
  return element;
}
function numberField(parent,key,value,id) {
  const label = document.createElement("label");
  label.append(translated("span",key));
  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.id = id;
  input.value = value;
  label.append(input);
  parent.append(label);
  return input;
}
function pair(parent) {
  const row = document.createElement("div");
  row.className = "pair";
  parent.append(row);
  return row;
}
function makeCard(letter,i) {
  const card = document.createElement("fieldset");
  card.className = "card";
  const legend = document.createElement("legend");
  legend.append(translated("span","frame")," "+letter);
  card.append(legend);
  const dimensions = pair(card);
  const [w,h,d] = initial[i];
  const width = numberField(dimensions,"width",w,letter+"-width");
  const height = numberField(dimensions,"height",h,letter+"-height");
  const label = document.createElement("label");
  label.append(translated("span","type"));
  const mode = document.createElement("select");
  mode.id = letter+"-type";
  for (const name of ["central","single","dual"]) {
    const option = translated("option",name);
    option.value = name;
    mode.append(option);
  }
  label.append(mode);
  card.append(label);
  const supports = [1,2].map(n => {
    const group = document.createElement("div");
    group.className = "hardware";
    const title = document.createElement("b");
    title.append(translated("span","support")," "+n);
    group.append(title);
    const row = pair(group);
    const x = numberField(row,"offset",n===1 ? w/4 : w*3/4,letter+"-x"+n);
    const dInput = numberField(row,"inset",d,letter+"-d"+n);
    card.append(group);
    return {group,title,x,d:dInput};
  });
  byId("inputs").append(card);
  return {width,height,mode,supports};
}
const cards = letters.map(makeCard);

function readPlan() {
  const frames = cards.map(({width,height,mode,supports}) => {
    const frame = {width:width.valueAsNumber,height:height.valueAsNumber};
    const dual = mode.value === "dual";
    supports[0].title.hidden = !dual;
    supports[0].x.parentElement.hidden = mode.value === "central";
    supports[1].group.hidden = !dual;
    if (mode.value === "central") frame.inset = supports[0].d.valueAsNumber;
    else frame.hooks = supports.slice(0,dual ? 2 : 1).map(({x,d}) => ({fromLeft:x.valueAsNumber,inset:d.valueAsNumber}));
    return frame;
  });
  const ceiling = byId("ceiling");
  return {version:1,wall:byId("wall").valueAsNumber,center:byId("center").valueAsNumber,gap:byId("gap").valueAsNumber,
    ceiling:ceiling.value === "" && !ceiling.validity.badInput ? null : ceiling.valueAsNumber,frames};
}
function calculate(plan) {
  return WallScore.calculate(plan.wall,plan.center,plan.gap,plan.frames,plan.ceiling);
}
function draw(marks,wall) {
  const svg = byId("diagram");
  svg.replaceChildren();
  function shape(tag,attributes,label) {
    const el = document.createElementNS("http://www.w3.org/2000/svg",tag);
    Object.entries(attributes).forEach(([key,value]) => el.setAttribute(key,value));
    if (label) el.textContent = label;
    svg.append(el);
  }
  const scale = Math.min(560/wall,110/Math.max(...marks.map(m=>m.height)),Number.MAX_VALUE);
  const origin = (600-wall*scale)/2;
  const mid = 80;
  shape("line",{x1:origin,y1:mid,x2:600-origin,y2:mid,stroke:"#81957c","stroke-dasharray":"5 5"});
  for (const [i,m] of marks.entries()) {
    const x = origin+m.left*scale;
    const y = mid-m.height*scale/2;
    shape("rect",{x,y,width:m.width*scale,height:m.height*scale,fill:"#fbfaf3",stroke:"#35523b","stroke-width":2});
    for (const hook of m.hooks) {
      const cx = origin+hook.x*scale;
      const cy = y+(m.top-hook.y)*scale;
      shape("path",{d:"M"+(cx-4)+" "+cy+"h8 M"+cx+" "+(cy-4)+"v8",stroke:"#a1401b","stroke-width":2});
    }
    shape("text",{x:origin+m.centerX*scale,y:mid+m.height*scale/2+19,"text-anchor":"middle",fill:"#25372a"},letters[i]);
  }
}
const cm = v => format.format(v)+" cm";
function render() {
  const plan = readPlan();
  const tbody = document.querySelector("#marks tbody");
  tbody.replaceChildren();
  try {
    const marks = calculate(plan);
    for (const [i,m] of marks.entries()) {
      m.hooks.forEach((hook,j) => {
        const row = tbody.insertRow();
        const label = letters[i]+(m.hooks.length>1 ? " · "+(j+1) : "");
        for (const v of [label,cm(hook.x),cm(hook.y)]) row.insertCell().textContent = v;
      });
    }
    draw(marks,plan.wall);
    byId("summary").textContent = [words.room+" "+cm(plan.wall),words.center+" "+cm(plan.center),words.gap+" "+cm(plan.gap),
      words.span+" "+cm(plan.frames.reduce((sum,f)=>sum+f.width,2*plan.gap)),words.margin+" "+cm(marks[0].left)].join("  ·  ");
    if (plan.ceiling != null) byId("summary").textContent += "  ·  "+words.ceiling.replace(/\s*\(.*\)/,"")+" "+cm(plan.ceiling);
    byId("dimensions").textContent = marks.map((m,i)=>letters[i]+"  "+format.format(m.width)+" × "+cm(m.height)).join("  ·  ");
    byId("error").textContent = "";
    current = plan;
  } catch (error) {
    const frame = error.frame == null ? "" : words.frame+" "+letters[error.frame]+" · ";
    byId("error").textContent = frame+(lang === "es" ? error.message : errors[error.code] || errors.wall);
    current = null;
    byId("diagram").replaceChildren();
  }
  byId("result").hidden = !current;
  byId("print").disabled = byId("save").disabled = !current;
  byId("fileMessage").textContent = words[fileStatus] || "";
}
function setLanguage(next) {
  lang = next;
  words = lang === "es" ? es : en;
  format = new Intl.NumberFormat(lang,{maximumFractionDigits:3});
  document.documentElement.lang = lang;
  document.title = "WallScore · "+words.title;
  document.querySelectorAll("[data-t]").forEach(el=>{el.textContent = words[el.dataset.t];});
  byId("language").textContent = lang === "es" ? "English" : "Español";
  render();
}
function loadPlan(plan) {
  if (!plan || plan.version !== 1) throw new Error("version");
  calculate(plan);
  for (const key of ["wall","center","gap","ceiling"]) byId(key).value = plan[key] == null ? "" : plan[key];
  plan.frames.forEach((f,i) => {
    const card = cards[i];
    card.width.value = f.width;
    card.height.value = f.height;
    card.mode.value = !f.hooks ? "central" : f.hooks.length === 2 ? "dual" : "single";
    card.supports.forEach(({x,d},j) => {
      const hook = f.hooks && f.hooks[j];
      x.value = hook ? hook.fromLeft : f.width*(j===0 ? 0.25 : 0.75);
      d.value = hook ? hook.inset : f.hooks ? f.hooks[0].inset : f.inset;
    });
  });
  render();
}
document.addEventListener("input",e=>{if (e.target.id !== "file") {fileStatus = ""; render();}});
byId("language").addEventListener("click",()=>setLanguage(lang==="es" ? "en" : "es"));
byId("print").addEventListener("click",()=>{if (current) window.print();});
byId("save").addEventListener("click",()=>{
  if (!current) return;
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:"application/json"}));
  link.href = url;
  link.download = "WallScore.json";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
byId("open").addEventListener("click",()=>byId("file").click());
byId("file").addEventListener("change",async e=>{
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 65536) fileStatus = "tooLarge";
    else {
      loadPlan(JSON.parse(await file.text()));
      fileStatus = "loaded";
    }
  } catch {fileStatus = "badFile";}
  e.target.value = "";
  byId("fileMessage").textContent = words[fileStatus];
});
setLanguage(new URLSearchParams(location.search).get("lang")==="en" ? "en" : "es");
if (location.hash.startsWith("#plan=")) {
  try {loadPlan(JSON.parse(decodeURIComponent(location.hash.slice(6))));}
  catch {fileStatus = "badFile"; render();}
}
