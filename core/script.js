import fs from "fs"

const text = fs.readFileSync(
  "./entries/fundamentals/foreword.json",
  "utf8"
)

const entry = JSON.parse(text)

console.log(entry)

for (const page of entry.pages) {
  console.log(formatPatchouli(page.text))
}

function formatPatchouli(text) {
  return text
    .replace(/\$\(br2\)/g, "<br><br>")
    .replace(/\$\(br\)/g, "<br>")
}