import Card from "../components/UI/Card";
import GhostButton from "../components/UI/GhostButton";
import { CalendarDays, PlusCircle } from "lucide-react";
import gigs from "./gigs-data";

export default function ProviderDashboard({ jobs }) {
  const bookings = jobs.length;
  const earnings = jobs.reduce((sum, j) => sum + (j.budgetAmount || 0), 0);

  const metrics = [
    { label: "Impressions", value: 3200 },
    { label: "Clicks", value: 640 },
    { label: "Bookings", value: bookings },
    { label: "Earnings", value: `$${earnings.toFixed(2)}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Provider Dashboard</h1>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-sm text-neutral-500">{m.label}</div>
            <div className="mt-1 text-2xl font-bold">{m.value}</div>
          </Card>
        ))}
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">

        {/* MY GIGS */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">My Gigs</div>
            <GhostButton>
              <PlusCircle className="h-4 w-4" /> New Gig
            </GhostButton>
          </div>

          <div className="grid gap-3">
            {gigs.slice(0, 3).map((g) => (
              <Card
                key={g.id}
                className="grid grid-cols-[80px_1fr_auto] items-center gap-3 p-3"
              >
                <img
                  src={g.img}
                  className="h-16 w-20 rounded-lg object-cover"
                />

                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-neutral-500">
                    Live • From ${g.price}
                  </div>
                </div>

                <GhostButton>Edit</GhostButton>
              </Card>
            ))}
          </div>
        </Card>

        {/* UPCOMING JOBS */}
        <Card className="p-4">
          <div className="font-semibold mb-3">Upcoming Jobs</div>

          {jobs.length === 0 && (
            <div className="p-3 border border-dashed rounded-xl text-neutral-500">
              No upcoming jobs yet.
            </div>
          )}

          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex justify-between items-center border p-3 rounded-xl mb-2"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {j.date}, {j.time}
              </div>

              <div className="text-neutral-500">
                {j.title} • {j.address}
              </div>

              <GhostButton>Details</GhostButton>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
