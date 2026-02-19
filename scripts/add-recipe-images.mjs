/**
 * add-recipe-images.mjs
 * Fetches images from TheMealDB for recipes in Supabase,
 * falls back to Unsplash keyword search if no match found.
 *
 * Run with: node scripts/add-recipe-images.mjs
 */

const SUPABASE_URL = 'https://vobjkyrbwjuwgnmmziim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvYmpreXJid2p1d2dubW16aWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjgwNjAsImV4cCI6MjA4NjU0NDA2MH0.L5vcCfrLHlLKLgrcvYc4Lri-OrNpdQslcFVM3m2Pt_E'

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
}

// Fetch all recipes from Supabase
async function getRecipes() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=id,title&order=title`, { headers })
    if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status} ${await res.text()}`)
    return res.json()
}

// Search TheMealDB for a recipe by name, return image URL if found
async function getMealDBImage(title) {
    try {
        // Try the exact title first
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(title)}`)
        const data = await res.json()
        if (data.meals && data.meals.length > 0) {
            return data.meals[0].strMealThumb
        }

        // Try just the first 2 words (e.g. "Spaghetti Carbonara" instead of "Spaghetti Carbonara with bacon and cream")
        const shortTitle = title.split(' ').slice(0, 2).join(' ')
        if (shortTitle !== title) {
            const res2 = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(shortTitle)}`)
            const data2 = await res2.json()
            if (data2.meals && data2.meals.length > 0) {
                return data2.meals[0].strMealThumb
            }
        }
    } catch (e) {
        // Ignore network errors, fall through to Unsplash
    }
    return null
}

// Generate an Unsplash fallback URL from recipe title keywords
function getUnsplashFallback(title) {
    // Take first 3 meaningful words, skip common words
    const stopWords = new Set(['and', 'with', 'the', 'a', 'an', 'in', 'of', 'for', 'on', 'to'])
    const keyword = title
        .toLowerCase()
        .split(' ')
        .filter(w => !stopWords.has(w))
        .slice(0, 3)
        .join(' ')
    return `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(keyword)},food`
}

// Update a recipe's image_url in Supabase
async function updateRecipeImage(id, imageUrl) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ image_url: imageUrl })
    })
    if (!res.ok) throw new Error(`Failed to update recipe ${id}: ${await res.text()}`)
}

async function main() {
    console.log('Fetching recipes from Supabase...')
    const recipes = await getRecipes()
    console.log(`Found ${recipes.length} recipes. Looking up images...\n`)

    let mealdbHits = 0
    let unsplashFallbacks = 0

    for (const recipe of recipes) {
        process.stdout.write(`  ${recipe.title}... `)

        const mealdbImage = await getMealDBImage(recipe.title)
        let imageUrl

        if (mealdbImage) {
            imageUrl = mealdbImage
            mealdbHits++
            process.stdout.write(`✅ TheMealDB\n`)
        } else {
            imageUrl = getUnsplashFallback(recipe.title)
            unsplashFallbacks++
            process.stdout.write(`📷 Unsplash fallback\n`)
        }

        await updateRecipeImage(recipe.id, imageUrl)

        // Small delay to avoid hammering TheMealDB
        await new Promise(r => setTimeout(r, 250))
    }

    console.log(`\nDone!`)
    console.log(`  ✅ TheMealDB exact matches: ${mealdbHits}`)
    console.log(`  📷 Unsplash fallbacks: ${unsplashFallbacks}`)
}

main().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
})
