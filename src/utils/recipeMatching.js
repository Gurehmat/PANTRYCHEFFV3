export const normalize = (str) => {
    if (!str) return ''
    // Basic normalization: lowercase, remove special chars (keep spaces), trim
    return str.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
}

export const getMatchStatus = (recipeIngredients, pantryItems) => {
    const normalize = (str) => {
        if (!str) return ''
        // Basic normalization: lowercase, remove non-alphanumeric chars (keep spaces), trim
        return str.toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .trim()
    }

    // Create a Set of normalized pantry item names for fast lookup
    // Also keep original names if needed, but normalization is key for matching
    const pantryNames = new Set(pantryItems.map(item => normalize(item.name)))
    const pantryList = Array.from(pantryNames)

    const matches = []
    const missing = []

    recipeIngredients.forEach(ingredient => {
        const normalizedIngredient = normalize(ingredient)

        // precise matching: check if any pantry item is found as a whole word in the ingredient string
        // e.g. pantry: "egg", ingredient: "2 large eggs" -> normalized: "2 large eggs"
        // we need to be careful about plurals if we removed singularization

        // Simple inclusion check:
        // Does "2 large eggs" include "egg"? Yes.
        // Does "pineapple" include "apple"? Yes. This is a risk with simple inclusion.
        // Better: check for word boundaries, but normalize removes punctuation.
        // Let's stick to simple inclusion for now as it solves "olive oil" vs "oil" better than exact match.
        // Ideally we'd use a library like 'pluralize' but we want to avoid deps if possible.

        const isMatch = pantryList.some(pantryItem => {
            if (!pantryItem) return false
            // Check if pantry item exists in ingredient string
            return normalizedIngredient.includes(pantryItem)
        })

        if (isMatch) {
            matches.push(ingredient)
        } else {
            missing.push(ingredient)
        }
    })

    const score = Math.round((matches.length / recipeIngredients.length) * 100) || 0

    return { matches, missing, score }
}
