"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function InscriptionPage() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = React.useState<boolean | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [setupKey, setSetupKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/register")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(Boolean(d.needsSetup)))
      .catch(() => setNeedsSetup(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          setupKey: setupKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Inscription impossible.");
        return;
      }
      toast.success(
        data.user.role === "SUPER_ADMIN"
          ? "Compte super administrateur créé."
          : "Compte élève créé.",
      );
      router.replace(data.user.role === "SUPER_ADMIN" ? "/admin" : "/");
      router.refresh();
    } catch {
      toast.error("Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
          <GraduationCap className="size-6" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Formation Émargement</p>
          <h1 className="font-heading text-xl font-semibold">Inscription</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {needsSetup ? "Créer le super administrateur" : "Créer un compte élève"}
          </CardTitle>
          <CardDescription>
            {needsSetup
              ? "Première installation : ce compte aura tous les droits d'administration."
              : "Les formateurs sont créés par le super administrateur depuis le back-office."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needsSetup === null ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création…" : "Créer le compte"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
