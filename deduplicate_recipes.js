import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const path = join(__dirname, 'src', 'data', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(path, 'utf8'));

const uniqueRecipes = [];
const seenNames = new Set();

recipes.forEach(recipe => {
    if (!seenNames.has(recipe.Name)) {
        seenNames.add(recipe.Name);
        uniqueRecipes.push(recipe);
    }
});

console.log(`Original count: ${recipes.length}`);
console.log(`Unique count: ${uniqueRecipes.length}`);
console.log(`Removed ${recipes.length - uniqueRecipes.length} duplicates.`);

fs.writeFileSync(path, JSON.stringify(uniqueRecipes, null, 2));
