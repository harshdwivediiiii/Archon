"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Mail, Crown, Settings, Copy, Check } from "lucide-react";
import { useState } from "react";

const members = [
  { name: "You", email: "you@example.com", role: "Owner", status: "active", initials: "YO" },
  { name: "Alice Smith", email: "alice@example.com", role: "Admin", status: "active", initials: "AS" },
  { name: "Bob Johnson", email: "bob@example.com", role: "Member", status: "active", initials: "BJ" },
];

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Team</h1>
            <p className="text-zinc-400">Manage your team members and invitations</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Team Members
            </CardTitle>
            <CardDescription>Manage roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-zinc-800 text-zinc-300">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        {member.role === "Owner" && (
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === "Owner" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                    {member.role !== "Owner" && (
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              <Button disabled={!inviteEmail}>
                <Send className="mr-2 h-4 w-4" />
                Send Invite
              </Button>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4">
              <p className="flex-1 text-sm text-zinc-400">
                Or share this invite link: <span className="font-mono text-zinc-300">archon.ai/invite/abc123</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText("archon.ai/invite/abc123");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Send({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>;
}
