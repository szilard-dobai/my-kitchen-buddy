# My Kitchen Buddy

Extract recipes from social media cooking videos (TikTok, Instagram Reels, YouTube) using AI.

## Features

- Paste a video URL and get a structured recipe extracted via AI
- Supports TikTok, Instagram Reels, and YouTube (including Shorts)
- Automatically extracts nutrition information when mentioned in videos (per serving and per 100g)
- Edit and organize your extracted recipes
- Search and filter recipes by cuisine, difficulty, dietary tags, meal type
- Manually add/edit nutrition data (calories, protein, carbs, fat, fiber, sugar, sodium)
- Caches extractions to avoid redundant API calls
- Telegram bot integration: send video URLs directly to the bot to extract recipes
- Pro subscription with Stripe billing (100 extractions/month vs 10 on Free)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- MongoDB
- better-auth for authentication
- OpenAI GPT-4o for recipe extraction
- Supadata API for video transcripts/metadata
- Stripe for subscription billing
- grammy for Telegram bot
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
   BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key
   SUPADATA_API_KEY=your_supadata_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PRO_MONTHLY_PRICE_ID=your_stripe_price_id
   STRIPE_PRO_YEARLY_PRICE_ID=your_stripe_price_id
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_BOT_USERNAME=your_bot_username
   INTERNAL_API_TOKEN=your_internal_api_token
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
