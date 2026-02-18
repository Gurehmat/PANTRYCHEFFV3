
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { image } = await req.json()

        if (!image) {
            throw new Error('No image provided')
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        // Prepare the request to Gemini
        // Using gemini-1.5-flash for speed and multimodal capabilities
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Analyze this image of a fridge or pantry. List every food ingredient you can clearly identify. Return purely a JSON array of objects with 'name', 'quantity' (number, estimate if needed, default 1), and 'unit' (default 'pc' or 'pack' etc). Example: [{\"name\": \"Milk\", \"quantity\": 1, \"unit\": \"bottle\"}]. Do not include markdown formatting like ```json." },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: image // Expecting base64 string without data:image/jpeg;base64, prefix if possible, or we strip it
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 1024,
                    }
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log("Gemini Response:", JSON.stringify(data));

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let ingredients = [];
        try {
            ingredients = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            throw new Error("Failed to parse AI response as JSON");
        }

        return new Response(
            JSON.stringify(ingredients),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
