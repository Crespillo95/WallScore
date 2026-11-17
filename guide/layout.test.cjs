const assert = require("node:assert/strict");
const test = require("node:test");
const {calculate} = require("../Assets/Scripts/FrameLayout");
const frames = [{width:30,height:40,inset:4},{width:40,height:30,inset:3},{width:24,height:36,inset:5}];

test("three unequal frames yield the expected mounting points", () => {
  const marks = calculate(240,150,8,frames);
  assert.deepEqual(marks.map(({x,y})=>[x,y]), [[80,166],[123,162],[163,163]]);
});

test("centering, gap and visual height hold across every native preset", () => {
  for (const gap of [4,8,12]) {
    const marks = calculate(240,150,gap,frames);
    assert.equal(marks[0].left, 240 - marks[2].left - marks[2].width);
    for (const mark of marks) assert.equal(mark.top - mark.height/2,150);
    for (const i of [1,2]) assert.equal(marks[i].left - marks[i-1].left - marks[i-1].width,gap);
  }
});

test("exact fits, zero gap and edge hangers are valid", () => {
  assert.equal(calculate(94,20,0,frames)[0].left,0);
  assert.equal(calculate(94,20,0,frames.map(f=>({...f,inset:f.height})))[0].y,0);
});

test("invalid geometry cannot produce marks", () => {
  for (const args of [[109,150,8,frames],[240,15,8,frames],[240,150,-1,frames],
    [240,150,8,[]],[NaN,150,8,frames],[240,150,8,[{...frames[0],inset:41},...frames.slice(1)]]]) {
    assert.throws(()=>calculate(...args),RangeError);
  }
});

test("coordinates use the front left edge and independent vertical offsets",()=>{
  const custom = [frames[0],{width:40,height:30,hooks:[{fromLeft:5,inset:3},{fromLeft:35,inset:4}]},
    {width:24,height:36,hooks:[{fromLeft:8,inset:5}]}];
  const result = calculate(240,150,8,custom,170);
  assert.deepEqual(result[1].hooks,[{x:108,y:162},{x:138,y:161}]);
  assert.equal(result[1].centerX,123);
  assert.equal(result[2].centerX,163);
  assert.deepEqual(result[2].hooks,[{x:159,y:163}]);
});

test("invalid hardware, clear height and overflow return actionable errors",()=>{
  for (const [hooks,code] of [[[],"hardware"],[null,"hardware"],[[null],"hook"],
    [[{fromLeft:-1,inset:0}],"hook"],[[{fromLeft:15,inset:31}],"hook"],
    [[{fromLeft:2,inset:0},{fromLeft:2,inset:1}],"order"],
    [[{fromLeft:3,inset:0},{fromLeft:2,inset:0}],"order"]]) {
    assert.throws(()=>calculate(240,150,8,[frames[0],{...frames[1],hooks},frames[2]]),
      e=>e instanceof RangeError && e.code===code && e.frame===1);
  }
  assert.throws(()=>calculate(240,150,8,frames,169.99),{code:"ceiling",frame:0});
  assert.throws(()=>calculate(240,150,8,frames,NaN),{code:"wall"});
  assert.throws(()=>calculate(240,150,8,[null,...frames.slice(1)]),{code:"size"});
  assert.throws(()=>calculate(Number.MAX_VALUE,150,Number.MAX_VALUE,frames),{code:"span"});
  assert.throws(()=>calculate(240,Number.MAX_VALUE,8,frames.map(f=>({...f,height:Number.MAX_VALUE}))),{code:"ceiling"});
});

test("decimal exact fits and 500 varied layouts preserve margins, spacing and support offsets",()=>{
  const decimals=[0.1,0.2,0.3].map(width=>({width,height:1,inset:0}));
  assert.equal(calculate(0.6,1,0,decimals)[0].left,0);
  assert.throws(()=>calculate(0.59999,1,0,decimals),{code:"span"});
  const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
  for(let i=1;i<=500;i++){
    const gap=(i%17)/7;
    const margin=(i%19)/3;
    const varied=frames.map((_,j)=>{
      const width=7+((i+1)*(j+3)%79)/3;
      const height=11+((i+3)*(j+2)%83)/4;
      return {width,height,hooks:[{fromLeft:width/7,inset:height/6},{fromLeft:width*0.8,inset:height/5}]};
    });
    const wall=varied.reduce((sum,f)=>sum+f.width,2*(gap+margin));
    const marks=calculate(wall,60,gap,varied,100);
    close(marks[0].left,margin);
    close(wall-marks[2].left-marks[2].width,margin);
    marks.forEach((m,j)=>{
      if(j) close(m.left-marks[j-1].left-marks[j-1].width,gap);
      m.hooks.forEach((hook,k)=>{
        close(hook.x-m.left,varied[j].hooks[k].fromLeft);
        close(m.top-hook.y,varied[j].hooks[k].inset);
      });
    });
  }
});
