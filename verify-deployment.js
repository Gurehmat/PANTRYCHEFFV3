import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const results = {
    generateRecipe: { success: false, status: null, response: null },
    generateSubstitutions: { success: false, status: null, response: null }
};

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

async function testFunction(name, body) {
    const url = `${supabaseUrl}/functions/v1/${name}`;
    console.log(`Testing ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        results[name].status = res.status;
        const text = await res.text();
        try {
            results[name].response = JSON.parse(text);
        } catch {
            results[name].response = text;
        }

        if (res.ok) {
            results[name].success = true;
        }
    } catch (e) {
        results[name].error = e.message;
    }
}

(async () => {
    await testFunction('generate-recipe', {
        pantryItems: [
            { name: 'tomato', quantity: 2, unit: 'pcs' },
            { name: 'egg', quantity: 3, unit: 'pcs' }
        ]
    });

    await testFunction('generate-substitutions', {
        recipeTitle: 'Omelette',
        missingIngredients: ['cheese'],
        pantryItems: [{ name: 'milk', quantity: 1, unit: 'cup' }]
    });

    fs.writeFileSync('verification_result.json', JSON.stringify(results, null, 2));
    console.log('Done.');
})();
