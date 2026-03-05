import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'src', 'data', 'recipes_with_images.json')
const data = fs.readFileSync(dataPath, 'utf8')
const recipes = JSON.parse(data)

const missing = recipes.filter(r => !r.Image)
console.log(`Total recipes: ${recipes.length}`)
console.log(`Recipes missing images: ${missing.length}`)
if (missing.length > 0) {
  console.log('Sample missing:')
  console.log(missing.slice(0, 5).map(r => r.Name))
}
