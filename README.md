# Kharcha — Personal Finance Tracker

Kharcha is a modern, responsive personal finance tracker built with Next.js, Supabase, and Tailwind CSS. It helps you track expenses across different folders/categories, monitor your budgets, and gain insights into your spending habits.

## Features

- **Auth**: Secure email/password authentication using Supabase.
- **Folders & Budgets**: Create categories with emojis and optional monthly budget limits.
- **Items Tracking**: Log expenses with custom units, quantities, and dates.
- **Dashboard Summary**: Get a bird's eye view of your spending, active folders, and budget alerts.
- **Analytics**: Visualize your spending with Donut and Bar charts, tracking month-over-month trends.
- **Dark Mode**: Beautiful, responsive design with fully supported light and dark themes.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & CSS Variables
- **UI Components:** Custom components + [shadcn/ui](https://ui.shadcn.com/) primitives
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Fonts:** Geist & Geist Mono

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A [Supabase](https://supabase.com/) account and project.

### Environment Setup

1. Copy the example environment file (if available) or create one:
   ```bash
   touch .env.local
   ```
2. Fill in your Supabase project URL and anon key in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Installation

```bash
npm install
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Database Schema (Supabase)

The app requires two main tables in Supabase:
- `folders`: Stores categories (id, user_id, name, icon, budget_limit, created_at).
- `items`: Stores expenses (id, folder_id, user_id, name, price, quantity, unit, total, date, note, created_at).

Ensure Row Level Security (RLS) is enabled so users can only access their own data.

## Deployment

This app is ready to be deployed to [Vercel](https://vercel.com). Just connect your repository and add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the environment variables in your Vercel project settings.
