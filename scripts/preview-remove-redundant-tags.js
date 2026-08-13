#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const REMOVALS = new Set(['interview','arrays','functions','strings','loops','conditionals','trees','recursion'])

function walk(dir){
  const out = []
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){ 
    const full = path.join(dir,e.name)
    if(e.isDirectory()) out.push(...walk(full))
    else if(e.isFile() && full.endsWith('.yaml')) out.push(full)
  }
  return out
}

function normalizeToken(tok){
  return tok.replace(/^['\"]|['\"]$/g,'').trim()
}

function preview(){
  const files = walk(CONTENT)
  const changes = []
  for(const f of files){
    const raw = fs.readFileSync(f,'utf8')
    const lines = raw.split(/\n/)
    let modified = false
    const out = []
    for(const line of lines){
      const m = line.match(/^(\s*tags:\s*)\[(.*)\]\s*$/)
      if(!m){ out.push(line); continue }
      const prefix = m[1]
      const inner = m[2]
      const parts = inner.split(',').map(s=>normalizeToken(s))
      const lower = parts.map(p=>p.toLowerCase())
      const keep = []
      for(let i=0;i<lower.length;i++){
        const p = lower[i]
        if(!REMOVALS.has(p)) keep.push(parts[i])
      }
      if(keep.length !== parts.length){
        modified = true
        if(keep.length === 0){
          // mark removal in preview (do not delete file content)
          out.push(line.replace(/^(\s*)tags:\s*\[.*\]\s*$/, '$1# tags removed by preview (would become empty)'))
        } else {
          out.push(`${prefix}[${keep.join(', ')}]`)
        }
      } else {
        out.push(line)
      }
    }
    if(modified){
      changes.push({file:f, before:raw, after: out.join('\n')})
    }
  }
  // print summary and diffs
  if(changes.length===0){
    console.log('No changes would be made.')
    return
  }
  console.log(`Preview: ${changes.length} file(s) would be modified.`)
  for(const c of changes){
    console.log('\n---', c.file)
    const before = c.before.split('\n')
    const after = c.after.split('\n')
    const max = Math.max(before.length, after.length)
    for(let i=0;i<max;i++){
      const a = before[i]===undefined ? '' : before[i]
      const b = after[i]===undefined ? '' : after[i]
      if(a!==b){
        console.log(`- ${a}`)
        console.log(`+ ${b}`)
      }
    }
  }
  // list any files that would become tagless
  const tagless = changes.filter(c => !/\btags:\s*\[/.test(c.after)).map(c=>c.file)
  if(tagless.length) {
    console.log('\nFiles that would become tagless:')
    for(const f of tagless) console.log(' -', f)
  }
}

preview()
