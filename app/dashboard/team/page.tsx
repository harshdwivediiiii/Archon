"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Crown, Settings, Mail, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  joinedAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.members) setMembers(data.members);
        } else {
          if (!cancelled) setError("Failed to load team data");
        }
      } catch {
        if (!cancelled) setError("Failed to load team data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setInviteEmail("");
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Failed to send invitation");
      }
    } catch {
      setError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  function getInitials(name: string | null, email: string | null): string {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return (email || "?").charAt(0).toUpperCase();
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Team</h1>
            <p className="text-zinc-400">Manage your team members and invitations</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Users className="mb-4 h-12 w-12 text-zinc-600" />
                    <h3 className="mb-2 text-lg font-semibold text-white">No team members</h3>
                    <p className="mb-6 text-sm text-zinc-400">
                      Invite members to collaborate on your workspace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-zinc-800 text-zinc-300">
                              {getInitials(member.name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {member.name || "Unknown"}
                              </p>
                              {member.role === "OWNER" && (
                                <Crown className="h-3.5 w-3.5 text-amber-400" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                            {member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member"}
                          </Badge>
                          {member.role !== "OWNER" && (
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-400" />
                  Invite Members
                </CardTitle>
                <CardDescription>Send invitations to join your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button disabled={!inviteEmail.trim() || inviting} onClick={handleInvite}>
                    {inviting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Invite
                  </Button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
                  <p className="flex-1 text-sm text-zinc-400">
                    Invitations will be sent via email when the invitation system is configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
