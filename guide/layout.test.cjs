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
