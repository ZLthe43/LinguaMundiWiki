const fs = require("fs")
const path = require("path")

// ---- CONFIG ----
const ENTRY_PATH = path.join(__dirname, "../entries/fundamentals/foreword.json")
const OUTPUT_PATH = path.join(__dirname, "../output/foreword.html")

// ---- PATCHOULI FORMATTER ----
function formatPatchouli(text) {
  if (!text) return ""

  return text
    .replace(/\$\(br2\)/g, "<br><br>")
    .replace(/\$\(br\)/g, "<br>")
}

// ---- LOAD ENTRY ----
const raw = fs.readFileSync(ENTRY_PATH, "utf8")
const entry = JSON.parse(raw)

// ---- BUILD HTML ----
let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${entry.name}</title>
</head>
<body>
  <h1>${entry.icon}${entry.name}</h1>
`

for (const page of entry.pages) {
  if (page.type === "patchouli:text") {
    html += `<p>${formatPatchouli(page.text)}</p>\n`
  }
}

html += `
</body>
</html>
`

// ---- SAVE OUTPUT ----
fs.writeFileSync(OUTPUT_PATH, html)

console.log("Generated:", OUTPUT_PATH)