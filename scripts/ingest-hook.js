#!/usr/bin/env node
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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
const outReport = args.out || `/tmp/ingest_report_${Date.now()}.json`
if(!dir || !metaRaw){
  console.error('Usage: node scripts/ingest-hook.js --dir=content --meta=JSON --out=/tmp/report.json')
  process.exit(2)
}
let meta
try{ meta = JSON.parse(metaRaw) }catch(e){ console.error('meta must be JSON'); process.exit(2) }

// run validator
const validatorCmd = `node scripts/ingest-validator.js --dir=${dir} --meta='${JSON.stringify(meta)}' --out=${outReport}`
console.log('Running validator...')
execSync(validatorCmd, { stdio: 'inherit' })

const report = JSON.parse(fs.readFileSync(outReport,'utf8'))
const batchId = meta.batchId || `batch-${Date.now()}`
const draftsDir = path.join(process.cwd(),'content','drafts',batchId)
const rejectionsDir = path.join(process.cwd(),'data','ingest-rejections')
if(!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true })
if(!fs.existsSync(rejectionsDir)) fs.mkdirSync(rejectionsDir, { recursive: true })

const rejections = []

// build existing content id -> {path, content}
function loadExistingContent() {
  const contentRoot = path.join(process.cwd(), 'content')
  const files = []
  function walk(d){
    for(const e of fs.readdirSync(d, { withFileTypes: true })){ const full = path.join(d, e.name)
      if(e.isDirectory()) walk(full)
      else if(e.isFile() && full.endsWith('.yaml')) files.push(full)
    }
  }
  walk(contentRoot)
  const map = new Map()
  for(const f of files){
    try{
      const src = fs.readFileSync(f,'utf8')
      const m = src.match(/^\s*id:\s*(\S+)/m)
      if(m){ map.set(m[1].trim(), { path: f, src }) }
    }catch(e){ }
  }
  return map
}

const existing = loadExistingContent()

for(const item of report.items){
  if(item.accepted){
    // determine duplicate/revision/new
    const existingEntry = existing.get(item.itemId)
    if(existingEntry){
      // compare srcs
      const newSrc = fs.existsSync(item.path) ? fs.readFileSync(item.path,'utf8') : ''
      if(newSrc.trim() === (existingEntry.src||'').trim()){
        // identical -> treat as rejected_duplicate
        rejections.push({ batchId: report.batch.batchId || batchId, model: report.batch.model || '', promptVersion: report.batch.promptVersion || '', itemId: item.itemId, status: 'rejected_duplicate', reasonCode: 'duplicate', offendingField: 'id', offendingValue: item.itemId, createdAt: new Date().toISOString() })
      } else {
        // new revision -> copy to drafts and note accepted_revision
        try{
          const base = path.basename(item.path)
          fs.copyFileSync(item.path, path.join(draftsDir, base))
          // record a pseudo-rejection entry with accepted_revision status for audit
          rejections.push({ batchId: report.batch.batchId || batchId, model: report.batch.model || '', promptVersion: report.batch.promptVersion || '', itemId: item.itemId, status: 'accepted_revision', reasonCode: 'revision', offendingField: 'id', offendingValue: item.itemId, createdAt: new Date().toISOString() })
        }catch(e){ console.warn('could not copy', item.path, e.message) }
      }
    } else {
      // new item
      try{
        const base = path.basename(item.path)
        fs.copyFileSync(item.path, path.join(draftsDir, base))
        rejections.push({ batchId: report.batch.batchId || batchId, model: report.batch.model || '', promptVersion: report.batch.promptVersion || '', itemId: item.itemId, status: 'accepted_new', reasonCode: 'new', offendingField: 'id', offendingValue: item.itemId, createdAt: new Date().toISOString() })
      }catch(e){ console.warn('could not copy', item.path, e.message) }
    }
  } else {
    // persist rejection entry with required fields
    const reasons = item.reasons || []
    for(const r of reasons){
      const reasonCode = r.code
      const offending = r.detail || []
      // detail may be array of objects; flatten to offendingField/value rows
      if(Array.isArray(offending) && offending.length){
        for(const off of offending){
          rejections.push({
            batchId: report.batch.batchId || batchId,
            model: report.batch.model || '',
            promptVersion: report.batch.promptVersion || '',
            itemId: item.itemId,
            status: 'rejected',
            reasonCode,
            offendingField: off.original || JSON.stringify(off),
            offendingValue: off.canonical || '',
            createdAt: new Date().toISOString()
          })
        }
      } else {
        rejections.push({
          batchId: report.batch.batchId || batchId,
          model: report.batch.model || '',
          promptVersion: report.batch.promptVersion || '',
          itemId: item.itemId,
          status: 'rejected',
          reasonCode,
          offendingField: null,
          offendingValue: JSON.stringify(r.detail || {}),
          createdAt: new Date().toISOString()
        })
      }
    }
  }
}

// write rejections JSON and CSV
const rejJsonPath = path.join(rejectionsDir, `${batchId}.json`)
fs.writeFileSync(rejJsonPath, JSON.stringify(rejections, null, 2), 'utf8')
const csvLines = ['batchId,model,promptVersion,itemId,status,reasonCode,offendingField,offendingValue,createdAt']
for(const r of rejections){
  const esc = (s)=>('"'+String(s||'').replace(/"/g,'""')+'"')
  csvLines.push([r.batchId,r.model,r.promptVersion,r.itemId,r.status,r.reasonCode,r.offendingField,r.offendingValue,r.createdAt].map(esc).join(','))
}
const rejCsvPath = path.join(rejectionsDir, `${batchId}.csv`)
fs.writeFileSync(rejCsvPath, csvLines.join('\n'),'utf8')

// produce batch-level aggregates
const agg = { generated: report.summary.total, accepted: report.summary.accepted, rejected: report.summary.rejected, reasons: {} }
for(const r of rejections){ agg.reasons[r.reasonCode] = (agg.reasons[r.reasonCode]||0)+1 }
const aggPath = path.join(rejectionsDir, `${batchId}.summary.json`)
fs.writeFileSync(aggPath, JSON.stringify(agg,null,2),'utf8')

console.log('Ingest hook completed:')
console.log(' Drafts:', report.summary.accepted, '->', draftsDir)
console.log(' Rejections JSON:', rejJsonPath)
console.log(' Rejections CSV:', rejCsvPath)
console.log(' Batch summary:', aggPath)
