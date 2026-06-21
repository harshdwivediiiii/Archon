"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";

const timelineEvents = [
  { date: "2026-06-21", events: [
    { type: "addition", title: "API Gateway deployed", description: "New API Gateway v2.1.0 deployed to production", component: "Gateway" },
    { type: "change", title: "Database migration completed", description: "PostgreSQL schema updated for user service", component: "Database" },
    { type: "removal", title: "Legacy auth service deprecated", description: "Old authentication service decommissioned", component: "Auth" },
  ]},
  { date: "2026-06-20", events: [
    { type: "addition", title: "Redis cache cluster added", description: "New Redis cluster for session caching", component: "Cache" },
    { type: "change", title: "API rate limits updated", description: "Rate limiting configuration changed to 1000 req/min", component: "API" },
  ]},
  { date: "2026-06-19", events: [
    { type: "addition", title: "Docker image optimized", description: "Base image updated to Alpine 3.20 for all services", component: "Docker" },
  ]},
];

export default function TimelinePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline</h1>
          <p className="text-zinc-400">Architecture evolution over time</p>
        </div>

        <div className="relative space-y-8">
          {timelineEvents.map((day) => (
            <div key={day.date}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <h3 className="text-sm font-medium text-zinc-400">{day.date}</h3>
              </div>
              <div className="ml-6 space-y-4 border-l border-zinc-800 pl-6">
                {day.events.map((event, i) => (
                  <Card key={i} className="transition-all hover:border-blue-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-2 ${
                          event.type === "addition" ? "bg-emerald-600/10" :
                          event.type === "change" ? "bg-amber-600/10" : "bg-red-600/10"
                        }`}>
                          {event.type === "addition" ? <Plus className="h-4 w-4 text-emerald-400" /> :
                           event.type === "change" ? <ArrowRight className="h-4 w-4 text-amber-400" /> :
                           <Plus className="h-4 w-4 rotate-45 text-red-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{event.title}</p>
                            <Badge variant={event.type === "addition" ? "success" : event.type === "change" ? "warning" : "destructive"} className="text-xs capitalize">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{event.component}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
