# Contributing

Thank you for helping improve Tuluvaani Dictionary. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs and propose features with a clear reproduction or use case
- Improve documentation and translations of the README
- Submit pull requests for UI, data model, or admin workflow fixes

## Development setup

1. Fork the repository and clone your fork.
2. Install dependencies and copy `.env.example` to `.env`.
3. Point `.env` at your own Supabase project; do not use production keys in a fork.
4. Run `npm run dev` and `npm run lint` before opening a pull request.

## Pull requests

- Keep changes focused; prefer one concern per pull request.
- Describe why the change is needed, not only what you changed.
- Do not commit `.env`, service-role keys, or Groq production keys.
- Do not put secrets in the frontend. `VITE_*` values are public in the built JavaScript.

Questions and discussion belong in GitHub issues: https://github.com/suhas991/Tulu-Dictionary-App/issues
