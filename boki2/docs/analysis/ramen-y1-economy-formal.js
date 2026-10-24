#!/usr/bin/env node
'use strict';
// 正式検査を改変せず起動。--info は失敗時にも正式な数値行を残すため必須。
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const variants=(process.argv[2]||'base,potential,ramp,fixed,combined').split(',');
const dir=path.resolve(process.argv[3]||path.join(__dirname,'ramen-y1-economy-results'));
const root=path.resolve(__dirname,'../../..');
fs.mkdirSync(dir,{recursive:true});
for(const variant of variants){
 if(!require('./ramen-y1-economy-config.js')[variant])throw Error('未知の条件: '+variant);
 const logfile=path.join(dir,'formal-'+variant+'.log'),fd=fs.openSync(logfile,'w');
 const args=['-r',path.join(__dirname,'ramen-y1-economy-load.js'),path.join(root,'boki2/tools/sim-check.js'),'--ramen','--runs','300','--info'];
 fs.writeSync(fd,`# RAMEN_Y1_VARIANT=${variant} node -r ./boki2/docs/analysis/ramen-y1-economy-load.js boki2/tools/sim-check.js --ramen --runs 300 --info\n`);
 const r=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,RAMEN_Y1_VARIANT:variant},stdio:['ignore',fd,fd]});fs.closeSync(fd);
 fs.writeFileSync(path.join(dir,'formal-'+variant+'.exit'),String(r.status)+'\n');
 console.log(variant+' 終了コード '+r.status);if(r.error)throw r.error;
}
