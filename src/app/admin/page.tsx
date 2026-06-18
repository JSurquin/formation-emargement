"use client";

import * as React from "react";
import { Building2, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { AdminAccountingSection } from "@/features/admin/accounting-section";
import { formatSiret } from "@/lib/convention-print";
import type { Funder } from "@/lib/funder";

type Trainer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

function trainerDisplayName(trainer: Trainer): string {
  return `${trainer.firstName} ${trainer.lastName}`.trim();
}

export default function AdminPage() {
  const { state, hydrated, updateSession } = useFormation();
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [assigning, setAssigning] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [funders, setFunders] = React.useState<Funder[]>([]);
  const [loadingFunders, setLoadingFunders] = React.useState(true);
  const [creatingFunder, setCreatingFunder] = React.useState(false);
  const [savingFunderId, setSavingFunderId] = React.useState<string | null>(
    null,
  );
  const [deletingFunderId, setDeletingFunderId] = React.useState<string | null>(
    null,
  );
  const [funderName, setFunderName] = React.useState("");
  const [funderSiret, setFunderSiret] = React.useState("");
  const [funderEmail, setFunderEmail] = React.useState("");
  const [editingFunderId, setEditingFunderId] = React.useState<string | null>(
    null,
  );
  const [editFunderName, setEditFunderName] = React.useState("");
  const [editFunderSiret, setEditFunderSiret] = React.useState("");
  const [editFunderEmail, setEditFunderEmail] = React.useState("");
  const [sessionTrainerIds, setSessionTrainerIds] = React.useState<
    Record<string, string | null>
  >({});

  const trainerSelectItems = React.useMemo(
    () => [
      { value: "none", label: "Aucun" },
      ...trainers.map((t) => ({
        value: t.id,
        label: trainerDisplayName(t),
      })),
    ],
    [trainers],
  );

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

  const loadFunders = React.useCallback(async () => {
    setLoadingFunders(true);
    try {
      const res = await fetch("/api/admin/funders");
      const data = await res.json();
      if (res.ok) setFunders(data.funders ?? []);
    } catch {
      toast.error("Impossible de charger les financeurs.");
    } finally {
      setLoadingFunders(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  React.useEffect(() => {
    void loadFunders();
  }, [loadFunders]);

  React.useEffect(() => {
    if (!hydrated) return;
    const next: Record<string, string | null> = {};
    for (const session of state.sessions) {
      if (!session.archived) {
        next[session.id] = session.trainerUserId ?? null;
      }
    }
    setSessionTrainerIds(next);
  }, [hydrated, state.sessions]);

  const createFunder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingFunder(true);
    try {
      const res = await fetch("/api/admin/funders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: funderName,
          siret: funderSiret,
          email: funderEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Création impossible.");
        return;
      }
      toast.success("Financeur enregistré.");
      setFunderName("");
      setFunderSiret("");
      setFunderEmail("");
      await loadFunders();
    } catch {
      toast.error("Création impossible.");
    } finally {
      setCreatingFunder(false);
    }
  };

  const startEditFunder = (funder: Funder) => {
    setEditingFunderId(funder.id);
    setEditFunderName(funder.name);
    setEditFunderSiret(funder.siret ? formatSiret(funder.siret) : "");
    setEditFunderEmail(funder.email ?? "");
  };

  const cancelEditFunder = () => {
    setEditingFunderId(null);
    setEditFunderName("");
    setEditFunderSiret("");
    setEditFunderEmail("");
  };

  const saveFunder = async (id: string) => {
    setSavingFunderId(id);
    try {
      const res = await fetch(`/api/admin/funders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFunderName,
          siret: editFunderSiret,
          email: editFunderEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Mise à jour impossible.");
        return;
      }
      toast.success("Financeur mis à jour.");
      cancelEditFunder();
      await loadFunders();
    } catch {
      toast.error("Mise à jour impossible.");
    } finally {
      setSavingFunderId(null);
    }
  };

  const deleteFunder = async (id: string) => {
    if (!window.confirm("Supprimer ce financeur de la liste ?")) return;
    setDeletingFunderId(id);
    try {
      const res = await fetch(`/api/admin/funders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Suppression impossible.");
        return;
      }
      toast.success("Financeur supprimé.");
      if (editingFunderId === id) cancelEditFunder();
      await loadFunders();
    } catch {
      toast.error("Suppression impossible.");
    } finally {
      setDeletingFunderId(null);
    }
  };

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
      setSessionTrainerIds((prev) => ({
        ...prev,
        [sessionId]: trainerUserId,
      }));
      const trainer = trainerUserId
        ? trainers.find((t) => t.id === trainerUserId)
        : undefined;
      updateSession(sessionId, {
        trainer: trainer ? trainerDisplayName(trainer) : undefined,
      });
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
        description="Gérez la comptabilité, les formateurs, les financeurs et assignez les sessions de formation."
      />

      <AdminAccountingSection />

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Ajouter un financeur
            </CardTitle>
            <CardDescription>
              Enregistrez les coordonnées (nom, SIRET, e-mail) pour les réutiliser
              sur les conventions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createFunder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="f-name">Nom du financeur</Label>
                <Input
                  id="f-name"
                  value={funderName}
                  onChange={(e) => setFunderName(e.target.value)}
                  placeholder="ex. Orange, OPCO Atlas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-siret">N° SIRET</Label>
                <Input
                  id="f-siret"
                  value={funderSiret}
                  onChange={(e) => setFunderSiret(e.target.value)}
                  placeholder="ex. 123 456 789 00012"
                  inputMode="numeric"
                  className="font-mono tracking-wide"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-email">E-mail de contact</Label>
                <Input
                  id="f-email"
                  type="email"
                  value={funderEmail}
                  onChange={(e) => setFunderEmail(e.target.value)}
                  placeholder="ex. contact@orange.fr"
                />
              </div>
              <Button type="submit" disabled={creatingFunder}>
                {creatingFunder ? "Enregistrement…" : "Enregistrer le financeur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeurs ({funders.length})</CardTitle>
            <CardDescription>
              Liste réutilisable lors de la création des conventions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFunders ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : funders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun financeur enregistré pour le moment.
              </p>
            ) : (
              <ul className="space-y-3">
                {funders.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-lg border border-border/60 px-3 py-3 dark:border-white/10"
                  >
                    {editingFunderId === f.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-f-name-${f.id}`}>Nom</Label>
                          <Input
                            id={`edit-f-name-${f.id}`}
                            value={editFunderName}
                            onChange={(e) => setEditFunderName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-f-siret-${f.id}`}>SIRET</Label>
                          <Input
                            id={`edit-f-siret-${f.id}`}
                            value={editFunderSiret}
                            onChange={(e) => setEditFunderSiret(e.target.value)}
                            className="font-mono tracking-wide"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-f-email-${f.id}`}>E-mail</Label>
                          <Input
                            id={`edit-f-email-${f.id}`}
                            type="email"
                            value={editFunderEmail}
                            onChange={(e) => setEditFunderEmail(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingFunderId === f.id}
                            onClick={() => void saveFunder(f.id)}
                          >
                            {savingFunderId === f.id ? "Enregistrement…" : "Enregistrer"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEditFunder}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{f.name}</p>
                          {f.siret ? (
                            <p className="text-sm text-muted-foreground font-mono">
                              SIRET {formatSiret(f.siret)}
                            </p>
                          ) : null}
                          {f.email ? (
                            <p className="text-sm text-muted-foreground">{f.email}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Modifier ${f.name}`}
                            onClick={() => startEditFunder(f)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Supprimer ${f.name}`}
                            disabled={deletingFunderId === f.id}
                            onClick={() => void deleteFunder(f.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                    value={sessionTrainerIds[session.id] ?? "none"}
                    items={trainerSelectItems}
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
                          {trainerDisplayName(t)}
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
