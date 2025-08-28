# SpotifyAgent


SpotifyAgent is an intelligent music recommendation assistant, integrating Spotify API and AI conversation systems. Users can interact with AI through natural language to receive personalized music recommendations and playback control services.

## Key Features

- **AI Conversation Interface**: Support for text interactions with intelligent suggestions
- **Deep Spotify Integration**: Complete user authentication, playback control, and queue management
- **MCP Toolchain**: Model Context Protocol support with extensible tool ecosystem

This project demonstrates how to deeply integrate AI technology with music services to provide users with an intelligent music experience.

## TODO/WIP
- **Spotify MCP servers**: More powerful servers for basic features and recommendation
- **Intelligent Music Recommendation**: AI-powered natural language music recommendations for various scenarios like studying, working out, and working
- .............

## Getting Started

1. Config env

**Important Security Notice**: Never commit your actual API keys to version control or Docker images. The example below shows placeholder values. For local development, create a `.env.local` file with your real keys, which is automatically ignored by git and Docker.

```bash
# Copy the example file and fill in your actual API keys

cp .env.local.example .env.local

# Then edit .env.local with your real API keys
```

Example `.env.local` content:

```bash
# openai provider
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# qwen provider (default use qwen as LLM backend)
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# Spotify API configuration
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_REDIRECT_URI=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth configuration
NEXTAUTH_URL=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

And prepare `spotify_mcp_server/.env`
```bash
# qwen provider
DASHSCOPE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Spotify API configuration
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify

# Last.fm API configuration
LASTFM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LASTFM_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

2. install and run the project

For MCP server, install `uv` following [official guidance](https://docs.astral.sh/uv/#installation).

For frontend, install `pnpm` following [official guidance](https://pnpm.io/installation)

```bash
uv sync       # install dependencies for MCP server
pnpm install  # install dependencies for frontend
pnpm run dev
```

## Docker Deployment

Prepare the `docker-compose.yaml` file.

```yaml
services:
  app:
    build: .
    image: cocoshe/spotify-client
    container_name: spotify-client
    ports:
      - "3000:3000"
    environment:
      # qwen provider
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      # Spotify API configuration
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify
      # NextAuth configuration
      - NEXTAUTH_URL=http://127.0.0.1:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      # Last.fm API configuration
      - LASTFM_API_KEY=${LASTFM_API_KEY}
      - LASTFM_API_SECRET=${LASTFM_API_SECRET}
```

Pull and run the image.

```bash
docker compose up
```

