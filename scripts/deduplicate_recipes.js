import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const recipePath = path.join(__dirname, '..', 'src', 'data', 'recipes.json')
const recipes = JSON.parse(fs.readFileSync(recipePath, 'utf8'))

const uniqueRecipes = []
const seenNames = new Set()

recipes.forEach(recipe => {
    if (!seenNames.has(recipe.Name)) {
        seenNames.add(recipe.Name)
        uniqueRecipes.push(recipe)
    }
})

console.log(`Original count: ${recipes.length}`)
console.log(`Unique count: ${uniqueRecipes.length}`)
console.log(`Removed ${recipes.length - uniqueRecipes.length} duplicates.`)

fs.writeFileSync(recipePath, JSON.stringify(uniqueRecipes, null, 2))
