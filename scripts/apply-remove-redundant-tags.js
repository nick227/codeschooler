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

function apply(){
  const files = walk(CONTENT)
  const modifiedFiles = []
  const tagless = []
  for(const f of files){
    let raw = fs.readFileSync(f,'utf8')
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
          // remove the tags line entirely by turning it into a comment indicating removal
          out.push(line.replace(/^(\s*)tags:\s*\[.*\]\s*$/, '$1# tags removed by apply-remove-redundant-tags'))
        } else {
          out.push(`${prefix}[${keep.join(', ')}]`)
        }
      } else {
        out.push(line)
      }
    }
    if(modified){
      fs.writeFileSync(f, out.join('\n'), 'utf8')
      modifiedFiles.push(f)
      if(!/\btags:\s*\[/.test(out.join('\n'))) tagless.push(f)
    }
  }
  console.log(`Applied changes to ${modifiedFiles.length} file(s).`)
  if(tagless.length){
    console.log('Files that became tagless:')
    for(const t of tagless) console.log(' -', t)
  }
}

apply()
