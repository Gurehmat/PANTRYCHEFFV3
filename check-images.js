import fs from 'fs'

const data = fs.readFileSync('./src/data/recipes_with_images.json', 'utf8')
const recipes = JSON.parse(data)

const missing = recipes.filter(r => !r.Image)
console.log(`Total recipes: ${recipes.length}`)
console.log(`Recipes missing images: ${missing.length}`)
if (missing.length > 0) {
  console.log('Sample missing:')
  console.log(missing.slice(0, 5).map(r => r.Name))
}
