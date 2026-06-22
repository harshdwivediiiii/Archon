"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Loader2 } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

interface TimelineDay {
  date: string;
  events: TimelineEvent[];
}

export default function TimelinePage() {
  const [days, setDays] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const wsRes = await fetch("/api/workspace");
        if (cancelled) return;
        const wsData = await wsRes.json();
        if (!wsData?.id) {
          setLoading(false);
          return;
        }
        const timelineRes = await fetch(`/api/timeline?workspaceId=${wsData.id}`);
        if (!cancelled && timelineRes.ok) {
          setDays(await timelineRes.json());
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline</h1>
          <p className="text-zinc-400">Architecture evolution over time</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : days.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <p className="mb-2 text-sm text-zinc-400">No timeline events yet</p>
              <p className="text-xs text-zinc-600">
                Events will appear as you create projects and import repositories
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-8">
            {days.map((day) => (
              <div key={day.date}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-medium text-zinc-400">
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                </div>
                <div className="ml-6 space-y-4 border-l border-zinc-800 pl-6">
                  {day.events.map((event) => (
                    <Card key={event.id} className="transition-all hover:border-blue-600/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-lg p-2 ${
                              event.type === "addition"
                                ? "bg-emerald-600/10"
                                : event.type === "change"
                                  ? "bg-amber-600/10"
                                  : "bg-red-600/10"
                            }`}
                          >
                            {event.type === "addition" ? (
                              <Plus className="h-4 w-4 text-emerald-400" />
                            ) : event.type === "change" ? (
                              <ArrowRight className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Plus className="h-4 w-4 rotate-45 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              <Badge
                                variant={
                                  event.type === "addition"
                                    ? "success"
                                    : event.type === "change"
                                      ? "warning"
                                      : "destructive"
                                }
                                className="text-xs capitalize"
                              >
                                {event.type}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
