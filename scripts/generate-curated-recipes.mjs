/**
 * generate-curated-recipes.mjs
 * Fetches ~5 recipes per category from TheMealDB and saves
 * them as src/data/curated_recipes.json with image URLs baked in.
 * Run once: node scripts/generate-curated-recipes.mjs
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CATEGORIES = [
    'Beef', 'Chicken', 'Pasta', 'Seafood', 'Vegetarian',
    'Lamb', 'Pork', 'Breakfast', 'Dessert', 'Side'
]
const PER_CATEGORY = 5

async function getMealsByCategory(category) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
    const data = await res.json()
    return (data.meals || []).slice(0, PER_CATEGORY)
}

async function getMealDetail(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    const data = await res.json()
    return data.meals?.[0] || null
}

function parseMeal(meal) {
    // Extract ingredients list (TheMealDB uses strIngredient1..20 + strMeasure1..20)
    const ingredients = []
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`]?.trim()
        const msr = meal[`strMeasure${i}`]?.trim()
        if (ing) {
            ingredients.push(msr ? `${msr} ${ing}` : ing)
        }
    }

    // Split instructions into steps by newline or ". " boundary
    const instructions = (meal.strInstructions || '')
        .split(/\r?\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)

    return {
        Name: meal.strMeal,
        Description: `A delicious ${meal.strCategory} dish${meal.strArea ? ` from ${meal.strArea} cuisine` : ''}.`,
        ImageUrl: meal.strMealThumb,
        CookingTime: '30 mins',
        Ingredients: ingredients,
        Method: instructions,
    }
}

async function main() {
    const allRecipes = []

    for (const category of CATEGORIES) {
        console.log(`Fetching ${category}...`)
        const meals = await getMealsByCategory(category)

        for (const meal of meals) {
            process.stdout.write(`  ${meal.strMeal}... `)
            const detail = await getMealDetail(meal.idMeal)
            if (detail) {
                allRecipes.push(parseMeal(detail))
                process.stdout.write('✅\n')
            } else {
                process.stdout.write('⚠️ skipped\n')
            }
            await new Promise(r => setTimeout(r, 150)) // small delay
        }
    }

    const outPath = resolve(__dirname, '../src/data/curated_recipes.json')
    writeFileSync(outPath, JSON.stringify(allRecipes, null, 2))
    console.log(`\n✅ Saved ${allRecipes.length} recipes to src/data/curated_recipes.json`)
}

main().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
})
