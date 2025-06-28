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

1. config env
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



