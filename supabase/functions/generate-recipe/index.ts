import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { pantryItems } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
      You are a master chef. Based on these pantry items: ${pantryItems.map((i: any) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')},
      suggest a creative and delicious recipe. 
      Return ONLY a valid JSON object with this structure:
      {
        "title": "Recipe Title",
        "description": "Short description",
        "ingredients": ["1 cup flour", "2 eggs"],
        "instructions": ["Step 1", "Step 2"],
        "cooking_time": "30 mins",
        "missing_ingredients": ["optional items you might need"]
      }
      Do not include markdown formatting or backticks.
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean up potential markdown code blocks if the model ignores the instruction
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const recipe = JSON.parse(jsonStr)

        // Ensure instructions is an array (it should be from the prompt, but double check)
        if (typeof recipe.instructions === 'string') {
            recipe.instructions = [recipe.instructions];
        }

        return new Response(JSON.stringify(recipe), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
