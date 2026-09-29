# Tuluvaani Dictionary

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A community dictionary for **English**, **Tulu**, **Kannada**, and **Telugu**. Learners can browse, search, and study published words; allowlisted curators maintain drafts, translations, and publication through a protected admin panel.

This project is a React (Vite) frontend with a Supabase backend for authentication, storage, and row-level access.

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Install](#install)
- [Local setup](#local-setup)
- [Supabase setup](#supabase-setup)
- [Routes](#routes)
- [Entry fields](#entry-fields)
- [AI draft suggestions](#ai-draft-suggestions)
- [Scripts](#scripts)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- Public intro and `/learn` experience with search and flashcards
- Published entries only on the public learning pages
- Admin CRUD for drafts, translation tasks, and publication
- Per-admin language skills used to assign missing-language tasks
- Optional Groq-backed AI suggestions for English draft words (development only; see [AI draft suggestions](#ai-draft-suggestions))

## Requirements

- Node.js 20 or later (LTS recommended)
- npm
- A [Supabase](https://supabase.com/) project for shared data and admin auth

## Install

```bash
git clone https://github.com/suhas991/Tulu-Dictionary-App.git
cd Tulu-Dictionary-App
npm install
```

## Local setup

```bash
copy .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. The public learning page has starter words when Supabase is not configured, but admin authentication and shared CRUD require Supabase.

Do not commit `.env` or any service-role keys.

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

## Entry fields

English, Tulu, Kannada, Telugu, and meaning are required. Example is optional. Part of speech defaults to `noun`.

## AI draft suggestions

The admin draft form includes an **AI suggestion** action. It generates one practical everyday English word and a short meaning, excluding existing English words case-insensitively. The result is placed into the unsaved form so an admin can review or edit it before saving.

For this temporary development setup, the browser calls Groq directly with `VITE_GROQ_API_KEY`. This key is exposed in the deployed JavaScript and can be copied by anyone, so use a restricted/development key only and move back to the Supabase Edge Function before production.

The client requests strict JSON without Groq JSON mode because GPT-OSS may return `failed_generation` for that option. It parses and validates the response, rejects duplicate English words, tries `openai/gpt-oss-120b` first, and falls back to `openai/gpt-oss-20b`. It never writes to `entries`; Save draft or Publish remains an explicit admin action.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Security

Please do not open public issues for vulnerabilities that could expose data or credentials. See [SECURITY.md](SECURITY.md) for how to report them.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Suhas.
