"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormation } from "@/components/providers/formation-provider";

type Trainer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export default function AdminPage() {
  const { state, hydrated } = useFormation();
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [assigning, setAssigning] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const loadTrainers = React.useCallback(async () => {
    setLoadingTrainers(true);
    try {
      const res = await fetch("/api/admin/trainers");
      const data = await res.json();
      if (res.ok) setTrainers(data.trainers ?? []);
    } catch {
      toast.error("Impossible de charger les formateurs.");
    } finally {
      setLoadingTrainers(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  const createTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Création impossible.");
        return;
      }
      toast.success("Formateur créé.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      await loadTrainers();
    } catch {
      toast.error("Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const assignTrainer = async (sessionId: string, trainerUserId: string | null) => {
    setAssigning(sessionId);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Assignation impossible.");
        return;
      }
      toast.success("Formateur assigné.");
    } catch {
      toast.error("Assignation impossible.");
    } finally {
      setAssigning(null);
    }
  };

  const activeSessions = state.sessions.filter((s) => !s.archived);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Back-office"
        description="Gérez les formateurs et assignez-les aux sessions de formation."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              Créer un formateur
            </CardTitle>
            <CardDescription>
              Le formateur recevra un e-mail avec ses identifiants de connexion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTrainer} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="t-firstName">Prénom</Label>
                  <Input
                    id="t-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-lastName">Nom</Label>
                  <Input
                    id="t-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-email">E-mail</Label>
                <Input
                  id="t-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-password">Mot de passe temporaire</Label>
                <Input
                  id="t-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Création…" : "Créer le formateur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formateurs ({trainers.length})</CardTitle>
            <CardDescription>Comptes avec accès aux feuilles d&apos;émargement.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrainers ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : trainers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun formateur pour le moment.
              </p>
            ) : (
              <ul className="space-y-3">
                {trainers.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-border/60 px-3 py-2 dark:border-white/10"
                  >
                    <p className="font-medium">
                      {t.firstName} {t.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigner les formateurs aux sessions</CardTitle>
          <CardDescription>
            Choisissez le formateur responsable de chaque session active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hydrated ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session active.</p>
          ) : (
            <ul className="space-y-4">
              {activeSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                >
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.date}</p>
                  </div>
                  <Select
                    disabled={assigning === session.id}
                    onValueChange={(value: string | null) =>
                      assignTrainer(
                        session.id,
                        value === "none" || !value ? null : value,
                      )
                    }
                  >
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue placeholder="Choisir un formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {trainers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
