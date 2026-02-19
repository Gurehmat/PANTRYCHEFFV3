import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { recipeTitle, missingIngredients, pantryItems } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const prompt = `
      The user wants to cook "${recipeTitle}".
      They are missing these ingredients: ${missingIngredients.join(', ')}.
      They have these items in their pantry: ${pantryItems.map((i: any) => i.name).join(', ')}.
      
      Suggest 3 practical substitutions for the missing ingredients. 
      Prioritize using items from their pantry if possible, otherwise suggest common household alternatives.
      
      Return ONLY a valid JSON array of objects with this structure:
      [
        {
          "missing": "ingredient name",
          "substitution": "what to use instead",
          "reason": "short explanation why it works"
        }
      ]
      
      Do not include any markdown formatting.
    `

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error?.message || JSON.stringify(data))
        }

        // Extract text from Gemini response structure
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Clean markdown JSON if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()

        let substitutions
        try {
            substitutions = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse JSON:", jsonStr)
            throw new Error("Failed to parse Gemini response as JSON")
        }

        return new Response(JSON.stringify(substitutions), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
