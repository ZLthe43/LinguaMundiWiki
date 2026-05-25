const fs = require("fs")
const path = require("path")

// ---- CONFIG ----
const ENTRIES_DIR = path.join(__dirname, "../entries")
const OUTPUT_DIR = path.join(__dirname, "../output")

// ---- LOAD FILES ----
function getAllJsonFiles(dir) {
  let results = []

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(fullPath))
    } else if (file.endsWith(".json")) {
      results.push(fullPath)
    }
  }

  return results
}

// ---- CATEGORY HELPERS (NEW) ----
function getCategoryId(cat) {
  return typeof cat === "string" ? cat : cat.id
}

function getCategoryTitle(cat) {
  if (typeof cat === "object" && cat.title) {
    return cat.title
  }

  const id = getCategoryId(cat)

  const parts = id.split(":")
  const name = parts[1] || id

  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ---- PATCHOULI FORMATTER ----
function formatPatchouli(text, entries) {
  if (!text) return ""

  let out = ""
  let i = 0

  while (i < text.length) {

    if (text.startsWith("$(br2)", i)) {
      out += "<br><br>"
      i += 6
      continue
    }

    if (text.startsWith("$(br)", i)) {
      out += "<br>"
      i += 5
      continue
    }

    if (text.startsWith("$(l)", i)) {
      out += "<strong>"
      i += 4
      continue
    }

    if (text.startsWith("$()", i)) {
      out += "</strong>"
      i += 3
      continue
    }

    // LINK $(l:path)
    if (text.startsWith("$(l:", i)) {
      let end = text.indexOf(")", i)
      let target = text.slice(i + 4, end)

      const entry = entries.find(e => e.key === target)
      const url = entry ? entry.url : "#"

      out += `<a href="${url}" class="wiki-link">`
      i = end + 1
      continue
    }

    out += text[i]
    i++
  }

  return out
}

// ---- GLYPH RESOLVER ----
function resolveGlyph(glyph) {
  if (!glyph) return ""

  const [ns, name] = glyph.split(":")

  // only your mod glyphs
  if (ns === "lingua_mundi") {
    return `/assets/glyphs/${name}.png`
  }

  return ""
}

// ---- ICON RESOLVER ----
function resolveIcon(icon) {
  if (!icon) return ""

  const [ns, name] = icon.split(":")

  if (ns === "lingua_mundi") {
    return `/assets/lingua_mundi/${name}.png`
  }

  if (ns === "minecraft") {
    return `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.1/assets/minecraft/textures/item/${name}.png`
  }

  return ""
}

// ---- URL HELPERS ----
function toUrl(relative) {
  return "/" + relative.replace(".json", "/index.html").replace(/\\/g, "/")
}

function toKey(relative) {
  return relative.replace(".json", "").replace(/\\/g, "/")
}

// ---- SIDEBAR ----
function buildSidebar(entries, currentKey) {
  const grouped = {}

  for (const e of entries) {
    const catId = getCategoryId(e.category)
    if (!grouped[catId]) grouped[catId] = []
    grouped[catId].push(e)
  }

  let html = ""

  for (const catId in grouped) {

    const title = getCategoryTitle(grouped[catId][0].category)

    html += `<h4>${title}</h4>`

    for (const e of grouped[catId]) {
      const active = e.key === currentKey ? "active" : ""
      html += `<a class="${active}" href="${e.url}">${e.name}</a>`
    }
  }

  return html
}

// ---- RENDER ENTRY ----
function renderEntry(entry, entries, currentKey) {
  const sidebarHTML = buildSidebar(entries, currentKey)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${entry.name}</title>
  <link rel="stylesheet" href="/style.css">
</head>

<body>

<div class="layout">

  <div class="sidebar" id="sidebar">
    <button class="toggle" onclick="toggleSidebar()">☰</button>

    <h3>Index</h3>

    <div id="sidebar-sections">
      ${sidebarHTML}
    </div>
  </div>

  <div class="content">

    <h1>
      <img class="icon" src="${resolveIcon(entry.icon)}">
      ${entry.name}
    </h1>

    ${(entry.pages || [])
      .map(p => {
        if (p.type === "patchouli:text") {
          return `<p>${formatPatchouli(p.text, entries)}</p>`
        }
        return ""

        if (page.type === "lingua_mundi:glyph_spotlight") {
          return `
            <div class="glyph-spotlight">

              <h2>${formatGlyphTitle(page.title)}</h2>

              <img class="glyph-icon" src="${resolveGlyph(page.glyph)}">

              <p>${formatPatchouli(page.text, entries)}</p>

            </div>
          `
         }
      })
      .join("\n")}
  </div>

</div>

<script>
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed")
}
</script>

</body>
</html>
`
}

// ---- INDEX PAGE ----
function generateIndex(entries) {
  const grouped = {}

  for (const e of entries) {
    const catId = getCategoryId(e.category)
    if (!grouped[catId]) grouped[catId] = []
    grouped[catId].push(e)
  }

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Wiki Index</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

<h1>Wiki Index</h1>
<div class="sidebar-like">
`

  for (const catId in grouped) {

    const title = getCategoryTitle(grouped[catId][0].category)

    html += `<div class="category">
      <div class="category-title">${title}</div>
    `

    for (const e of grouped[catId]) {
      html += `<a href="${e.url}">${e.name}</a>`
    }

    html += `</div>`
  }

  html += `</div></body></html>`

  return html
}

// ---- MAIN ----
const files = getAllJsonFiles(ENTRIES_DIR)

const ENTRIES = []

// PASS 1
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8")
  const entry = JSON.parse(raw)

  const relative = path.relative(ENTRIES_DIR, file)

  ENTRIES.push({
    name: entry.name,
    category: entry.category,
    icon: entry.icon,
    file: relative,
    key: toKey(relative),
    url: toUrl(relative),
    pages: entry.pages
  })
}

// PASS 2
for (const entry of ENTRIES) {
  const html = renderEntry(entry, ENTRIES, entry.key)

  const outputFile = path.join(
    OUTPUT_DIR,
    entry.file.replace(".json", "/index.html")
  )

  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, html)

  console.log("Generated:", outputFile)
}

// INDEX
const indexHTML = generateIndex(ENTRIES)

fs.writeFileSync(
  path.join(OUTPUT_DIR, "index.html"),
  indexHTML
)

console.log("Generated index.html")