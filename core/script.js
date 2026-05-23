const fs = require("fs")
const path = require("path")

// ---- CONFIG ----
const ENTRIES_DIR = path.join(__dirname, "../entries")
const OUTPUT_DIR = path.join(__dirname, "../output")

function formatPatchouli(text) {
  if (!text) return ""

  let out = ""
  let i = 0

  let bold = false

  while (i < text.length) {

    // $(br2)
    if (text.slice(i, i + 6) === "$(br2)") {
      out += "<br><br>"
      i += 6
      continue
    }

    // $(br)
    if (text.slice(i, i + 5) === "$(br)") {
      out += "<br>"
      i += 5
      continue
    }

    // $(l)
    if (text.slice(i, i + 4) === "$(l)") {
      bold = true
      out += "<strong>"
      i += 4
      continue
    }

    // $()
    if (text.slice(i, i + 3) === "$()") {
      if (bold) {
        out += "</strong>"
        bold = false
      } else {
        out += ":"
      }
      i += 3
      continue
    }

    // normal character
    out += text[i]
    i++
  }

  return out
}


// ---- ICON RESOLVER ----
function resolveIcon(icon) {
  if (!icon) return ""

  const [ns, name] = icon.split(":")

  // custom mod icons
  if (ns === "lingua_mundi") {
    return `/assets/lingua_mundi/${name}.png`
  }

  // vanilla minecraft icons
  if (ns === "minecraft") {
    return `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.1/assets/minecraft/textures/item/${name}.png`
  }

  return ""
}

// ---- LOAD ALL JSON FILES RECURSIVELY ----
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

// ---- RENDER ENTRY ----
function renderEntry(entry) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${entry.name}</title>
  <link rel="stylesheet" href="/style.css">
</head>

<body>
  <h1>
    <img class="icon" src="${resolveIcon(entry.icon)}">
    ${entry.name}
  </h1>

  <div class="content">
    ${entry.pages
      .map(page => {
        if (page.type === "patchouli:text") {
          return `<p>${formatPatchouli(page.text)}</p>`
        }
        return ""
      })
      .join("\n")}
  </div>

</body>
</html>
`
}

// ---- MAIN ----
const files = getAllJsonFiles(ENTRIES_DIR)

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8")
  const entry = JSON.parse(raw)

  const html = renderEntry(entry)

  const relative = path.relative(ENTRIES_DIR, file)
  const outputFile = path.join(
    OUTPUT_DIR,
    relative.replace(".json", "/index.html")
  )

  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, html)

  console.log("Generated:", outputFile)
}

console.log("Done.")