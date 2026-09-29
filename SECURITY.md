# Security policy

## Supported versions

Please report vulnerabilities against the latest `main` branch of this repository.

## Reporting a vulnerability

Do not file a public GitHub issue for security problems.

Email **suhas4497@gmail.com** with:

- A description of the issue
- Steps to reproduce
- Impact (for example: data exposure, auth bypass, leaked keys)

You can also use GitHub's private [security advisory](https://github.com/suhas991/Tulu-Dictionary-App/security/advisories/new) flow if it is enabled on the repository.

## Public keys and secrets

This frontend only uses the Supabase anon key and optional `VITE_GROQ_API_KEY`. Anything prefixed with `VITE_` is visible in the built client. Never put a Supabase service-role key in the app. Treat Groq keys used with `VITE_GROQ_API_KEY` as compromised if the app is deployed publicly.
