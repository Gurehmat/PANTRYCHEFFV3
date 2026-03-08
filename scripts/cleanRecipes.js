/**
 * Clean recipe JSON (Spoonacular-style): strip HTML, split Method steps,
 * extract PrepTime/Calories/Protein/Fat from Description.
 * Usage: node scripts/cleanRecipes.js [input.json] [output.json]
 * Default: reads src/data/recipes_with_images.json, writes back to same file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultInput = path.join(__dirname, '..', 'src', 'data', 'recipes_with_images.json');

function stripHtml(str) {
  if (str == null || typeof str !== 'string') return str ?? '';
  return str.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function cleanMethod(method) {
  if (!Array.isArray(method)) return [];
  let steps = [];
  for (const step of method) {
    const s = typeof step === 'string' ? step : String(step);
    const noHtml = stripHtml(s);
    const byNewline = noHtml.split(/\n/).map((t) => t.trim()).filter(Boolean);
    for (const part of byNewline) {
      const byPeriodCapital = part.split(/(?<=[.!?])(?=[A-Z])/).map((t) => t.trim()).filter(Boolean);
      steps.push(...byPeriodCapital);
    }
  }
  steps = steps.map((s) => s.replace(/([.!?])(?=[A-Z])/g, '$1 ').trim()).filter(Boolean);
  return steps;
}

function extractPrepTime(description) {
  if (!description || typeof description !== 'string') return null;
  const stripped = stripHtml(description);
  const patterns = [
    /(?:in about|in approximately|takes approximately?|takes about|ready in)\s+(\d+\s*minutes?|\d+\s*hours?(?:\s*\d*\s*minutes?)?)/i,
    /(\d+)\s*minutes?\s*(?:\.|,|$)/i,
  ];
  for (const re of patterns) {
    const m = stripped.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function extractCalories(description) {
  if (!description || typeof description !== 'string') return null;
  const m = stripHtml(description).match(/(\d+)\s*calories?/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractProtein(description) {
  if (!description || typeof description !== 'string') return null;
  const m = stripHtml(description).match(/(\d+g(?:\s*of)?\s*protein)/i);
  return m ? m[1].replace(/\s+of\s+/i, '').trim() : null;
}

function extractFat(description) {
  if (!description || typeof description !== 'string') return null;
  const m = stripHtml(description).match(/(\d+g(?:\s*of)?\s*fat)/i);
  return m ? m[1].replace(/\s+of\s+/i, '').trim() : null;
}

function cleanRecipe(recipe) {
  const description = stripHtml(recipe.Description || '');
  return {
    ...recipe,
    Description: description || recipe.Description || '',
    Method: cleanMethod(recipe.Method || []),
    PrepTime: extractPrepTime(recipe.Description),
    Calories: extractCalories(recipe.Description),
    Protein: extractProtein(recipe.Description),
    Fat: extractFat(recipe.Description),
  };
}

function main() {
  const inputPath = process.argv[2] || defaultInput;
  const outputPath = process.argv[3] || inputPath;
  const fullInput = path.resolve(inputPath);
  const fullOutput = path.resolve(outputPath);

  if (!fs.existsSync(fullInput)) {
    console.error('Input file not found:', fullInput);
    process.exit(1);
  }

  console.log('Reading', fullInput);
  const data = JSON.parse(fs.readFileSync(fullInput, 'utf8'));
  if (!Array.isArray(data)) {
    console.error('Expected JSON array of recipes');
    process.exit(1);
  }

  const cleaned = data.map(cleanRecipe);
  fs.writeFileSync(fullOutput, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log('Wrote', cleaned.length, 'recipes to', fullOutput);
}

main();
