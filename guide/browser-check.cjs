"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const {pathToFileURL} = require("node:url");
const {chromium} = require("playwright");

async function verify() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(),"wallscore-guide-"));
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || undefined});
  try {
    const context = await browser.newContext({offline:true,viewport:{width:390,height:844}});
    const page = await context.newPage();
    const exceptions = [];
    page.on("pageerror",e=>exceptions.push(e.message));
    const count = () => page.locator("#marks tbody tr").count();
    const text = id => page.locator("#"+id).innerText();
    const file = page.locator("#file");
    const open = async (name,buffer) => {
      await file.setInputFiles({name,mimeType:"application/json",buffer});
      await page.waitForFunction(()=>document.querySelector("#file").files.length===0);
    };
    for (const source of ["index.html","WallScore.html"]) {
      await page.goto(pathToFileURL(path.join(__dirname,source)).href);
      assert.equal(await count(),3);
      assert.match(await text("marks"),/123 cm/);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await page.selectOption("#B-type","dual");
    await page.fill("#B-x1","5");
    await page.fill("#B-x2","35");
    await page.fill("#B-d2","4");
    await page.selectOption("#C-type","single");
    await page.fill("#C-x1","8");
    assert.equal(await count(),4);
    assert.equal(await page.locator("#diagram path").count(),4);
    assert.match(await text("marks"),/138 cm\s+161 cm/);
    assert.match(await text("marks"),/159 cm\s+163 cm/);
    await page.click("#language");
    assert.equal(await page.locator("html").getAttribute("lang"),"en");
    await page.fill("#B-x2","5");
    assert.equal(await page.isDisabled("#print"),true);
    assert.equal(await count(),0);
    assert.match(await text("error"),/Frame B.*right/);
    await page.fill("#B-x2","35");
    await page.fill("#ceiling","169");
    assert.equal(await page.isDisabled("#save"),true);
    assert.match(await text("error"),/Frame A.*height/);
    await page.fill("#ceiling","170");
    const [download] = await Promise.all([page.waitForEvent("download"),page.click("#save")]);
    const buffer = await fs.readFile(await download.path());
    const model = JSON.parse(buffer);
    assert.deepEqual(model.frames[1].hooks,[{fromLeft:5,inset:3},{fromLeft:35,inset:4}]);
    const before = await text("marks");
    await page.fill("#wall","300");
    await open("saved.json",buffer);
    assert.equal(await page.inputValue("#wall"),"240");
    assert.equal(await text("marks"),before);
    for (const bad of ["{",JSON.stringify({...model,version:9}),JSON.stringify({...model,wall:1})]) {
      await open("broken.json",Buffer.from(bad));
      assert.match(await text("fileMessage"),/Could not/);
      assert.equal(await text("marks"),before);
    }
    await open("large.json",Buffer.alloc(65537));
    assert.match(await text("fileMessage"),/too large/);
    for (const letter of ["A","C"]) await page.selectOption("#"+letter+"-type","dual");
    assert.equal(await count(),6);
    const pdfDir = process.env.WALLSCORE_PDF_DIR || directory;
    await page.pdf({path:path.join(directory,"six-supports.pdf"),preferCSSPageSize:true});
    for (const lang of ["es","en"]) {
      await page.goto(pathToFileURL(path.join(__dirname,"WallScore.html")).href+"?lang="+lang);
      await page.pdf({path:path.join(pdfDir,"WallScore-"+lang.toUpperCase()+".pdf"),preferCSSPageSize:true});
    }
    if (process.env.WALLSCORE_NATIVE_HTML) {
      await page.goto(pathToFileURL(process.env.WALLSCORE_NATIVE_HTML).href);
      assert.equal(await page.inputValue("#wall"),"260.5");
      assert.match(await text("marks"),/90,25 cm/);
    }
    assert.deepEqual(exceptions,[]);
    console.log("Offline guide, mobile width, bilingual labels, errors, save/open, print and portable file passed.",directory);
  } finally {await browser.close();}
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
