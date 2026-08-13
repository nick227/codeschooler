#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function usage(){
  console.error('Usage: node scripts/ingest-validator.js --dir=contentDir --meta=\'{"batchId":"...","model":"...","promptVersion":"..."}\' --out=report.json')
  process.exit(2)
}

function parseArgs(){
  const out = {}
  for(let i=2;i<process.argv.length;i++){
    const a = process.argv[i]
    if(a.startsWith('--')){
      const parts = a.slice(2).split('=')
      out[parts[0]] = parts.slice(1).join('=') || true
    } else if(!out._) { out._ = [a] } else out._.push(a)
  }
  return out
}

const args = parseArgs()
const dir = args.dir || (args._ && args._[0])
const metaRaw = args.meta
const out = args.out || '/tmp/ingest_report.json'
if(!dir || !metaRaw) usage()
let meta
try{ meta = JSON.parse(metaRaw) }catch(e){ console.error('meta must be JSON'); usage() }

function walkYaml(d){
  const out = []
  for(const e of fs.readdirSync(d,{withFileTypes:true})){ const full = path.join(d,e.name)
    if(e.isDirectory()) out.push(...walkYaml(full))
    else if(e.isFile() && full.endsWith('.yaml')) out.push(full)
  }
  return out
}

function loadCanonicalTags(){
  const p = path.join(__dirname,'..','packages','content-schema','src','tags.ts')
  const src = fs.readFileSync(p,'utf8')
  const m = src.match(/new Set<string>\(\[([\s\S]*?)\]\)/m)
  if(!m) return new Set()
  const inside = m[1]
  const tags = []
  inside.split(/[,\n]/).forEach(s=>{
    const t = s.replace(/['\"\s]/g,'').trim()
    if(t) tags.push(t.toLowerCase())
  })
  return new Set(tags)
}

function loadSynonyms(){
  const p = path.join(__dirname,'..','packages','content-schema','src','tag-synonyms.ts')
  const src = fs.readFileSync(p,'utf8')
  const out = {}
  const re = /['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]/g
  let m
  while((m=re.exec(src))){ out[m[1].toLowerCase()] = m[2].toLowerCase() }
  return out
}

function loadSkills(){
  const p = path.join(__dirname,'..','content','skills.yaml')
  const src = fs.readFileSync(p,'utf8')
  const ids = new Set()
  const re = /^\s*-\s*id:\s*(\S+)/gm
  let m
  while((m=re.exec(src))){ ids.add(m[1].trim()) }
  return ids
}

function loadTagToSkill(){
  const p = path.join(__dirname,'..','packages','content-schema','src','tag-to-skill.ts')
  const src = fs.readFileSync(p,'utf8')
  const out = {}
  const re = /['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]/g
  let m
  while((m=re.exec(src))){ out[m[1].toLowerCase()] = m[2] }
  return out
}

function parseTagsFromYaml(src){
  const m = src.match(/^\s*tags:\s*\[(.*)\]/m)
  if(!m) return []
  const items = m[1].split(',').map(s=>s.replace(/['\"]/g,'').trim()).filter(Boolean)
  return items
}

function parseSkillsFromYaml(src){
  const m = src.match(/^\s*skills:\s*\[(.*)\]/m)
  if(!m) return []
  return m[1].split(',').map(s=>s.replace(/['\"]/g,'').trim()).filter(Boolean)
}

const canonical = loadCanonicalTags()
const synonyms = loadSynonyms()
const skills = loadSkills()
const tagToSkill = loadTagToSkill()

const files = walkYaml(path.resolve(dir))
const report = {
  batch: meta,
  summary: { total: files.length, accepted:0, rejected:0 },
  items: []
}

for(const f of files){
  const src = fs.readFileSync(f,'utf8')
  const idMatch = src.match(/^\s*id:\s*(\S+)/m)
  const itemId = idMatch ? idMatch[1] : path.relative(process.cwd(), f)
  const tags = parseTagsFromYaml(src).map(t=>t.toLowerCase())
  const skillsList = parseSkillsFromYaml(src)
  const normalized = []
  const unknownTags = []
  for(const t of tags){
    const c = synonyms[t] || t
    normalized.push(c)
    if(!canonical.has(c)){
      const mappedSkill = tagToSkill[c]
      if(mappedSkill && skills.has(mappedSkill)){
        // treat as resolved to a skill (acceptable)
        // record mapping for traceability
        // don't add to unknownTags
      } else {
        unknownTags.push({original:t, canonical:c})
      }
    }
  }
  const invalidSkills = []
  for(const s of skillsList){ if(!skills.has(s)) invalidSkills.push(s) }

  const reasons = []
  if(unknownTags.length) reasons.push({code:'unknown_tags', detail:unknownTags})
  if(invalidSkills.length) reasons.push({code:'invalid_skills', detail:invalidSkills})

  const accepted = reasons.length === 0
  if(accepted) report.summary.accepted++
  else report.summary.rejected++

  report.items.push({ itemId, path: f, tags, normalized, invalidSkills, unknownTags, accepted, reasons })
}

fs.writeFileSync(path.resolve(out), JSON.stringify(report,null,2), 'utf8')
console.log('Wrote report to', out)
