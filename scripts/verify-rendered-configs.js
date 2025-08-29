#!/usr/bin/env node
/**
 * Rendered Configs Verification
 * Ensures rendered config files only include allowed suffixes.
 */
const fs = require('node:fs');
const path = require('node:path');

function readJSON(p){
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch(e){ console.error('❌ Failed loading', p, e.message); process.exit(1);} }

const root = process.cwd();
const envProtPath = path.join(root,'config','environment-protection.json');
const cloudwatchPath = path.join(root,'config','cloudwatch-monitoring.json');
const envProt = readJSON(envProtPath);
readJSON(cloudwatchPath); // just to ensure valid json

const allowed = new Set(envProt.allowedSuffixes || []);
if(!allowed.size){
  console.error('❌ allowedSuffixes empty in environment-protection.json');
  process.exit(2);
}

const combinedText = fs.readFileSync(envProtPath,'utf8') + '\n' + fs.readFileSync(cloudwatchPath,'utf8');
const pattern = /[A-Za-z0-9]+-([a-z0-9]{8,})-NONE/g;
const foundSuffixes = new Set();
let m; while((m = pattern.exec(combinedText))){ foundSuffixes.add(m[1]); }

const legacyCandidates = [ 'fvn7t5hbobaxjklhrqzdl4ac34', 'yk6ecaswg5aehjn3ev76xzpbfe' ];
const extraneous = [...foundSuffixes].filter(s => !allowed.has(s));
const unexpectedLegacy = legacyCandidates.filter(s => foundSuffixes.has(s) && !allowed.has(s));

let failed = false;
if(extraneous.length){ console.error('❌ Suffixes not in allowedSuffixes:', extraneous); failed = true; }
if(unexpectedLegacy.length){ console.error('❌ Legacy suffixes present but not allowed:', unexpectedLegacy); failed = true; }

if(!failed){ console.log('✅ Rendered config verification passed. Allowed suffixes:', [...allowed].join(', ')); }
process.exit(failed ? 2 : 0);
