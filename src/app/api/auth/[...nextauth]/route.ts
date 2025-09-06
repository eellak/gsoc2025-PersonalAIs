import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import fs from "fs";
import path from "path";

async function refreshAccessToken(token: any) {
  console.log("[JWT] Refreshing access token...", token);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const tokens = await response.json();
    console.log("[JWT] Refresh response:", tokens, "Status:", response.status);

    if (!response.ok) throw tokens;

    const newToken = {
      ...token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
      refreshToken: tokens.refresh_token ?? token.refreshToken,
    };

    console.log("[JWT] New token after refresh:", newToken);
    return newToken;
  } catch (error) {
    console.error("[JWT] Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'ugc-image-upload',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'app-remote-control',
            'streaming',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-modify-private',
            'user-follow-modify',
            'user-follow-read',
            'user-read-playback-position',
            'user-top-read',
            'user-read-recently-played',
            'user-library-modify',
            'user-library-read',
            'user-read-email',
            'user-read-private'
          ].join(' ')
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      console.log("[JWT] Incoming token:", token);
      console.log("[JWT] Incoming account:", account);

      // first time login
      if (account) {
        const expires_in =
          typeof account.expires_in === "number" ? account.expires_in : 3600;
        const expires_at =
          typeof account.expires_at === "number"
            ? account.expires_at
            : Math.floor(Date.now() / 1000 + expires_in);

        const newToken = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: expires_at,
        };

        console.log("[JWT] First-time sign in token:", newToken);
        return newToken;
      }

      // token still valid
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        console.log("[JWT] Token still valid, returning existing token");
        return token;
      }

      // token expired → refresh
      console.log("[JWT] Token expired, refreshing...");
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      console.log("[SESSION] Token for session callback:", token);
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      // @ts-ignore
      session.error = token.error;

      // Write tokens to .cache-username file
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Get username from environment variable
        const username = process.env.SPOTIFY_USERNAME;
        if (username) {
          const cacheFileName = `.cache-${username}`;
          const cacheFilePath = path.join(process.cwd(), cacheFileName);
          
          // Prepare token data
          const tokenData = {
            access_token: token.accessToken,
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: token.refreshToken,
            scope: "user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-private playlist-modify-public user-read-recently-played user-top-read user-follow-read user-follow-modify streaming app-remote-control playlist-read-collaborative",
            expires_at: token.expiresAt
          };
          
          // Write to cache file
          fs.writeFileSync(cacheFilePath, JSON.stringify(tokenData, null, 2), "utf-8");
          console.log(`[SESSION] Tokens written to ${cacheFileName}`);
        } else {
          console.warn("[SESSION] SPOTIFY_USERNAME not set, skipping cache file creation");
        }
      } catch (e) {
        console.error("[SESSION] Failed to write tokens to cache file:", e);
      }

      console.log("[SESSION] Session object:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };