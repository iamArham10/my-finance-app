# 💰 Personal Finance Tracker — Agent Build Plan
> **Stack:** Next.js 14 (App Router) · shadcn/ui · Supabase · Vercel · TypeScript  
> **Currency:** PKR · **User:** Personal · **Theme:** Dark-first, Green accent

---

## ⚠️ AGENT RULES (Read Before Starting)

- Complete **every task in order**. Do not skip or combine steps.
- After each major phase, **verify it works** before moving on.
- Write **TypeScript only** — no `any` types, ever.
- Every Supabase query lives in `/lib/supabase/` — never inline in components.
- Use **server components by default**. Add `"use client"` only when needed.
- Test layout at **375px, 768px, and 1280px** after every page you build.
- Currency always formatted as **PKR 1,24,500** — never raw numbers.
- Dates always displayed as **14 May 2025** — never ISO strings in the UI.
- All destructive actions need a **confirmation dialog** before executing.
- **Never leave an empty state blank** — always show an illustration + CTA.

---

## PHASE 1 — Project Scaffolding

### Task 1.1 — Create Next.js Project
```bash
npx create-next-app@latest finance-tracker \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
cd finance-tracker
```

### Task 1.2 — Install All Dependencies
```bash
# shadcn/ui
npx shadcn@latest init
# Choose: New York style, CSS variables: yes

# Core packages
npm install @supabase/supabase-js @supabase/ssr
npm install recharts
npm install date-fns
npm install geist
npm install lucide-react
npm install sonner

# shadcn components needed
npx shadcn@latest add button input label card dialog sheet
npx shadcn@latest add table badge progress skeleton separator
npx shadcn@latest add dropdown-menu avatar popover
npx shadcn@latest add alert-dialog form select textarea
```

### Task 1.3 — Set Up Environment Variables
Create `.env.local` at root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Create `.env.example` (same keys, empty values) and commit it.

### Task 1.4 — Initialize Git & GitHub
```bash
git init
git add .
git commit -m "feat: initial project setup"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

### Task 1.5 — Connect to Vercel
- Go to vercel.com → New Project → Import the GitHub repo.
- Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
- Enable auto-deploy on push to `main`.
- Confirm a successful first deployment before continuing.

---

## PHASE 2 — Design System (Do This Before Writing Any UI)

> This phase defines the visual language of the entire app.  
> Every color, font, spacing, and animation rule defined here must be followed by every component.

### Task 2.1 — Install & Configure Fonts
In `src/app/layout.tsx`:
```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
```
Apply `GeistSans.variable` and `GeistMono.variable` to the `<html>` tag.  
Use `font-mono` class on **all** monetary values and numbers.

### Task 2.2 — Define the Color Palette in `globals.css`

Replace the entire shadcn default `:root` and `.dark` block with the following:

```css
:root {
  /* Backgrounds */
  --bg-page:           #f6f7f5;
  --bg-surface:        #ffffff;
  --bg-elevated:       #f0f2ef;
  --bg-subtle:         #e8ebe6;

  /* Borders */
  --border:            #d6dbd3;
  --border-focus:      #3d7a4f;

  /* Text */
  --text-primary:      #0f1a13;
  --text-secondary:    #5a6b5e;
  --text-muted:        #8fa395;

  /* Green Accent System */
  --accent:            #2d6a4f;   /* Primary CTA, active states */
  --accent-hover:      #245c43;
  --accent-light:      #d8ede2;   /* Backgrounds behind accent elements */
  --accent-text:       #1a4731;   /* Text on light green bg */

  /* Semantic Colors */
  --success:           #3d7a4f;
  --warning:           #b07d2a;
  --danger:            #b84040;
  --warning-bg:        #fef3c7;
  --danger-bg:         #fee2e2;

  /* Budget Progress Colors */
  --budget-safe:       #4ade80;   /* 0–50% used */
  --budget-warn:       #f59e0b;   /* 50–80% used */
  --budget-over:       #f87171;   /* 80%+ used */
}

.dark {
  --bg-page:           #0b0f0c;
  --bg-surface:        #111612;
  --bg-elevated:       #171d18;
  --bg-subtle:         #1e251f;

  --border:            #252e26;
  --border-focus:      #52a872;

  --text-primary:      #e8ede9;
  --text-secondary:    #7a9480;
  --text-muted:        #4a5e50;

  --accent:            #52a872;
  --accent-hover:      #63be85;
  --accent-light:      #172216;
  --accent-text:       #a3d9b4;

  --success:           #52a872;
  --warning:           #d4a843;
  --danger:            #e06060;
  --warning-bg:        #2a1f0a;
  --danger-bg:         #2a0f0f;

  --budget-safe:       #4ade80;
  --budget-warn:       #f59e0b;
  --budget-over:       #f87171;
}
```

Apply `background-color: var(--bg-page)` and `color: var(--text-primary)` to `body`.

### Task 2.3 — Define Spacing & Layout Rules

Add this comment block at the top of `globals.css` and enforce everywhere:
```
BASE GRID: 8px
Card padding:       24px  (p-6)
Section gap:        32px  (gap-8)
Page max-width:     1100px
Page x-padding:     24px  (mobile: 16px)
Card border-radius: 12px  (rounded-xl)
Input height:       40px  (h-10)
Button height:      36px  (h-9)
Badge radius:       999px (rounded-full)
```

### Task 2.4 — Global Component Overrides in `globals.css`

```css
/* Cards */
.card-base {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 150ms ease, transform 150ms ease;
}
.card-base:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

/* Inputs */
input, textarea, select {
  background: var(--bg-elevated) !important;
  border-color: var(--border) !important;
  color: var(--text-primary) !important;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--border-focus) !important;
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* Primary Button */
.btn-primary {
  background: var(--accent);
  color: #fff;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: background 150ms ease;
}
.btn-primary:hover { background: var(--accent-hover); }

/* Monospaced numbers */
.mono { font-family: var(--font-geist-mono); }

/* Page fade-in */
.page-enter {
  animation: fadeIn 200ms ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Task 2.5 — Build Reusable UI Primitives

Create these files before building any page:

**`src/components/ui/money.tsx`**
```tsx
// Renders PKR amounts with mono font + commas
// Usage: <Money amount={12500} />
// Output: PKR 12,500
```

**`src/components/ui/date-label.tsx`**
```tsx
// Renders dates as "14 May 2025"
// Usage: <DateLabel date="2025-05-14" />
```

**`src/components/ui/budget-bar.tsx`**
```tsx
// Progress bar that shifts color based on % used
// 0–50%: --budget-safe (green)
// 50–80%: --budget-warn (amber)
// 80%+: --budget-over (red)
// Height: 6px, fully rounded, animated width transition
```

**`src/components/ui/empty-state.tsx`**
```tsx
// Props: emoji, title, description, actionLabel, onAction
// Centered layout, emoji at 48px, muted description, accent CTA button
// Never leave any list or page empty without this component
```

**`src/components/ui/confirm-dialog.tsx`**
```tsx
// Wraps shadcn AlertDialog
// Props: trigger, title, description, onConfirm
// Destructive confirm button styled with --danger color
```

**`src/components/ui/skeleton-card.tsx`**
```tsx
// Folder card skeleton for loading states
// Use shadcn Skeleton with same dimensions as real FolderCard
```

---

## PHASE 3 — Supabase Setup

### Task 3.1 — Create Supabase Project
- Go to supabase.com → New Project.
- Save the `URL` and `anon key` into `.env.local`.

### Task 3.2 — Run Database Migrations

Go to Supabase → SQL Editor and run the following in order:

**Migration 1: profiles**
```sql
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

**Migration 2: folders**
```sql
create table public.folders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  icon         text default '📁',
  budget_limit numeric(12,2),
  created_at   timestamptz default now()
);

alter table public.folders enable row level security;

create policy "Users manage own folders"
  on public.folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Migration 3: items**
```sql
create table public.items (
  id         uuid primary key default gen_random_uuid(),
  folder_id  uuid not null references public.folders(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  price      numeric(12,2) not null,
  quantity   numeric(10,3) not null,
  unit       text not null,
  total      numeric(14,2) generated always as (price * quantity) stored,
  date       date not null,
  note       text,
  created_at timestamptz default now()
);

alter table public.items enable row level security;

create policy "Users manage own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Migration 4: Auto-create profile on signup**
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Task 3.3 — Set Up Supabase Client Files

**`src/lib/supabase/client.ts`** — browser client (for client components)
**`src/lib/supabase/server.ts`** — server client (for server components & actions)
**`src/lib/supabase/middleware.ts`** — session refresh helper

Follow the official `@supabase/ssr` docs exactly for these three files.

### Task 3.4 — Create `middleware.ts` at Project Root

Protect all `/dashboard/*` routes.  
Redirect unauthenticated users to `/login`.  
Redirect authenticated users away from `/login` and `/register` to `/dashboard`.

### Task 3.5 — Create Data Service Files

**`src/lib/supabase/folders.ts`**
```ts
// Export these functions (all typed, no `any`):
getFolders(userId)               // fetch all folders for user
getFolderById(folderId)          // fetch single folder
createFolder(data)               // insert folder
updateFolder(folderId, data)     // update folder
deleteFolder(folderId)           // delete folder (cascade deletes items)
getFolderMonthlyTotal(folderId)  // sum of items.total this calendar month
```

**`src/lib/supabase/items.ts`**
```ts
// Export these functions:
getItemsByFolder(folderId)        // fetch all items in a folder, date desc
createItem(data)                  // insert item
updateItem(itemId, data)          // update item
deleteItem(itemId)                // delete item
getMonthlySpendingByFolder()      // for analytics — group by folder, this month
getLast6MonthsTrend()             // for analytics — monthly totals for last 6 months
getTop5ExpensiveItems()           // top 5 items by total, all time
```

---

## PHASE 4 — Authentication Pages

### Task 4.1 — `/login` Page

**Layout:** Centered card (max-width 400px), vertically centered on screen.

**Visual design:**
- App logo/wordmark at top: a small green leaf icon (`🌿` or Lucide `Leaf`) next to "Kharcha" (or whatever app name is chosen — pick something personal, not generic).
- Card: `var(--bg-surface)` background, `var(--border)` border, 12px radius.
- Subtle noise texture or very faint green grid pattern on the page background.
- Heading: "Welcome back" — 24px, weight 600, tight letter spacing.
- Subheading: "Sign in to your account" — 14px, `var(--text-secondary)`.
- Fields: Email, Password. Both 40px height.
- "Sign in" button: full width, accent green, 40px height.
- "Don't have an account? Register" link below — 14px, accent color.
- Show/hide password toggle inside the input.
- On error: show a subtle red inline message under the form, not just a toast.

### Task 4.2 — `/register` Page

Same layout as login.

**Fields:** Full Name, Email, Password, Confirm Password.  
Validate that passwords match before submitting.  
On success: redirect to `/dashboard`.  
Show a loading spinner inside the button while submitting.

---

## PHASE 5 — App Shell & Navigation

### Task 5.1 — Root Layout (`src/app/dashboard/layout.tsx`)

Build the persistent app shell:

**Sidebar (desktop, 220px wide):**
- App name + leaf icon at top (same as login).
- Nav links with Lucide icons:
  - `LayoutDashboard` → /dashboard
  - `FolderOpen` → shown per-folder (dynamic)
  - `BarChart2` → /dashboard/analytics
  - `Settings` → /dashboard/settings
- Active link: accent background pill, accent text color.
- Bottom of sidebar: user avatar (initials fallback) + display name + sign-out button.

**Mobile (bottom tab bar):**
- 4 icons: Home, Folders, Analytics, Settings.
- Active tab: accent color icon, small dot indicator below.

**Top bar (mobile only):**
- App name left, avatar right (tapping opens a popover with sign-out).

### Task 5.2 — Dark Mode Toggle

- Store preference in `localStorage` key `"theme"`.
- On load, read from localStorage and apply `class="dark"` to `<html>`.
- Toggle button in sidebar (bottom) and settings page.
- Use Lucide `Sun` / `Moon` icons.
- Transition: `transition-colors duration-200` on `<html>`.

---

## PHASE 6 — Dashboard Page (`/dashboard`)

### Task 6.1 — Summary Cards Row

Three cards at the top in a responsive row (3-col desktop, stacked mobile):

**Card 1 — Total Spent This Month**
- Large mono number: `PKR 48,200`
- Label below: "spent in May 2025"
- Subtle green tint background

**Card 2 — Active Folders**
- Large number: count of folders
- Label: "expense categories"
- Folder icon in top-right corner

**Card 3 — Budget Alert**
- Shows folder closest to its budget limit
- Progress bar (colored by % used)
- Label: "Petrol · 84% of PKR 10,000"
- If no budgets set: show "No budgets configured" in muted text

### Task 6.2 — Folder Grid

Below the summary cards:

**Section header:** "Your Folders" + "New Folder" button (top right of section).

**Folder cards grid:** 3 columns desktop → 2 tablet → 1 mobile. `gap-4`.

**Each FolderCard shows:**
- Emoji icon (large, 32px) + folder name (16px, weight 600)
- "X items" badge — small pill, muted
- Monthly total: `PKR 12,500` in mono font, 20px, green color
- Budget bar (only if budget is set): 6px height, colored by %
- Budget label: "PKR 8,200 of PKR 10,000" in 12px muted text
- Hover: `translateY(-2px)` + border shifts to `var(--accent)`
- Click: navigates to `/dashboard/folders/[id]`

**Loading state:** Show 6 `<SkeletonCard />` components while fetching.

**Empty state:** If no folders exist, show `<EmptyState />` with:
- Emoji: 📂
- Title: "No folders yet"
- Description: "Create your first folder to start tracking expenses."
- Button: "Create Folder"

### Task 6.3 — New Folder Modal

Triggered by "New Folder" button. Uses shadcn `Dialog`.

**Form fields:**
- Folder Name (text input, required)
- Icon (emoji picker — grid of 24 emojis: ⛽🛒🏠💡🍔✈️🎓💊🐕🧴👗📱💈🍕🚗🏋️📦🎮☕🪴🧹💰🔧)
- Monthly Budget Limit (number input, optional, labeled "in PKR — leave blank for no limit")

**Behavior:**
- Validate name is not empty.
- On submit: call `createFolder()`, close modal, refresh folder list, show success toast.
- Loading state: button shows spinner + "Creating…" text.

---

## PHASE 7 — Folder Detail Page (`/dashboard/folders/[id]`)

### Task 7.1 — Page Header

- Back arrow → `/dashboard`
- Large emoji icon + folder name (editable — clicking name opens inline edit)
- "Edit Folder" button (opens a sheet to change name, icon, budget)
- "Delete Folder" button (opens `<ConfirmDialog />` before deleting)

### Task 7.2 — Budget Status Banner

Only shown if folder has a budget set.

- Full-width bar: `height: 8px`, colored by % used.
- Below bar: "PKR 6,200 spent of PKR 10,000 budget this month · 38% used"
- If over budget: show a `var(--danger-bg)` banner with red text warning.

### Task 7.3 — Mini Spending Chart

A small bar chart (Recharts `BarChart`) showing:
- X-axis: days of the current month (1–31)
- Y-axis: PKR spent that day in this folder
- Bar color: `var(--accent)`
- Height: 140px
- No legend needed, tooltips on hover showing "PKR X on [date]"
- Only shown if there are items this month; otherwise hidden.

### Task 7.4 — Items Table

**Columns:** Date | Name | Qty | Unit | Price/unit | Total | Actions

**Styling rules:**
- No outer table border. Row dividers only (`border-b` on each row).
- Header row: 12px uppercase, `var(--text-muted)`, letter-spacing 0.08em.
- Data rows: 14px, 48px row height.
- Date column: `<DateLabel />` component.
- Name: weight 500.
- Qty + Unit: shown together, e.g. "3 litres" — unit as a muted pill badge.
- Price/unit: mono font, `var(--text-secondary)`.
- Total: mono font, weight 600, `var(--accent)` color (green).
- Actions: edit icon + delete icon, only visible on row hover.
- Row hover: very subtle `var(--bg-elevated)` background shift.

**Sorting:** Date descending by default. Clicking column headers re-sorts.

**Loading:** Show skeleton rows (5 rows of pulsing lines) while fetching.

**Empty state:** `<EmptyState emoji="🧾" title="No items yet" description="Add your first item to this folder." />`

### Task 7.5 — Add Item Button & Sheet

Sticky "Add Item" button at bottom-right (FAB on mobile, regular button on desktop).

Opens a shadcn `Sheet` sliding in from the right (480px wide on desktop).

**Form fields inside sheet:**
| Field | Type | Notes |
|---|---|---|
| Item Name | Text | e.g. "Shell Petrol" |
| Price per unit | Number | PKR, 2 decimal places |
| Quantity | Number | up to 3 decimal places |
| Unit | Select + free text | Options: litres, kg, pcs, hours, months — or type custom |
| Date | Date picker | Defaults to today |
| Note | Textarea | Optional, 2 rows |

**Live Total Preview:**
- Below price + quantity fields, show: `= PKR 1,500` updating in real time as the user types.
- Style it as a highlighted row: `var(--accent-light)` background, green text, mono font, 18px.

**Behavior:**
- Validate all required fields.
- On submit: call `createItem()`, close sheet, refresh table, show toast "Item added".
- Edit mode: same sheet, pre-filled, button says "Save Changes".

---

## PHASE 8 — Analytics Page (`/dashboard/analytics`)

### Task 8.1 — Page Header
Title: "Analytics" + current month name (e.g. "May 2025") as a muted subtitle.

### Task 8.2 — Monthly Summary Row

Three stat cards (same style as dashboard):
- Total spent this month (PKR)
- Most expensive folder this month
- Average daily spend this month

### Task 8.3 — Donut Chart — Spending by Folder

Uses Recharts `PieChart` with `innerRadius`.

- Each slice = one folder.
- Color each slice a different shade of green (define 8 distinct greens).
- Center label: total PKR amount.
- Custom legend below the chart: folder name + colored dot + PKR amount + % of total.
- Tooltip on hover: folder name + PKR amount.

### Task 8.4 — Bar Chart — Last 6 Months Trend

Uses Recharts `BarChart`.

- X-axis: last 6 months (e.g. Dec, Jan, Feb, Mar, Apr, May).
- Y-axis: PKR amount.
- Bars stacked by folder (each folder a different green shade).
- Legend below showing folder → color mapping.
- Tooltip: breakdown per folder for that month.

### Task 8.5 — Top 5 Most Expensive Items

Simple list, not a table:
- Rank number (01, 02...) in muted mono font.
- Item name + folder badge.
- Total in accent green mono.
- Date in muted text.
- Subtle divider between items.

---

## PHASE 9 — Settings Page (`/dashboard/settings`)

### Task 9.1 — Profile Section
- Display Name (text input, pre-filled, save button).
- Email (read-only, shown in muted style).

### Task 9.2 — Appearance Section
- Dark mode toggle (switch component).
- Label: "Dark Mode" with Sun/Moon icon.

### Task 9.3 — Security Section
- Change Password form: Current Password, New Password, Confirm New Password.
- All validation inline.

### Task 9.4 — Danger Zone Section
- Red-tinted card (`var(--danger-bg)` background, `var(--danger)` border).
- "Delete All Data" button — opens `<ConfirmDialog />` requiring the user to type "DELETE" to confirm.
- On confirm: delete all folders + items for the user, redirect to `/dashboard`.

---

## PHASE 10 — UI Quality Pass (Do This After All Pages Are Built)

> This phase is mandatory. Do not skip it. Go through each item one by one.

### Task 10.1 — Typography Audit
- [ ] All monetary values use `GeistMono` font.
- [ ] All headings have `letter-spacing: -0.02em`.
- [ ] No heading is larger than 28px.
- [ ] Body text is 14px. Labels are 13px. Captions are 12px.
- [ ] Font weight never exceeds 600 in the UI.

### Task 10.2 — Spacing Audit
- [ ] All spacing is a multiple of 8px — no random values like 5px, 13px, 17px.
- [ ] Cards have exactly 24px padding on all sides.
- [ ] Section gaps are 32px.
- [ ] No element touches the page edge — minimum 16px horizontal page padding on mobile.

### Task 10.3 — Color Audit
- [ ] Only CSS variables are used for colors — no hardcoded hex values in JSX.
- [ ] `var(--text-muted)` used for helper text, placeholders, captions.
- [ ] `var(--text-secondary)` used for supporting info.
- [ ] `var(--text-primary)` used for all primary readable text.
- [ ] Accent green only used for: CTAs, active states, positive amounts, progress fill.
- [ ] Danger red only used for: delete buttons, over-budget states, error messages.

### Task 10.4 — Interaction Audit
- [ ] Every button has a hover state and active (pressed) state.
- [ ] Every input has a visible focus ring (3px, `var(--accent-light)`).
- [ ] All transitions are `150ms ease` — nothing slower unless it's a page enter.
- [ ] Folder cards animate on hover (`translateY(-2px)`).
- [ ] Sheet/modal appears with a slide animation, not an instant jump.

### Task 10.5 — Empty & Loading States Audit
- [ ] Every list/grid has a skeleton loading state.
- [ ] Every list/grid has a proper `<EmptyState />` component (no blank spaces).
- [ ] Every form submission shows a loading indicator in the button.
- [ ] Every async action shows a toast on success and an inline error on failure.

### Task 10.6 — Mobile Audit (Test at 375px)
- [ ] Nothing overflows horizontally.
- [ ] Bottom tab bar is visible and accessible (minimum 48px tap target per tab).
- [ ] The Add Item FAB doesn't cover important content.
- [ ] Tables are horizontally scrollable on mobile (not broken).
- [ ] Sheets are full-width on mobile.
- [ ] Font sizes are readable — nothing below 12px.

### Task 10.7 — Dark Mode Audit
- [ ] Switch between light and dark — no element shows a hardcoded color.
- [ ] All borders are visible in both modes.
- [ ] Charts re-render correctly in both modes (axis labels, tooltips).
- [ ] The Recharts tooltip background uses `var(--bg-elevated)` and `var(--border)`.

### Task 10.8 — Accessibility Basics
- [ ] All form inputs have associated `<label>` elements.
- [ ] All icon-only buttons have `aria-label` attributes.
- [ ] Delete/destructive buttons are clearly labeled (not just a red "X").
- [ ] Color is never the only way to communicate status (add text labels too).
- [ ] Focus is trapped inside modals and sheets when open.

---

## PHASE 11 — Final Deployment & Cleanup

### Task 11.1 — Pre-deploy Checklist
- [ ] `npm run build` completes with zero errors and zero TypeScript errors.
- [ ] No `console.log` statements left in production code.
- [ ] All `.env.local` values are in Vercel environment variables.
- [ ] `.env.local` is in `.gitignore`.
- [ ] `.env.example` is committed with empty values.

### Task 11.2 — README.md

Write a proper README with:
1. App name + one-line description
2. Screenshot (placeholder note is fine)
3. Tech stack list
4. Local development setup (step by step)
5. Supabase setup (point to the migrations above)
6. Vercel deployment instructions
7. Folder structure overview

### Task 11.3 — Final Commit & Deploy
```bash
git add .
git commit -m "feat: complete finance tracker v1"
git push origin main
```
Verify the Vercel deployment succeeds and the live URL works end-to-end:
Register → Login → Create Folder → Add Items → View Analytics → Settings → Logout.

---

## 📂 Final Folder Structure

```
finance-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          ← app shell + sidebar
│   │   │   ├── page.tsx            ← dashboard home
│   │   │   ├── folders/
│   │   │   │   └── [id]/page.tsx   ← folder detail
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx              ← root layout (fonts, theme)
│   │   └── globals.css             ← design system tokens
│   ├── components/
│   │   ├── ui/                     ← shadcn + custom primitives
│   │   │   ├── money.tsx
│   │   │   ├── date-label.tsx
│   │   │   ├── budget-bar.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── skeleton-card.tsx
│   │   ├── folders/
│   │   │   ├── folder-card.tsx
│   │   │   ├── folder-form.tsx     ← create/edit modal
│   │   │   └── folder-grid.tsx
│   │   ├── items/
│   │   │   ├── items-table.tsx
│   │   │   └── item-form.tsx       ← add/edit sheet
│   │   ├── charts/
│   │   │   ├── donut-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   └── mini-bar-chart.tsx
│   │   └── nav/
│   │       ├── sidebar.tsx
│   │       └── mobile-tabs.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       ├── middleware.ts
│   │       ├── folders.ts
│   │       └── items.ts
│   └── types/
│       └── index.ts                ← all shared TypeScript types
├── middleware.ts
├── .env.local
├── .env.example
└── README.md
```

---

## 🎨 UI PHILOSOPHY — Agent Must Internalize This

> Read this before writing a single line of UI code.

**The goal:** This app should feel like it was designed by a careful human who sweats every pixel — not assembled from a component library.

1. **Restraint over decoration.** If an element doesn't carry information, remove it. No decorative lines, no unnecessary icons, no filler text.

2. **Green means money, not just color.** The green accent should feel purposeful — use it for amounts, active states, and positive actions only. It should feel like it *means* something.

3. **Numbers deserve respect.** Every PKR value is monospaced, properly formatted with commas, and given visual weight. Money is the subject of this app — treat it accordingly.

4. **Density without clutter.** Pack information efficiently but give every element room to breathe. 24px card padding is non-negotiable.

5. **Hover states tell a story.** Every interactive element should communicate "I am clickable" through subtle motion — not color alone. The `translateY(-2px)` on folder cards should feel satisfying.

6. **Loading is part of the experience.** Skeleton loaders should match the exact shape of the real content. Never show a spinner where a skeleton can go.

7. **Errors are not afterthoughts.** Every form must handle errors gracefully — inline, clearly worded, and without losing the user's input.

8. **Dark mode is not an inversion.** The dark palette should feel intentional — deep forest greens and near-blacks, not just `#ffffff` → `#000000` swapped.

9. **Consistency above creativity.** Once a pattern is established (how a card looks, how a button behaves), repeat it everywhere without deviation. Consistency builds trust.

10. **The empty state is the first impression.** New users will see empty states before anything else. Make them warm, clear, and actionable.

---

*Built with Claude Code · Deployed on Vercel · Powered by Supabase*
