#!/usr/bin/env node
/*
  Generate a priced version of a Complete Menu JSON by
  - setting item.price to student * 100 (øre). If missing, use ansatt * 100. If both absent, 0
  - adding price_tiers: [{ type: 'student', amount_ore }, { type: 'ansatt', amount_ore }]

  Usage:
    node scripts/generate-priced-menu.js sias-complete-menu.json sias-complete-menu.priced.json
*/

const fs = require('fs')
const path = require('path')

function toOre(n) {
  if (n == null) return null
  if (typeof n !== 'number') n = Number(n)
  if (!isFinite(n)) return null
  return Math.round(n * 100)
}

function main() {
  const [,, inputPath, outputPath] = process.argv
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/generate-priced-menu.js <input.json> <output.json>')
    process.exit(1)
  }

  const src = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'))

  const out = JSON.parse(JSON.stringify(src))
  const categories = out.categories || out.menu?.categories
  if (!Array.isArray(categories)) {
    console.error('Invalid input: no categories array at top-level or under menu.categories')
    process.exit(2)
  }

  // Track used ids to ensure uniqueness
  const usedIds = new Set()

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
  }

  for (const cat of categories) {
    const items = cat.items || []
    for (const it of items) {
      // Preserve original id
      if (it.id !== undefined && it.id !== null && it.id !== '') {
        if (!it.meta) it.meta = {}
        it.meta.original_id = it.meta.original_id ?? it.id
      }

      const student = toOre(it?.meta?.student)
      const ansatt = toOre(it?.meta?.ansatt)
      let price = student ?? ansatt ?? 0
      it.price = price
      const tiers = []
      if (student != null) tiers.push({ type: 'student', amount_ore: student })
      if (ansatt != null) tiers.push({ type: 'ansatt', amount_ore: ansatt })
      if (tiers.length > 0) it.price_tiers = tiers

      // Ensure id exists, is string, and unique
      let candidate = it.id
      if (candidate === null || candidate === undefined || candidate === '') {
        candidate = `sias-${slugify(it.name)}`
      } else {
        candidate = String(candidate)
      }

      // De-duplicate
      let unique = candidate
      let counter = 2
      while (usedIds.has(unique)) {
        unique = `${candidate}-${counter++}`
      }
      it.id = unique
      usedIds.add(unique)
    }
  }

  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Wrote priced menu -> ${outputPath}`)
}

main()


