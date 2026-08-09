import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Phone, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/ngos")({
  head: () => ({
    meta: [
      { title: "Partner NGOs — Find a cause near you | ShareAt" },
      {
        name: "description",
        content:
          "Browse verified NGO partners by city and the categories of donations they accept, from winter clothing to school supplies.",
      },
      { property: "og:title", content: "Partner NGOs — Find a cause near you" },
      { property: "og:description", content: "Verified NGO partners searchable by city and need." },
    ],
  }),
  component: Ngos,
});

/** Directory of partner organisations shown on the public site. */
const NGOS = [
  { name: "Asha Foundation", city: "Pune", needs: ["Clothes", "Books"], phone: "+91 90000 11111" },
  { name: "Seva Kitchen", city: "Mumbai", needs: ["Kitchen Items"], phone: "+91 90000 22222" },
  { name: "Roshni Trust", city: "Delhi", needs: ["Clothes", "Toys"], phone: "+91 90000 33333" },
  { name: "Gyan Setu", city: "Bengaluru", needs: ["Books", "Electronics"], phone: "+91 90000 44444" },
  { name: "Nayi Disha", city: "Jaipur", needs: ["Furniture", "Clothes"], phone: "+91 90000 55555" },
  { name: "Sahyog Care", city: "Pune", needs: ["Footwear", "Toys"], phone: "+91 90000 66666" },
];

function Ngos() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return NGOS;
    return NGOS.filter(
      (n) =>
        n.name.toLowerCase().includes(t) ||
        n.city.toLowerCase().includes(t) ||
        n.needs.some((x) => x.toLowerCase().includes(t)),
    );
  }, [q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="gradient-hero px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">NGOs near you</h1>
          <p className="mt-4 text-muted-foreground">
            Search by organisation, city or the kind of items they need.
          </p>
          <div className="relative mt-6">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “Pune” or “Books”"
              className="h-12 bg-background pl-10"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        {results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching NGOs"
            description="Try a different city or category."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map((n) => (
              <Card key={n.name} className="glass-card gap-2 p-6">
                <h2 className="text-lg font-semibold">{n.name}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {n.city}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-4" /> {n.phone}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.needs.map((need) => (
                    <Badge key={need} variant="secondary" className="rounded-full">
                      {need}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
