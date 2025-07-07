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
      // first time sign in, save access token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // save access token to session
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      // write into .env.local (only support personal use)
      if (token.accessToken) {
        try {
          const envPath = ".env.local";
          let envContent = "";
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf-8");
            // remove old SPOTIFY_ACCESS_TOKEN
            envContent = envContent.replace(/^SPOTIFY_ACCESS_TOKEN=.*$/gm, "");
            envContent = envContent.replace(/\s+$/g, "");
          }
          envContent += `\n\nSPOTIFY_ACCESS_TOKEN=${token.accessToken}\n`;
          fs.writeFileSync(envPath, envContent, "utf-8");
        } catch (e) {
          console.error("Failed to write access token to .env.local:", e);
        }
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