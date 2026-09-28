# Tuluvaani Dictionary

A community dictionary for English, Tulu, Kannada, and Telugu, powered by React and Supabase.

## Local setup

```bash
npm install
copy .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. The public learning page has starter words when Supabase is not configured, but admin authentication and shared CRUD require Supabase.

## Supabase setup

1. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). Re-run the complete file after pulling schema changes; it is written to migrate the existing entries table.
2. In Supabase Authentication, create the first user with an email and password.
3. Copy that user's UUID and run:

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID');
```

Add more authenticated users to `admin_users` to give them dictionary curator access. Do not put a service-role key or a reusable default password in the frontend environment.

On the first visit to `/admin`, each allowlisted admin selects the languages they know. Draft entries may be completely empty or partially translated. The admin panel creates in-app tasks only for admins who selected the missing language. Public `/learn` shows only published entries; publication requires English, Tulu, Kannada, Telugu, and meaning. Example remains optional.

## Routes

- `/` intro page
- `/learn` public browse, search, and flashcards
- `/admin` Supabase email/password login and protected CRUD panel
- `/profile` protected admin profile and language settings
- `/notifications` protected admin translation tasks

## AI draft suggestions

The admin draft form includes an **AI suggestion** action. It generates one practical everyday English word and a short meaning, excluding existing English words case-insensitively. The result is placed into the unsaved form so an admin can review or edit it before saving.

For this temporary development setup, the browser calls Groq directly with `VITE_GROQ_API_KEY`. This key is exposed in the deployed JavaScript and can be copied by anyone, so use a restricted/development key only and move back to the Supabase Edge Function before production.

The client requests strict JSON without Groq JSON mode because GPT-OSS may return `failed_generation` for that option. It parses and validates the response, rejects duplicate English words, tries `openai/gpt-oss-120b` first, and falls back to `openai/gpt-oss-20b`. It never writes to `entries`; Save draft or Publish remains an explicit admin action.

## Entry fields

English, Tulu, Kannada, Telugu, and meaning are required. Example is optional. Part of speech defaults to `noun`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
