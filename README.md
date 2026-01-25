# My Kitchen Buddy

Extract recipes from social media cooking videos (TikTok, Instagram Reels, YouTube) using AI.

## Features

- Paste a video URL and get a structured recipe extracted via AI
- Supports TikTok, Instagram Reels, and YouTube (including Shorts)
- Automatically extracts nutrition information when mentioned in videos (per serving and per 100g)
- Edit and organize your extracted recipes
- Manually add/edit nutrition data (calories, protein, carbs, fat, fiber, sugar, sodium)
- Caches extractions to avoid redundant API calls

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- MongoDB
- better-auth for authentication
- OpenAI GPT-4o for recipe extraction
- Supadata API for video transcripts/metadata
- Tailwind CSS 4

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with:

   ```
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=your_database_name
   BETTER_AUTH_SECRET=your_auth_secret
   OPENAI_API_KEY=your_openai_api_key
   SUPADATA_API_KEY=your_supadata_api_key
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
