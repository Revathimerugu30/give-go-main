import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  FileDown,
  Filter,
  ImagePlus,
  MapPinned,
  QrCode,
  ShieldCheck,
  Truck,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ShareAt donation platform" },
      {
        name: "description",
        content:
          "Donation listings, pickup scheduling, volunteer routing, admin moderation, analytics, notifications and downloadable receipts.",
      },
      { property: "og:title", content: "Features — ShareAt donation platform" },
      {
        property: "og:description",
        content: "Everything donors, volunteers and admins need in one platform.",
      },
    ],
  }),
  component: Features,
});

const groups = [
  {
    title: "For donors",
    items: [
      { icon: ImagePlus, text: "Multi-image uploads with preview before submitting" },
      { icon: MapPinned, text: "Pickup address, date and time slot selection" },
      { icon: QrCode, text: "Unique donation reference and downloadable receipt" },
      { icon: Bell, text: "Notification centre for every status change" },
    ],
  },
  {
    title: "For volunteers",
    items: [
      { icon: Truck, text: "Assigned pickups with accept / reject actions" },
      { icon: MapPinned, text: "Pickup location and map link for routing" },
      { icon: ImagePlus, text: "Collection photo upload and delivery updates" },
      { icon: BarChart3, text: "Performance statistics and delivery history" },
    ],
  },
  {
    title: "For admins",
    items: [
      { icon: ShieldCheck, text: "Approve or reject donations before assignment" },
      { icon: UserCog, text: "User, volunteer and category management" },
      { icon: BarChart3, text: "Monthly donation analytics and recent activity" },
      { icon: FileDown, text: "Reports with CSV export and broadcast notifications" },
    ],
  },
];

function Features() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="gradient-hero px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">Built for all three sides</h1>
          <p className="mt-4 text-muted-foreground">
            Each role gets its own dashboard with only the tools it needs — no clutter, no confusion.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.title} className="glass-card gap-4 p-6">
              <h2 className="text-xl font-semibold">{g.title}</h2>
              <ul className="space-y-3">
                {g.items.map((i) => (
                  <li key={i.text} className="flex gap-3 text-sm text-muted-foreground">
                    <i.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    {i.text}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/60 p-8">
          <div>
            <h2 className="text-xl font-semibold">Search, filters and pagination everywhere</h2>
            <p className="text-sm text-muted-foreground">
              Find donations by city, category or status in a couple of clicks.
            </p>
          </div>
          <Button asChild>
            <Link to="/auth" search={{ mode: "register" }}>
              <Filter className="mr-1 size-4" /> Try it free
            </Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
