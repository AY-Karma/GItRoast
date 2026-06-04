# GitRoast

Your GitHub has been talking behind your back.

GitRoast is a production-ready Next.js app that analyzes a public GitHub profile and generates a humorous, screenshot-friendly AI roast report about coding habits, repository patterns, commit messages, and project follow-through.

> [!NOTE]
> This app is in very early stages with many improvements to be made to it, Keep that in mind & Enjoy!!


## Features

- Next.js 15 App Router with TypeScript and Tailwind CSS
- Dark, motion-rich UI inspired by Spotify Wrapped, Linear, and Raycast
- GitHub REST API profile, repository, README, and commit sampling
- Structured summary calculations before AI prompting
- OpenAI JSON roast generation with a local fallback
- Share card generator with PNG download, copy link, and native share support
- Vercel-ready configuration

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
GITHUB_TOKEN=your_github_token
```

`GITHUB_TOKEN` is optional, but recommended for higher GitHub API rate limits. If `OPENAI_API_KEY` is missing, GitRoast uses a deterministic local fallback roast.

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Data Safety

GitRoast does not send raw repository dumps to OpenAI. It fetches public GitHub data, calculates a compact structured summary, and sends only that summary to the model.
