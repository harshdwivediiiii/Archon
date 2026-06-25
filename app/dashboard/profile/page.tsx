"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Loader2, GitBranch, Mail, Shield, Calendar } from "lucide-react";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  provider: string | null;
  providers: string[];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setProfile(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </DashboardLayout>
    );
  }

  const user = profile ?? session?.user;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-zinc-400">Your account information</p>
        </div>

        <div className="flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <UserAvatar
            name={user?.name}
            email={user?.email}
            image={user?.image}
            className="h-20 w-20"
          />
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name || "User"}</h2>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            {profile?.provider && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                <GitBranch className="h-3.5 w-3.5" />
                <span>Signed in with {profile.provider}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Information about your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
                <Mail className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white">{user?.email || "Not provided"}</p>
                </div>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Member since</p>
                    <p className="text-sm text-white">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {profile?.role && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
                  <Shield className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Role</p>
                    <p className="text-sm text-white capitalize">{profile.role.toLowerCase()}</p>
                  </div>
                </div>
              )}
              {profile?.providers && profile.providers.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
                  <GitBranch className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-500">Connected providers</p>
                    <p className="text-sm text-white capitalize">
                      {profile.providers.join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
