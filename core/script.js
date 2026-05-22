import fs from "fs"

const text = fs.readFileSync(
  "./entries/fundamentals/foreword.json",
  "utf8"
)

const entry = JSON.parse(text)

console.log(entry)
