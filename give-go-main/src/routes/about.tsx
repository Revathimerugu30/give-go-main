import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Recycle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ShareAt — Our mission for reuse" },
      {
        name: "description",
        content:
          "Why ShareAt exists: making household reuse effortless by connecting donors, volunteers and NGOs in one coordinated network.",
      },
      { property: "og:title", content: "About ShareAt — Our mission for reuse" },
      {
        property: "og:description",
        content: "Making household reuse effortless for donors, volunteers and NGOs.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="gradient-hero px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">A second life for everyday things</h1>
          <p className="mt-4 text-muted-foreground">
            ShareAt began with a simple observation: people want to give, but the logistics stop
            them. We built the missing layer between a full wardrobe and a family in need.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-14 px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Community first",
              text: "Donors, volunteers and NGOs each get tools built for their part of the journey.",
            },
            {
              icon: Recycle,
              title: "Reuse over waste",
              text: "Every item routed to a home is textile and furniture waste avoided.",
            },
            {
              icon: Leaf,
              title: "Transparent by default",
              text: "Status updates, collection photos and receipts keep trust intact.",
            },
          ].map((v) => (
            <Card key={v.title} className="glass-card gap-2 p-6">
              <v.icon className="size-6 text-primary" />
              <h2 className="mt-2 text-lg font-semibold">{v.title}</h2>
              <p className="text-sm text-muted-foreground">{v.text}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">How we work with NGOs</h2>
            <p className="mt-3 text-muted-foreground">
              Partner organisations tell us what they need — winter wear, school books, kitchen
              basics — and our admin team routes approved donations accordingly. No mismatched
              deliveries, no wasted volunteer trips.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Our volunteers</h2>
            <p className="mt-3 text-muted-foreground">
              Volunteers apply, get approved by our team, and then choose pickups that fit their
              schedule and area. Performance stats and delivery history live in their dashboard.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
