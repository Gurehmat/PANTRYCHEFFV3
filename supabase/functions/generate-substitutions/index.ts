import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const { recipeTitle, missingIngredients, pantryItems } = await req.json()

        if (!recipeTitle || !missingIngredients) {
            throw new Error('Missing recipeTitle or missingIngredients in request body')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
      The user wants to cook "${recipeTitle}".
      They are missing these ingredients: ${missingIngredients.join(', ')}.
      They have these items in their pantry: ${pantryItems?.map((i: any) => i.name).join(', ') || 'nothing'}.
      
      Suggest 3 practical substitutions for the missing ingredients. 
      Prioritize using items from their pantry if possible, otherwise suggest common household alternatives.
      
      Return ONLY a valid JSON array of objects with this structure, and NO markdown formatting:
      [
        {
          "missing": "ingredient name",
          "substitution": "what to use instead",
          "reason": "short explanation why it works"
        }
      ]
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log("Raw Gemini response:", text)

        // Clean markdown syntax if present (e.g. ```json ... ```)
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()

        let substitutions
        try {
            substitutions = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse JSON:", jsonStr)
            throw new Error(`Failed to parse Gemini response: ${jsonStr.substring(0, 100)}...`)
        }

        return new Response(JSON.stringify(substitutions), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error("Function error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
