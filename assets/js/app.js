// Sheet definitions
const SHEETS = [
  {
    id: 'foundation',
    name: '基盤',
    type: 'standard',
    groupBy: null,
    roleCols: ['BZ', 'DS', 'DE'],
    extraCols: ['旧区分'],
  },
  {
    id: 'value_creation',
    name: '価値創造力',
    type: 'value_creation',
  },
  {
    id: 'data_science',
    name: 'データサイエンス力',
    type: 'standard',
    groupBy: '分類',
    roleCols: ['VC', 'DE'],
    extraCols: [],
  },
  {
    id: 'data_engineering',
    name: 'データエンジニアリング力',
    type: 'standard',
    groupBy: '分類',
    roleCols: ['VC', 'DS'],
    extraCols: [],
  },
  {
    id: 'fusion',
    name: '融合スキル',
    type: 'standard',
    groupBy: '分類',
    roleCols: [],
    extraCols: [],
  },
]

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim() })
    return obj
  })
  return { headers, rows }
}

// ── Grouping helper ────────────────────────────────────────────────────────────

function groupBy(rows, key) {
  const map = new Map()
  for (const row of rows) {
    const val = row[key] ?? ''
    if (!map.has(val)) map.set(val, [])
    map.get(val).push(row)
  }
  return [...map.entries()].map(([key, rows]) => ({ key, rows }))
}

// ── HTML helpers ───────────────────────────────────────────────────────────────

const ROLE_COLORS = { BZ: 'badge-bz', DS: 'badge-ds', DE: 'badge-de', VC: 'badge-vc' }

function roleBadge(col) {
  return `<span class="badge ${ROLE_COLORS[col] ?? 'bg-secondary'}">${col}</span>`
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function rowSearchText(row, keys) {
  return keys.map(k => row[k] ?? '').join(' ').toLowerCase()
}

// ── Standard table ─────────────────────────────────────────────────────────────

function renderStandardTable(rows, roleCols, extraCols) {
  const roleHead  = roleCols.length ? '<th>関連</th>' : ''
  const extraHead = extraCols.map(c => `<th>${c}</th>`).join('')

  const bodyRows = rows.map(row => {
    const roles = roleCols.filter(c => row[c]).map(roleBadge).join(' ')
    const req   = row['必須スキル'] ? '<span class="badge badge-req">必須</span>' : ''
    const extra = extraCols.map(c => `<td>${row[c] ?? ''}</td>`).join('')
    const txt   = escapeAttr(rowSearchText(row, ['スキルカテゴリ', 'サブカテゴリ', 'チェック項目', '分類', ...extraCols]))
    return `<tr class="skill-row" data-text="${txt}">
      <td>${row['No'] ?? ''}</td>
      <td>${row['サブカテゴリ'] ?? ''}</td>
      <td><span class="skill-level">${row['スキルレベル'] ?? ''}</span></td>
      <td>${row['チェック項目'] ?? ''}</td>
      ${roleCols.length ? `<td>${roles}</td>` : ''}
      <td>${req}</td>
      ${extra}
    </tr>`
  }).join('')

  return `<div class="table-responsive">
    <table class="table table-sm table-hover skill-table">
      <thead><tr>
        <th style="width:36px">No</th>
        <th>サブカテゴリ</th>
        <th style="width:72px">レベル</th>
        <th>チェック項目</th>
        ${roleHead}
        <th style="width:56px">必須</th>
        ${extraHead}
      </tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>`
}

// ── Value-creation table ───────────────────────────────────────────────────────

function renderValueCreationTable(rows) {
  const bodyRows = rows.map(row => {
    const req = []
    if (row['★ 必須'])   req.push('<span class="skill-level">★</span>')
    if (row['★★ 必須'])  req.push('<span class="skill-level">★★</span>')
    if (row['★★★ 必須']) req.push('<span class="skill-level">★★★</span>')
    const ds  = row['DS'] ? roleBadge('DS') : ''
    const de  = row['DE'] ? roleBadge('DE') : ''
    const txt = escapeAttr(rowSearchText(row, ['フェーズ', 'スキルカテゴリ', 'サブカテゴリ', 'スキル定義', '★（見習い）', '★★（一人前）', '★★★（棟梁）']))
    return `<tr class="skill-row" data-text="${txt}">
      <td>${row['No'] ?? ''}</td>
      <td>${row['サブカテゴリ'] ?? ''}</td>
      <td class="text-muted">${row['スキル定義'] ?? ''}</td>
      <td>${row['★（見習い）'] ?? ''}</td>
      <td>${row['★★（一人前）'] ?? ''}</td>
      <td>${row['★★★（棟梁）'] ?? ''}</td>
      <td>${req.join(' ')}</td>
      <td>${ds}</td>
      <td>${de}</td>
    </tr>`
  }).join('')

  return `<div class="table-responsive">
    <table class="table table-sm table-hover skill-table">
      <thead><tr>
        <th style="width:36px">No</th>
        <th>サブカテゴリ</th>
        <th>スキル定義</th>
        <th><span class="skill-level">★</span> 見習い</th>
        <th><span class="skill-level">★★</span> 一人前</th>
        <th><span class="skill-level">★★★</span> 棟梁</th>
        <th>必須</th>
        <th>DS</th>
        <th>DE</th>
      </tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>`
}

// ── Accordion builder ──────────────────────────────────────────────────────────

let accCounter = 0

function buildAccordion(catGroups, tableRenderer) {
  return catGroups.map(({ key, rows }) => {
    const id = `acc-${++accCounter}`
    return `<div class="accordion-item">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button"
          data-bs-toggle="collapse" data-bs-target="#${id}">
          ${key} <span class="badge bg-secondary ms-2">${rows.length}</span>
        </button>
      </h2>
      <div id="${id}" class="accordion-collapse collapse">
        <div class="accordion-body p-0">${tableRenderer(rows)}</div>
      </div>
    </div>`
  }).join('')
}

// ── Sheet content ──────────────────────────────────────────────────────────────

function buildSheetContent(sheet, rows) {
  if (sheet.type === 'value_creation') {
    const phases = groupBy(rows, 'フェーズ')
    return phases.map(({ key: phase, rows: phaseRows }) => {
      const cats = groupBy(phaseRows, 'スキルカテゴリ')
      return `<div class="phase-header">${phase}</div>
        <div class="accordion mb-1">${buildAccordion(cats, renderValueCreationTable)}</div>`
    }).join('')
  }

  const { groupBy: superKey, roleCols, extraCols } = sheet
  const tableRenderer = r => renderStandardTable(r, roleCols, extraCols)

  if (!superKey) {
    const cats = groupBy(rows, 'スキルカテゴリ')
    return `<div class="accordion">${buildAccordion(cats, tableRenderer)}</div>`
  }

  const superGroups = groupBy(rows, superKey)
  return superGroups.map(({ key, rows: sRows }) => {
    const cats = groupBy(sRows, 'スキルカテゴリ')
    const hdr  = superGroups.length > 1 ? `<div class="super-group-header">${key}</div>` : ''
    return `${hdr}<div class="accordion mb-1">${buildAccordion(cats, tableRenderer)}</div>`
  }).join('')
}

// ── Section wrapper (collapsible) ──────────────────────────────────────────────

function buildSection(sheet) {
  const id = `section-body-${sheet.id}`
  return `<div class="section-block mb-4" data-section="${sheet.id}">
    <button class="section-toggle mb-0" data-bs-toggle="collapse" data-bs-target="#${id}">
      <span>${sheet.name}</span>
      <span class="chevron">▼</span>
    </button>
    <div id="${id}" class="collapse show">
      <div class="section-content border border-top-0 rounded-bottom p-2" id="content-${sheet.id}">
        <div class="text-muted p-2"><span class="spinner-border spinner-border-sm me-2"></span>読み込み中...</div>
      </div>
    </div>
  </div>`
}

// ── Search ─────────────────────────────────────────────────────────────────────

function applySearch(query) {
  const q = query.trim().toLowerCase()
  let totalVisible = 0

  document.querySelectorAll('.section-block').forEach(section => {
    let sectionVisible = 0

    section.querySelectorAll('.accordion-item').forEach(item => {
      const headerText = (item.querySelector('.accordion-button')?.textContent ?? '').toLowerCase()
      const skillRows  = item.querySelectorAll('.skill-row')

      if (!q) {
        skillRows.forEach(r => r.classList.remove('hidden'))
        item.classList.remove('hidden')
        sectionVisible++
        return
      }

      if (headerText.includes(q)) {
        skillRows.forEach(r => r.classList.remove('hidden'))
        item.classList.remove('hidden')
        openAccordion(item)
        sectionVisible += skillRows.length
        return
      }

      let hasMatch = false
      skillRows.forEach(r => {
        const match = (r.dataset.text ?? '').includes(q)
        r.classList.toggle('hidden', !match)
        if (match) { hasMatch = true; sectionVisible++ }
      })
      item.classList.toggle('hidden', !hasMatch)
      if (hasMatch) openAccordion(item)
    })

    section.classList.toggle('hidden', q !== '' && sectionVisible === 0)
    totalVisible += sectionVisible
  })

  const countEl = document.getElementById('search-count')
  countEl.textContent = q ? `${totalVisible} 件` : ''
}

function openAccordion(item) {
  const col = item.querySelector('.accordion-collapse')
  if (col && !col.classList.contains('show')) {
    bootstrap.Collapse.getOrCreateInstance(col).show()
  }
}

// ── Section toggle chevron sync ────────────────────────────────────────────────

function syncChevrons() {
  document.querySelectorAll('.section-toggle').forEach(btn => {
    const target = document.querySelector(btn.dataset.bsTarget)
    if (!target) return
    const updateChevron = () => btn.classList.toggle('collapsed', !target.classList.contains('show'))
    target.addEventListener('shown.bs.collapse',  updateChevron)
    target.addEventListener('hidden.bs.collapse', updateChevron)
    updateChevron()
  })
}

// ── Expand / Collapse / Reset ──────────────────────────────────────────────────

function expandAll() {
  document.querySelectorAll('.section-block:not(.hidden) .accordion-collapse:not(.show)').forEach(el =>
    bootstrap.Collapse.getOrCreateInstance(el).show()
  )
}

function collapseAll() {
  document.querySelectorAll('.section-block:not(.hidden) .accordion-collapse.show').forEach(el =>
    bootstrap.Collapse.getOrCreateInstance(el).hide()
  )
}

function reset() {
  document.getElementById('search').value = ''
  document.querySelectorAll('.skill-row.hidden').forEach(r  => r.classList.remove('hidden'))
  document.querySelectorAll('.accordion-item.hidden').forEach(i => i.classList.remove('hidden'))
  document.querySelectorAll('.section-block.hidden').forEach(s => s.classList.remove('hidden'))
  document.getElementById('search-count').textContent = ''
  collapseAll()
}

// ── Sidebar nav ────────────────────────────────────────────────────────────────

function buildSidebarNav() {
  const nav = document.getElementById('sidebar-nav')
  if (!nav) return
  nav.innerHTML = SHEETS.map(sheet => `
    <li class="nav-item">
      <a class="nav-link" href="#section-anchor-${sheet.id}" data-section="${sheet.id}">
        ${sheet.name}
      </a>
    </li>`).join('')

  // Click: smooth scroll and open section
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault()
      const id = link.dataset.section
      const block = document.querySelector(`.section-block[data-section="${id}"]`)
      if (!block) return
      // Open section if collapsed
      const body = block.querySelector('.collapse')
      if (body && !body.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(body).show()
      }
      // Scroll (offset for navbar + toolbar)
      const offset = 52 + 46
      const top = block.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    })
  })
}

function setupScrollSpy() {
  const navLinks = document.querySelectorAll('#sidebar-nav .nav-link')
  if (!navLinks.length) return

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.dataset.section
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id))
      }
    })
  }, { rootMargin: '-52px 0px -60% 0px', threshold: 0 })

  document.querySelectorAll('.section-block').forEach(el => observer.observe(el))
}

// ── Init ───────────────────────────────────────────────────────────────────────

async function loadSheet(sheet) {
  try {
    const res = await fetch(SHEET_URLS[sheet.id])
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { rows } = parseCSV(await res.text())
    const el = document.getElementById(`content-${sheet.id}`)
    if (el) el.innerHTML = buildSheetContent(sheet, rows)
  } catch (e) {
    const el = document.getElementById(`content-${sheet.id}`)
    if (el) el.innerHTML = `<div class="alert alert-danger m-2">読み込みエラー: ${e.message}</div>`
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Build section scaffolding
  const container = document.getElementById('sections')
  container.innerHTML = SHEETS.map(buildSection).join('')
  syncChevrons()
  buildSidebarNav()
  setupScrollSpy()

  // Buttons
  document.getElementById('btn-expand').addEventListener('click', expandAll)
  document.getElementById('btn-collapse').addEventListener('click', collapseAll)
  document.getElementById('btn-reset').addEventListener('click', reset)

  // Search (debounced)
  let timer = null
  document.getElementById('search').addEventListener('input', e => {
    clearTimeout(timer)
    timer = setTimeout(() => applySearch(e.target.value), 200)
  })

  // Load all sheets
  SHEETS.forEach(loadSheet)
})
