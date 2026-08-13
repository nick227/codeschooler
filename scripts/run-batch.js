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
const generatorCmd = args.generatorCmd
const batchMeta = args.meta ? JSON.parse(args.meta) : { batchId: `batch-${Date.now()}`, model: 'gen-ai-x', promptVersion: 'dev' }

// 1) request next batch
console.log('Requesting next batch...')
const batchRequestJson = execSync('pnpm batch:next', { encoding: 'utf8' })
let batchRequest
try{ batchRequest = JSON.parse(batchRequestJson) }catch(e){ console.error('Failed to parse batch request:', e); process.exit(1) }
if(!batchRequest.nextBatchRequest && batchRequest.status === 'ALL_TARGETS_SATISFIED'){
  console.log('No next batch to generate.'); process.exit(0)
}

const target = batchRequest.nextBatchRequest || batchRequest.target || batchRequest
batchMeta.batchId = batchMeta.batchId || `batch-${Date.now()}`

// 2) run generator if provided
const genOutDir = path.join(process.cwd(), 'content', 'generated', batchMeta.batchId)
if(!fs.existsSync(genOutDir)) fs.mkdirSync(genOutDir, { recursive: true })
if(generatorCmd){
  console.log('Running generator command...')
  // pass output dir and batch meta as env
  execSync(`${generatorCmd} --out=${genOutDir}`, { stdio: 'inherit', env: { ...process.env, BATCH_META: JSON.stringify(batchMeta) } })
} else {
  console.log('No generatorCmd provided; assuming generated content already present in', genOutDir)
}

// 3) run ingest hook against generated dir
console.log('Running ingest hook...')
execSync(`node scripts/ingest-hook.js --dir=${genOutDir} --meta='${JSON.stringify(batchMeta)}'`, { stdio: 'inherit' })

// 4) print summary
const summaryPath = path.join(process.cwd(),'data','ingest-rejections', `${batchMeta.batchId}.summary.json`)
if(fs.existsSync(summaryPath)){
  console.log('Batch summary:')
  console.log(fs.readFileSync(summaryPath,'utf8'))
} else {
  console.log('No batch summary found at', summaryPath)
}

console.log('Run complete. Use scripts/reconcile-batch.ts to accept/reject batch at controller level.')
