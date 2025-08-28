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
# qwen provider
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# Spotify API configuration
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_REDIRECT_URI=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth configuration
NEXTAUTH_URL=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# automatically generated Spotify access token when login
SPOTIFY_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

2. install and run the project

```bash
pnpm install
pnpm run dev
```

## Docker Deployment

When deploying with Docker, the `.env.local` and `spotify_mcp_server/.env` files are automatically excluded from the image for security. You can pass environment variables to the container at runtime:

```bash
docker run -d \
  -e OPENAI_API_KEY=your_openai_key \
  -e SPOTIFY_CLIENT_ID=your_spotify_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_spotify_client_secret \
  -p 3000:3000 \
  your-image-name
```



