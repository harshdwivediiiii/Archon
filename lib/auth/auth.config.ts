import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GitHubProfile = {
  avatar_url?: string;
  bio?: string | null;
  blog?: string | null;
  company?: string | null;
  email?: string | null;
  id: number;
  location?: string | null;
  login: string;
  name?: string | null;
};

async function getVerifiedGitHubProfile({
  tokens,
  provider,
}: {
  tokens: { access_token?: string };
  provider: { userinfo?: { url?: URL } };
}): Promise<GitHubProfile> {
  const headers = {
    Authorization: `Bearer ${tokens.access_token}`,
    "User-Agent": "authjs",
  };
  const profile = (await fetch(provider.userinfo?.url as URL, { headers }).then((res) =>
    res.json()
  )) as GitHubProfile;
  const emails = (await fetch("https://api.github.com/user/emails", { headers }).then((res) =>
    res.ok ? res.json() : []
  )) as GitHubEmail[];
  const verifiedEmail =
    emails.find((email) => email.primary && email.verified) ??
    emails.find((email) => email.verified);

  return {
    ...profile,
    email: verifiedEmail?.email ?? null,
  };
}

/**
 * Shared Auth.js configuration.
 * Keep this free of Prisma, Node.js APIs, and adapters.
 */
export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      userinfo: {
        url: "https://api.github.com/user",
        request: getVerifiedGitHubProfile,
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          bio: profile.bio,
          company: profile.company,
          githubUsername: profile.login,
          location: profile.location,
          website: profile.blog,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true;
      }

      if (account?.provider === "github") {
        return Boolean(profile?.email);
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
