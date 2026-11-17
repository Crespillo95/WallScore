"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname,"..");
const html = fs.readFileSync(path.join(root,"guide/index.html"),"utf8");
const portable = html.replace(/<script src="([^"]+)"><\/script>/g,(_,source)=>{
  const script = fs.readFileSync(path.resolve(root,"guide",source),"utf8").replace(/^\uFEFF/,"");
  return "<script>\n"+script.replace(/<\/script/gi,"<\\/script")+"\n</script>";
});
fs.writeFileSync(process.argv[2] || path.join(root,"guide/WallScore.html"),portable,"utf8");
