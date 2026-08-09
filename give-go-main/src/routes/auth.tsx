import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Heart, Loader2, ShieldCheck, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, dashboardPathFor, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "register" | "login"; next?: string } => ({
    ...(search.mode === "register" ? { mode: "register" as const } : {}),
    // Only same-origin relative paths are preserved.
    ...(typeof search.next === "string" && search.next.startsWith("/") && !search.next.startsWith("//")
      ? { next: search.next }
      : {}),
  }),


  head: () => ({
    meta: [
      { title: "Sign in or register — ShareAt" },
      {
        name: "description",
        content: "Log in as a donor, volunteer or administrator to manage donations on ShareAt.",
      },
      { property: "og:title", content: "Sign in or register — ShareAt" },
      { property: "og:description", content: "Role-based access for donors, volunteers and admins." },
    ],
  }),
  component: AuthPage,
});

const roles: { id: AppRole; label: string; icon: typeof User; blurb: string }[] = [
  { id: "user", label: "User", icon: User, blurb: "Donate items" },
  { id: "volunteer", label: "Volunteer", icon: Truck, blurb: "Collect & deliver" },
  { id: "admin", label: "Admin", icon: ShieldCheck, blurb: "Manage platform" },
];

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  phone: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
});

type FormValues = z.infer<typeof registerSchema>;

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({ defaultValues: { full_name: "", email: "", password: "" } });

  // Already signed in → back to where they came from, else the matching dashboard.
  useEffect(() => {
    if (!loading && session) {
      if (next) {
        window.location.replace(next);
        return;
      }
      if (role) void navigate({ to: dashboardPathFor(role), replace: true });
    }
  }, [loading, session, role, navigate, next]);


  useEffect(() => {
    if (selectedRole === "admin") {
      setValue("email", "admin@shareat.com");
    }
  }, [selectedRole, setValue]);


  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    try {
      if (isRegister) {
        const parsed = registerSchema.safeParse(values);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${next ?? ""}`,
            data: {
              full_name: parsed.data.full_name,
              phone: parsed.data.phone ?? "",
              city: parsed.data.city ?? "",
              role: selectedRole === "admin" ? "user" : selectedRole,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to ShareAt!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async (email: string) => {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent");
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="gradient-primary flex size-10 items-center justify-center rounded-xl text-primary-foreground">
            <Heart className="size-5" />
          </span>
          <span className="text-xl font-semibold">ShareAt</span>
        </Link>

        <Card className="glass-card animate-rise p-6">
          <h1 className="text-2xl font-semibold">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister
              ? "Pick how you'd like to take part."
              : "Choose your role and sign in to your dashboard."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  selectedRole === r.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <r.icon className="mx-auto size-5" />
                <span className="mt-1.5 block text-xs font-semibold">{r.label}</span>
                <span className="block text-[10px] opacity-70">{r.blurb}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" placeholder="Aarav Sharma" {...register("full_name")} />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="90000 12345" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Pune" {...register("city")} />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsRegister((v) => !v)}
            >
              {isRegister ? "Already have an account?" : "New here? Register"}
            </button>
            {!isRegister && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  forgotPassword(
                    (document.getElementById("email") as HTMLInputElement | null)?.value ?? "",
                  )
                }
              >
                Forgot password?
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
