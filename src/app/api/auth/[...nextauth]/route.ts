import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import fs from "fs";

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
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // first time sign in, save access token and refresh token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      
      // Refresh token logic - check if token is expired
      if (token.expiresAt && Date.now() > (token.expiresAt as number) * 1000) {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
              ).toString('base64')
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            })
          });

          const tokens = await response.json();

          if (!response.ok) {
            throw tokens;
          }

          return {
            ...token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            refreshToken: tokens.refresh_token ?? token.refreshToken,
          };
        } catch (error) {
          console.error('Error refreshing access token:', error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      // save access token and refresh token to session
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      // @ts-ignore - extend session with error property
      session.error = token.error;
      
      // write tokens into .env.local (only support personal use)
      try {
        const envPath = ".env.local";
        let envContent = "";
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, "utf-8");
          // remove old tokens
          envContent = envContent.replace(/^SPOTIFY_ACCESS_TOKEN=.*$/gm, "");
          envContent = envContent.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/gm, "");
          envContent = envContent.replace(/\s+$/g, "");
        }
        
        if (token.accessToken) {
          envContent += `\n\nSPOTIFY_ACCESS_TOKEN=${token.accessToken}\n`;
        }
        if (token.refreshToken) {
          envContent += `SPOTIFY_REFRESH_TOKEN=${token.refreshToken}\n`;
        }
        
        fs.writeFileSync(envPath, envContent, "utf-8");
      } catch (e) {
        console.error("Failed to write tokens to .env.local:", e);
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };