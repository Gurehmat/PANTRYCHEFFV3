import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testGenerate() {
  console.log('Testing generate-recipe...')
  try {
    for (let i = 0; i < 3; i++) {
        console.log(`Attempt ${i + 1}...`)
        const { data, error } = await supabase.functions.invoke('generate-recipe', {
          body: { pantryItems: [{ name: 'chicken', quantity: 1, unit: 'lb' }] }
        })
        if (error) {
          console.log(`Error on attempt ${i + 1}:`, error.message)
        } else {
          console.log(`Success on attempt ${i + 1}`)
        }
    }
  } catch (err) {
    console.error('Catch error:', err)
  }
}

testGenerate()
