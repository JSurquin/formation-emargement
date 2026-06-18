"use client";

import * as React from "react";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormation } from "@/components/providers/formation-provider";
import { AdminAccountingSection } from "@/features/admin/accounting-section";
import { formatSiret } from "@/lib/convention-print";
import type { Funder } from "@/lib/funder";
import { newId } from "@/lib/id";
import {
  TRAINER_PROFILE_DOCUMENT_MAX_BYTES,
  TRAINER_PROFILE_DOCUMENT_PRESETS,
  trainerProfileDocumentLabel,
} from "@/lib/trainer-profile";
import type { TrainerProfileDocument } from "@/lib/types";

type AdminTab = "comptabilite" | "formateurs" | "financeurs" | "sessions";

type Trainer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  company?: string;
  companySiret?: string;
  documents?: TrainerProfileDocument[];
};

const TRAINER_DOC_PRESETS = TRAINER_PROFILE_DOCUMENT_PRESETS;

function trainerDisplayName(trainer: Trainer): string {
  return `${trainer.firstName} ${trainer.lastName}`.trim();
}

export default function AdminPage() {
  const { state, hydrated, updateSession } = useFormation();
  const [tab, setTab] = React.useState<AdminTab>("comptabilite");
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [assigning, setAssigning] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [trainerPhone, setTrainerPhone] = React.useState("");
  const [trainerDateOfBirth, setTrainerDateOfBirth] = React.useState("");
  const [trainerCompany, setTrainerCompany] = React.useState("");
  const [trainerCompanySiret, setTrainerCompanySiret] = React.useState("");

  const [editingTrainerId, setEditingTrainerId] = React.useState<string | null>(
    null,
  );
  const [savingTrainerId, setSavingTrainerId] = React.useState<string | null>(
    null,
  );
  const [editTrainerPhone, setEditTrainerPhone] = React.useState("");
  const [editTrainerDateOfBirth, setEditTrainerDateOfBirth] = React.useState("");
  const [editTrainerCompany, setEditTrainerCompany] = React.useState("");
  const [editTrainerCompanySiret, setEditTrainerCompanySiret] =
    React.useState("");
  const [editTrainerDocuments, setEditTrainerDocuments] = React.useState<
    TrainerProfileDocument[]
  >([]);
  const [trainerDocKind, setTrainerDocKind] = React.useState<
    (typeof TRAINER_DOC_PRESETS)[number]["value"]
  >("kbis");
  const [trainerDocLabel, setTrainerDocLabel] = React.useState("");
  const trainerFileInputRef = React.useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone: trainerPhone,
          dateOfBirth: trainerDateOfBirth,
          company: trainerCompany,
          companySiret: trainerCompanySiret,
        }),
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
      setTrainerPhone("");
      setTrainerDateOfBirth("");
      setTrainerCompany("");
      setTrainerCompanySiret("");
      await loadTrainers();
    } catch {
      toast.error("Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const startEditTrainer = (trainer: Trainer) => {
    setEditingTrainerId(trainer.id);
    setEditTrainerPhone(trainer.phone ?? "");
    setEditTrainerDateOfBirth(trainer.dateOfBirth ?? "");
    setEditTrainerCompany(trainer.company ?? "");
    setEditTrainerCompanySiret(
      trainer.companySiret ? formatSiret(trainer.companySiret) : "",
    );
    setEditTrainerDocuments(trainer.documents ?? []);
    setTrainerDocKind("kbis");
    setTrainerDocLabel("");
  };

  const cancelEditTrainer = () => {
    setEditingTrainerId(null);
    setEditTrainerPhone("");
    setEditTrainerDateOfBirth("");
    setEditTrainerCompany("");
    setEditTrainerCompanySiret("");
    setEditTrainerDocuments([]);
    setTrainerDocKind("kbis");
    setTrainerDocLabel("");
  };

  const onPickTrainerDocument = () => {
    trainerFileInputRef.current?.click();
  };

  const onTrainerDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > TRAINER_PROFILE_DOCUMENT_MAX_BYTES) {
      toast.error("Fichier trop volumineux (4 Mo maximum par document).");
      return;
    }

    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) {
      toast.error("Formats acceptés : images (JPG, PNG…) ou PDF.");
      return;
    }

    const label = trainerProfileDocumentLabel(
      trainerDocKind,
      trainerDocKind === "other" ? trainerDocLabel : undefined,
    );

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const doc: TrainerProfileDocument = {
        id: newId(),
        label,
        kind: trainerDocKind,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      setEditTrainerDocuments((prev) => [...prev, doc]);
      setTrainerDocLabel("");
      toast.success("Document ajouté à la fiche.");
    };
    reader.onerror = () => toast.error("Impossible de lire ce fichier.");
    reader.readAsDataURL(file);
  };

  const removeTrainerDocument = (docId: string) => {
    setEditTrainerDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success("Document retiré.");
  };

  const saveTrainer = async (id: string) => {
    setSavingTrainerId(id);
    try {
      const res = await fetch(`/api/admin/trainers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editTrainerPhone,
          dateOfBirth: editTrainerDateOfBirth,
          company: editTrainerCompany,
          companySiret: editTrainerCompanySiret,
          documents: editTrainerDocuments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Mise à jour impossible.");
        return;
      }
      toast.success("Fiche formateur enregistrée.");
      cancelEditTrainer();
      await loadTrainers();
    } catch {
      toast.error("Mise à jour impossible.");
    } finally {
      setSavingTrainerId(null);
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

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as AdminTab)}
      >
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 dark:border-white/10">
          <TabsTrigger
            value="comptabilite"
            className="gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm"
          >
            Comptabilité
          </TabsTrigger>
          <TabsTrigger
            value="formateurs"
            className="gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm"
          >
            Formateurs
          </TabsTrigger>
          <TabsTrigger
            value="financeurs"
            className="gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm"
          >
            Financeurs
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm"
          >
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comptabilite" className="mt-0">
          <AdminAccountingSection />
        </TabsContent>

        <TabsContent value="formateurs" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              Créer un formateur
            </CardTitle>
            <CardDescription>
              Le formateur recevra un e-mail avec ses identifiants de connexion.
              Vous pourrez compléter sa fiche (entreprise, documents…) après création.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="t-phone">Téléphone</Label>
                  <Input
                    id="t-phone"
                    type="tel"
                    value={trainerPhone}
                    onChange={(e) => setTrainerPhone(e.target.value)}
                    placeholder="ex. 06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-dob">Date de naissance</Label>
                  <Input
                    id="t-dob"
                    type="date"
                    value={trainerDateOfBirth}
                    onChange={(e) => setTrainerDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-company">Entreprise / structure</Label>
                <Input
                  id="t-company"
                  value={trainerCompany}
                  onChange={(e) => setTrainerCompany(e.target.value)}
                  placeholder="ex. Formateur Pro SARL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-company-siret">SIRET de l&apos;entreprise</Label>
                <Input
                  id="t-company-siret"
                  value={trainerCompanySiret}
                  onChange={(e) => setTrainerCompanySiret(e.target.value)}
                  placeholder="ex. 123 456 789 00012"
                  inputMode="numeric"
                  className="font-mono tracking-wide"
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
            <CardDescription>
              Comptes avec accès aux feuilles d&apos;émargement. Complétez la fiche
              (date de naissance, entreprise, Kbis…) via le bouton modifier.
            </CardDescription>
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
                    className="rounded-lg border border-border/60 px-3 py-3 dark:border-white/10"
                  >
                    {editingTrainerId === t.id ? (
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">
                            {t.firstName} {t.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{t.email}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-t-phone-${t.id}`}>Téléphone</Label>
                            <Input
                              id={`edit-t-phone-${t.id}`}
                              type="tel"
                              value={editTrainerPhone}
                              onChange={(e) => setEditTrainerPhone(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-t-dob-${t.id}`}>
                              Date de naissance
                            </Label>
                            <Input
                              id={`edit-t-dob-${t.id}`}
                              type="date"
                              value={editTrainerDateOfBirth}
                              onChange={(e) =>
                                setEditTrainerDateOfBirth(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-t-company-${t.id}`}>
                            Entreprise / structure
                          </Label>
                          <Input
                            id={`edit-t-company-${t.id}`}
                            value={editTrainerCompany}
                            onChange={(e) => setEditTrainerCompany(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-t-siret-${t.id}`}>
                            SIRET de l&apos;entreprise
                          </Label>
                          <Input
                            id={`edit-t-siret-${t.id}`}
                            value={editTrainerCompanySiret}
                            onChange={(e) =>
                              setEditTrainerCompanySiret(e.target.value)
                            }
                            className="font-mono tracking-wide"
                          />
                        </div>

                        <div className="space-y-3 rounded-lg border border-dashed border-border/70 p-3 dark:border-white/10">
                          <p className="text-sm font-medium">Documents utiles</p>
                          {editTrainerDocuments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Aucun document (Kbis, URSSAF, assurance…).
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {editTrainerDocuments.map((doc) => (
                                <li
                                  key={doc.id}
                                  className="flex flex-col gap-2 rounded-md border border-border/60 p-2 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                                >
                                  <div className="min-w-0">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                                      {doc.label}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {doc.fileName}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <a
                                      href={doc.dataUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex"
                                    >
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                      >
                                        <ExternalLink className="size-3.5" />
                                        Ouvrir
                                      </Button>
                                    </a>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeTrainerDocument(doc.id)}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-t-doc-kind-${t.id}`}>
                                Type de document
                              </Label>
                              <Select
                                value={trainerDocKind}
                                onValueChange={(value: string | null) => {
                                  if (value) {
                                    setTrainerDocKind(
                                      value as (typeof TRAINER_DOC_PRESETS)[number]["value"],
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger id={`edit-t-doc-kind-${t.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRAINER_DOC_PRESETS.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                      {p.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {trainerDocKind === "other" ? (
                              <div className="space-y-2">
                                <Label htmlFor={`edit-t-doc-label-${t.id}`}>
                                  Libellé
                                </Label>
                                <Input
                                  id={`edit-t-doc-label-${t.id}`}
                                  value={trainerDocLabel}
                                  onChange={(e) => setTrainerDocLabel(e.target.value)}
                                  placeholder="ex. Contrat de prestation"
                                />
                              </div>
                            ) : null}
                          </div>
                          <input
                            ref={trainerFileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={onTrainerDocumentSelected}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={onPickTrainerDocument}
                          >
                            <Upload className="size-4" />
                            Ajouter un document
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingTrainerId === t.id}
                            onClick={() => void saveTrainer(t.id)}
                          >
                            {savingTrainerId === t.id
                              ? "Enregistrement…"
                              : "Enregistrer"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEditTrainer}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {t.firstName} {t.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{t.email}</p>
                          {t.phone ? (
                            <p className="text-sm text-muted-foreground">{t.phone}</p>
                          ) : null}
                          {t.dateOfBirth ? (
                            <p className="text-sm text-muted-foreground">
                              Né(e) le{" "}
                              {new Date(t.dateOfBirth).toLocaleDateString("fr-FR")}
                            </p>
                          ) : null}
                          {t.company ? (
                            <p className="text-sm text-muted-foreground">{t.company}</p>
                          ) : null}
                          {t.companySiret ? (
                            <p className="text-sm text-muted-foreground font-mono">
                              SIRET {formatSiret(t.companySiret)}
                            </p>
                          ) : null}
                          {(t.documents ?? []).length > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {(t.documents ?? []).length} document
                              {(t.documents ?? []).length > 1 ? "s" : ""} (Kbis, URSSAF…)
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Modifier ${t.firstName} ${t.lastName}`}
                          onClick={() => startEditTrainer(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeurs" className="mt-0">
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
        </TabsContent>

        <TabsContent value="sessions" className="mt-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Assigner les formateurs aux sessions
          </CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
