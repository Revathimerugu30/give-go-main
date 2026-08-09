import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import heroImage from "@/assets/hero-donation.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShareAt — Donate Clothes & Household Items, Free Pickup" },
      {
        name: "description",
        content:
          "ShareAt connects donors, volunteers and NGOs. List clothes or household items, schedule a doorstep pickup, and track every donation to delivery.",
      },
      { property: "og:title", content: "ShareAt — Donate Clothes & Household Items" },
      {
        property: "og:description",
        content: "List items, book a free pickup and follow each donation to the family it helps.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Boxes,
    title: "Multi-item donations",
    text: "Add clothes, footwear, books, furniture, kitchenware, electronics and toys with photos, quantity and condition.",
  },
  {
    icon: CalendarClock,
    title: "Doorstep pickup slots",
    text: "Pick a date and time window that works for you. A verified volunteer confirms and arrives.",
  },
  {
    icon: Truck,
    title: "Volunteer network",
    text: "Approved volunteers accept nearby pickups, mark items collected and update delivery status.",
  },
  {
    icon: QrCode,
    title: "Traceable donations",
    text: "Every donation carries a unique reference so you always know where your items are.",
  },
  {
    icon: ShieldCheck,
    title: "Admin moderation",
    text: "Donations are reviewed and approved before a volunteer is assigned, keeping quality high.",
  },
  {
    icon: Leaf,
    title: "Measured impact",
    text: "Dashboards show how much you've donated and the waste kept out of landfill.",
  },
];

const steps = [
  { n: "01", title: "List your items", text: "Add photos, quantity, condition and a pickup address." },
  { n: "02", title: "Admin approves", text: "Our team reviews the request and matches a partner NGO." },
  { n: "03", title: "Volunteer collects", text: "A nearby volunteer picks up at your chosen slot." },
  { n: "04", title: "Delivered", text: "Items reach the family, and your dashboard marks it complete." },
];

const testimonials = [
  {
    quote:
      "I had four bags of winter clothes sitting unused. Booked a pickup on Sunday, collected by Tuesday.",
    name: "Meera Iyer",
    role: "Donor, Pune",
  },
  {
    quote:
      "As a volunteer the assigned-pickups view is brilliant — route, contact and status all in one place.",
    name: "Rahul Deshmukh",
    role: "Volunteer, Mumbai",
  },
  {
    quote: "We receive better-sorted donations now. The approval flow saves our team hours weekly.",
    name: "Asha Foundation",
    role: "Partner NGO",
  },
];

const faqs = [
  {
    q: "Is the pickup really free?",
    a: "Yes. Pickups are handled by volunteers in your city at no cost to you.",
  },
  {
    q: "What condition should items be in?",
    a: "Anything clean, safe and usable. You declare the condition when listing, and our team reviews it.",
  },
  {
    q: "How do I know my donation reached someone?",
    a: "Your dashboard tracks live status from pending to delivered, and you can download a receipt.",
  },
  {
    q: "Can I volunteer instead of donating?",
    a: "Absolutely. Register as a volunteer — once approved you'll start receiving nearby pickup requests.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="gradient-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Give more. Waste less.
            </span>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              Your unused things are <span className="text-gradient">someone's fresh start</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              ShareAt turns spare clothes and household items into help that arrives at the right
              door. List it, choose a pickup slot, and follow the journey end to end.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "register" }}>
                  Donate an item <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/ngos">Find NGOs near me</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {["Free doorstep pickup", "Verified volunteers", "Live donation tracking"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-rise relative">
            <img
              src={heroImage}
              alt="Two people handing over a box of folded clothes for donation"
              width={1600}
              height={1104}
              className="shadow-elevated w-full rounded-3xl object-cover"
            />
            <Card className="glass-card absolute -bottom-6 left-4 hidden gap-1 p-4 sm:block">
              <p className="text-xs text-muted-foreground">Items rehomed this month</p>
              <p className="text-2xl font-semibold">12,480</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact counter */}
      <section className="border-y border-border/60 bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 lg:grid-cols-4">
          {[
            { icon: HeartHandshake, value: "48,200+", label: "Items donated" },
            { icon: Users, value: "9,600+", label: "Active donors" },
            { icon: Truck, value: "1,250+", label: "Volunteers" },
            { icon: MapPin, value: "36", label: "Cities covered" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto size-6 text-primary" />
              <p className="mt-2 text-3xl font-semibold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">About</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Reuse should be easier than throwing away
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Most households hold onto perfectly usable clothes and goods simply because giving them
              away is inconvenient. ShareAt removes every step of that friction with a coordinated
              network of donors, trained volunteers and vetted NGO partners.
            </p>
            <p>
              Each donation is reviewed, assigned, collected and confirmed — so donors see proof of
              impact, volunteers get clear tasks, and NGOs receive what they actually need.
            </p>
            <Button asChild variant="outline">
              <Link to="/about">Read our story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">Features</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
            Everything the donation journey needs
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="glass-card gap-2 p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">How it works</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Four steps, start to delivered</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n} className="gap-1 border-border/70 p-6">
              <span className="text-gradient text-3xl font-semibold">{s.n}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Trusted by givers and doers</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="glass-card gap-3 p-6">
                <p className="text-sm leading-relaxed">“{t.quote}”</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Frequently asked</h2>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Card className="gradient-primary items-center gap-3 p-10 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold">Ready to clear a shelf and change a day?</h2>
          <p className="max-w-xl opacity-90">
            Create your free account and schedule your first pickup in under two minutes.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth" search={{ mode: "register" }}>
              Get started <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}
