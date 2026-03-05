import fs from 'fs'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'src', 'data', 'recipes_with_images.json')
const data = fs.readFileSync(dataPath, 'utf8')
const recipes = JSON.parse(data)

const sampleUrls = recipes.slice(0, 10).map(r => r.Image)

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode })
    }).on('error', (e) => {
      resolve({ url, status: 'error', error: e.message })
    })
  })
}

async function test() {
  console.log('Testing 10 image URLs...')
  for (const url of sampleUrls) {
    const result = await checkUrl(url)
    console.log(result)
  }
}
test()
