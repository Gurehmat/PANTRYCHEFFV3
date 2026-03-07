# 🍳 PantryCheff

> Cook from what you already have — AI-powered pantry tracking, recipe matching, and personalized recipe generation.

[![CI](https://github.com/Gurehmat/PANTRYCHEFFV3/actions/workflows/ci.yml/badge.svg)](https://github.com/Gurehmat/PANTRYCHEFFV3/actions/workflows/ci.yml)

[Live Demo](https://gurehmat.github.io/PANTRYCHEFFV3/) |
[Architecture](#architecture) | [Getting Started](#getting-started)

## ✨ Features

**Core**
- 🗄️ Pantry Management — add, edit, delete items with quantities, units, and expiry dates
- 📸 AI Fridge Scanner — photograph your fridge/pantry and let Google Gemini identify ingredients automatically
- 📖 Recipe Browser — browse curated recipes matched against your pantry items
- ❤️ Favorites — save recipes you love
- 🛒 Shopping List — track missing ingredients you need to buy

**AI-Powered**
- 🪄 Magic Recipe Generation — AI generates personalized recipes from your current pantry items
- 🔄 Smart Substitutions — AI suggests ingredient substitutions for missing items
- 📊 Confidence-Based Matching — algorithm scores recipe matches with exact, partial, and fuzzy matching

**User Experience**
- 👨‍🍳 Cook Mode — distraction-free step-by-step cooking interface with ingredient checklist
- ⚠️ Expiry Alerts — color-coded warnings for expired and soon-to-expire pantry items
- 📈 Dashboard Stats — at-a-glance view of pantry status and makeable recipes
- ⚡ Response Caching — AI responses cached to reduce API calls and improve speed
- 🛡️ Rate Limiting — client-side protection against API abuse

**Engineering**
- 🔒 Row-Level Security — database-level data isolation per user
- 🧪 154 automated tests with Vitest
- 📝 Full TypeScript (strict mode)
- 🔄 CI/CD pipeline with GitHub Actions
- 🎨 Consistent code style via ESLint + Prettier + Husky

## 📸 Screenshots

<!-- Screenshot: Landing Page -->
<!-- Screenshot: Dashboard with Stats and Expiry Alerts -->
<!-- Screenshot: Pantry with items -->
<!-- Screenshot: AI Recipe Generation -->
<!-- Screenshot: Cook Mode -->
<!-- Screenshot: Fridge Scanner -->

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend (React SPA)"
        UI[React 19 + TypeScript]
        State[Zustand Stores]
        Cache[Response Cache]
        RL[Rate Limiter]
    end
    
    subgraph "Backend (Supabase)"
        Auth[Supabase Auth]
        DB[(Postgres + RLS)]
        EF[Edge Functions]
    end
    
    subgraph "AI (Google Gemini)"
        Text[Text Generation]
        Multi[Multimodal Vision]
    end
    
    UI --> State
    UI --> Cache
    UI --> RL
    State --> Auth
    State --> DB
    RL --> EF
    EF --> Text
    EF --> Multi
    
    style UI fill:#61dafb
    style DB fill:#336791
    style EF fill:#3ecf8e
    style Text fill:#4285f4
    style Multi fill:#4285f4
```

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS)
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://ai.google.dev/) configured as a secret in Supabase Edge Functions

### 1. Clone and install

```bash
git clone https://github.com/Gurehmat/PANTRYCHEFFV3.git
cd PANTRYCHEFFV3
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

In the Supabase Dashboard, set the `GEMINI_API_KEY` secret for Edge Functions, then deploy the functions.

### 3. Supabase setup

- Apply the SQL in `supabase/migrations/` using the Supabase SQL editor or CLI
- In **Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** to match your app, such as your GitHub Pages URL and `http://localhost:5173` for local development

### 4. Run locally

```bash
npm run dev
```

Open the URL shown in the terminal, usually `http://localhost:5173`.

### 5. Build and deploy

```bash
npm run build
npm run deploy
```

The app is configured for GitHub Pages, and `deploy` publishes the `dist` folder to the `gh-pages` branch.

## 🛠️ Tech Stack

**Frontend**
- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS

**Backend**
- Supabase Auth
- Supabase Postgres
- Row-Level Security
- Supabase Edge Functions

**AI**
- Google Gemini for text generation
- Google Gemini multimodal vision for ingredient detection

**Tooling**
- Vitest
- ESLint
- Prettier
- Husky
- GitHub Actions

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

Run linting with:

```bash
npm run lint
```

## 📂 Project Structure

```text
PANTRYCHEFFV3/
├── src/                 # React frontend
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database schema and policies
├── public/              # Static assets
├── scripts/             # Utility scripts
└── tests/               # Automated tests
```

## 🔐 Security

- Row-Level Security ensures users can only access their own pantry data
- API secrets are stored securely in Supabase Edge Function secrets
- Rate limiting and caching help reduce abuse and unnecessary API usage

## 🌱 Future Improvements

- Barcode scanner for faster pantry entry
- Meal planning calendar
- Nutrition tracking
- Smarter household pantry sharing
- Voice-guided cook mode

## 📄 License

This project is for educational and portfolio purposes unless otherwise specified.
