"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  FileText,
  IdCard,
  Mail,
  Printer,
  Trash2,
  Upload,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countSessionsPerStudent } from "@/lib/student-session-counts";
import { newId } from "@/lib/id";
import {
  formatSocialSecurityNumber,
  isStudentProfileComplete,
  STUDENT_DOCUMENT_MAX_BYTES,
  validateStudentRequiredFields,
} from "@/lib/student-profile";
import { cn } from "@/lib/utils";
import { FUNDING_METHOD_OPTIONS, type FundingMethod } from "@/lib/funding-method";
import {
  getStudentFollowUp,
  hasIdentityDocument,
  isConventionSigned,
  isPresenceConfirmedForSession,
} from "@/lib/student-follow-up";
import {
  buildConventionReminderEmail,
  buildConventionToCandidateEmail,
  buildConvocationEmail,
  buildMailtoUrl,
  buildMissingDocumentsReminderEmail,
  buildPresenceConfirmationReminderEmail,
  type ReminderKind,
} from "@/lib/student-reminder-text";
import {
  StudentProfilePrint,
  type StudentProfilePrintMode,
} from "@/components/student-profile-print";

import { formatSiret } from "@/lib/convention-print";
import type { Funder } from "@/lib/funder";
import type { StudentDocument } from "@/lib/types";

const DOCUMENT_PRESETS = [
  { value: "identity", label: "Carte d'identité / passeport" },
  { value: "other", label: "Autre justificatif" },
] as const;

export function StudentProfileClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { state, hydrated, updateStudent } = useFormation();
  const student = state.students.find((s) => s.id === studentId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [profilePrintMode, setProfilePrintMode] =
    React.useState<StudentProfilePrintMode | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [socialSecurityNumber, setSocialSecurityNumber] = React.useState("");
  const [fundingMethod, setFundingMethod] = React.useState<
    FundingMethod | ""
  >("");
  const [funderName, setFunderName] = React.useState("");
  const [funderSiret, setFunderSiret] = React.useState("");
  const [funderEmail, setFunderEmail] = React.useState("");
  const [savedFunders, setSavedFunders] = React.useState<Funder[]>([]);
  const [selectedFunderId, setSelectedFunderId] = React.useState("manual");
  const [sendingReminder, setSendingReminder] =
    React.useState<ReminderKind | null>(null);
  const [docKind, setDocKind] =
    React.useState<(typeof DOCUMENT_PRESETS)[number]["value"]>("identity");
  const [docLabel, setDocLabel] = React.useState("");

  React.useEffect(() => {
    if (!student) return;
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setEmail(student.email ?? "");
    setPhone(student.phone ?? "");
    setCompany(student.company ?? "");
    setSocialSecurityNumber(
      student.socialSecurityNumber
        ? formatSocialSecurityNumber(student.socialSecurityNumber)
        : "",
    );
    setFundingMethod(student.fundingMethod ?? "");
    setFunderName(student.funderName ?? "");
    setFunderSiret(
      student.funderSiret ? formatSiret(student.funderSiret) : "",
    );
    setFunderEmail(student.funderEmail ?? "");
    setSelectedFunderId("manual");
  }, [student]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/funders");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setSavedFunders(data.funders ?? []);
        }
      } catch {
        /* liste optionnelle */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySavedFunder = (funderId: string | null) => {
    if (!funderId) return;
    setSelectedFunderId(funderId);
    if (funderId === "manual") return;
    const funder = savedFunders.find((f) => f.id === funderId);
    if (!funder) return;
    setFunderName(funder.name);
    setFunderSiret(funder.siret ? formatSiret(funder.siret) : "");
    setFunderEmail(funder.email ?? "");
  };

  React.useEffect(() => {
    if (!profilePrintMode) return;
    const reset = () => setProfilePrintMode(null);
    window.addEventListener("afterprint", reset);
    const t = window.setTimeout(() => window.print(), 80);
    return () => {
      window.removeEventListener("afterprint", reset);
      window.clearTimeout(t);
    };
  }, [profilePrintMode]);

  const triggerProfilePrint = (mode: StudentProfilePrintMode) => {
    if (mode === "convention" && student && !student.conventionCreatedAt) {
      updateStudent(student.id, {
        conventionCreatedAt: new Date().toISOString(),
      });
    }
    setProfilePrintMode(mode);
    toast.success(
      mode === "convention"
        ? "Convention prête — choisissez « Enregistrer en PDF » dans la fenêtre d'impression si besoin."
        : "Fiche récapitulative prête — choisissez « Enregistrer en PDF » dans la fenêtre d'impression si besoin.",
    );
  };

  const sessionCount = React.useMemo(
    () => countSessionsPerStudent(state.sessions).get(studentId) ?? 0,
    [state.sessions, studentId],
  );

  const followUp = React.useMemo(() => {
    if (!student) return null;
    return getStudentFollowUp(student, state.sessions);
  }, [student, state.sessions]);

  const conventionSessionStudents = React.useMemo(() => {
    if (!followUp?.upcomingSession) return [];
    const ids = new Set(followUp.upcomingSession.studentIds);
    return state.students.filter((s) => ids.has(s.id));
  }, [followUp?.upcomingSession, state.students]);

  const sendReminder = async (kind: ReminderKind) => {
    if (!student) return;
    setSendingReminder(kind);
    try {
      const res = await fetch(`/api/students/${student.id}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: kind }),
      });
      const data = (await res.json()) as {
        error?: string;
        sent?: boolean;
        to?: string;
        subject?: string;
        text?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Envoi impossible.");
        return;
      }
      if (data.sent) {
        toast.success("E-mail de relance envoyé.");
        if (kind === "convention_candidate") {
          triggerProfilePrint("convention");
        }
        return;
      }
      if (data.to && data.subject && data.text) {
        window.location.href = buildMailtoUrl(data.to, data.subject, data.text);
        toast.message(
          "Serveur mail non configuré — votre client mail s'ouvre avec le message pré-rempli.",
        );
        if (kind === "convention_candidate") {
          window.setTimeout(() => triggerProfilePrint("convention"), 500);
        }
      }
    } catch {
      toast.error("Envoi impossible.");
    } finally {
      setSendingReminder(null);
    }
  };

  const copyReminderText = async (kind: ReminderKind) => {
    if (!student || !followUp) return;
    const org = state.organizationName;
    let text = "";
    if (kind === "convention") {
      text = buildConventionReminderEmail({ student, organizationName: org }).text;
    } else if (kind === "convention_candidate") {
      text = buildConventionToCandidateEmail({
        student,
        organizationName: org,
      }).text;
    } else if (kind === "documents") {
      const missing = followUp.items
        .filter((i) => !i.ok && i.id !== "convention" && i.id !== "presence")
        .map((i) => i.label);
      if (!hasIdentityDocument(student)) {
        missing.unshift("Pièce d'identité (carte d'identité ou passeport)");
      }
      text = buildMissingDocumentsReminderEmail({
        student,
        organizationName: org,
        missingLabels: [...new Set(missing)],
      }).text;
    } else if (followUp.upcomingSession && kind === "presence") {
      text = buildPresenceConfirmationReminderEmail({
        student,
        session: followUp.upcomingSession,
        organizationName: org,
      }).text;
    } else if (followUp.upcomingSession && kind === "convocation") {
      text = buildConvocationEmail({
        student,
        session: followUp.upcomingSession,
        organizationName: org,
      }).text;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texte de relance copié.");
    } catch {
      toast.error("Impossible de copier le texte.");
    }
  };

  const toggleConventionSigned = () => {
    if (!student) return;
    if (isConventionSigned(student)) {
      updateStudent(student.id, { conventionSignedAt: undefined });
      toast.success("Convention marquée comme non signée.");
      return;
    }
    updateStudent(student.id, {
      conventionSignedAt: new Date().toISOString(),
    });
    toast.success("Convention marquée comme signée.");
  };

  const togglePresenceConfirmed = () => {
    if (!student || !followUp?.upcomingSession) return;
    const sessionId = followUp.upcomingSession.id;
    if (isPresenceConfirmedForSession(student, sessionId)) {
      updateStudent(student.id, { presenceConfirmedForSessionId: undefined });
      toast.success("Présence marquée comme non confirmée.");
      return;
    }
    updateStudent(student.id, { presenceConfirmedForSessionId: sessionId });
    toast.success("Présence confirmée pour la prochaine session.");
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const err = validateStudentRequiredFields({
      firstName,
      lastName,
      email,
      socialSecurityNumber,
    });
    if (err) {
      toast.error(err);
      return;
    }
    updateStudent(student.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      socialSecurityNumber: socialSecurityNumber.replace(/\s/g, ""),
      fundingMethod: fundingMethod || undefined,
      funderName: funderName.trim() || undefined,
      funderSiret: funderSiret.replace(/\s/g, "") || undefined,
      funderEmail: funderEmail.trim() || undefined,
    });
    toast.success("Fiche candidat enregistrée.");
  };

  const onPickDocument = () => {
    fileInputRef.current?.click();
  };

  const onDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !student) return;

    if (file.size > STUDENT_DOCUMENT_MAX_BYTES) {
      toast.error("Fichier trop volumineux (4 Mo maximum par document).");
      return;
    }

    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) {
      toast.error("Formats acceptés : images (JPG, PNG…) ou PDF.");
      return;
    }

    const preset = DOCUMENT_PRESETS.find((p) => p.value === docKind);
    const label =
      docKind === "other"
        ? docLabel.trim() || "Autre justificatif"
        : (preset?.label ?? "Carte d'identité / passeport");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const doc: StudentDocument = {
        id: newId(),
        label,
        kind: docKind,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      updateStudent(student.id, {
        documents: [...(student.documents ?? []), doc],
      });
      setDocLabel("");
      toast.success("Document ajouté à la fiche.");
    };
    reader.onerror = () => toast.error("Impossible de lire ce fichier.");
    reader.readAsDataURL(file);
  };

  const removeDocument = (docId: string) => {
    if (!student) return;
    updateStudent(student.id, {
      documents: (student.documents ?? []).filter((d) => d.id !== docId),
    });
    toast.success("Document retiré.");
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">Cette fiche candidat est introuvable.</p>
        <Link
          href="/eleves"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          <ArrowLeft className="size-4" />
          Retour à l&apos;annuaire
        </Link>
      </div>
    );
  }

  const profileComplete = isStudentProfileComplete(student);

  return (
    <div
      className="space-y-10"
      data-profile-print-mode={profilePrintMode ?? "none"}
    >
      <PageHeader
        eyebrow="Fiche candidat"
        title={
          <>
            {student.firstName} {student.lastName}
            {!profileComplete ? (
              <Badge
                variant="outline"
                className="ml-3 align-middle text-xs font-normal text-amber-800 dark:text-amber-200"
              >
                Incomplète
              </Badge>
            ) : null}
          </>
        }
        description={`Coordonnées, financement, numéro de sécurité sociale (CPF / Heliopie) et justificatifs d'inscription. Présent sur ${sessionCount} feuille${sessionCount > 1 ? "s" : ""}.`}
        actions={
          <Link
            href="/eleves"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 rounded-full",
            )}
          >
            <ArrowLeft className="size-4" />
            Annuaire
          </Link>
        }
      />

      <form onSubmit={onSave} className="space-y-8">
        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="font-heading text-lg">Informations obligatoires</CardTitle>
            <CardDescription>
              E-mail et numéro de sécurité sociale requis pour préparer les dossiers CPF.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-fn">Prénom</Label>
              <Input
                id="profile-fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-ln">Nom</Label>
              <Input
                id="profile-ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="profile-em">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="profile-ssn">
                Numéro de sécurité sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-ssn"
                value={socialSecurityNumber}
                onChange={(e) => setSocialSecurityNumber(e.target.value)}
                placeholder="ex. 1 85 08 75 115 123 45"
                required
                inputMode="numeric"
                className="bg-background/80 font-mono tracking-wide"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="font-heading text-lg">Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-ph">Téléphone</Label>
              <Input
                id="profile-ph"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-co">Structure / employeur</Label>
              <Input
                id="profile-co"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="profile-funding">Moyen de financement</Label>
              <Select
                value={fundingMethod || "none"}
                onValueChange={(v) =>
                  setFundingMethod(v === "none" ? "" : (v as FundingMethod))
                }
              >
                <SelectTrigger id="profile-funding" className="bg-background/80">
                  <SelectValue placeholder="Choisir un financement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non renseigné</SelectItem>
                  {FUNDING_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {savedFunders.length > 0 ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="profile-funder-preset">Financeur enregistré</Label>
                <Select value={selectedFunderId} onValueChange={applySavedFunder}>
                  <SelectTrigger
                    id="profile-funder-preset"
                    className="bg-background/80"
                  >
                    <SelectValue placeholder="Choisir un financeur enregistré" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Saisie manuelle</SelectItem>
                    {savedFunders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choisissez un financeur déjà enregistré dans l&apos;administration
                  pour remplir automatiquement nom, SIRET et e-mail.
                </p>
              </div>
            ) : null}
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="profile-funder-name">Nom du financeur</Label>
              <Input
                id="profile-funder-name"
                value={funderName}
                onChange={(e) => setFunderName(e.target.value)}
                placeholder="ex. OPCO Atlas, Entreprise XYZ"
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-funder-siret">N° SIRET du financeur</Label>
              <Input
                id="profile-funder-siret"
                value={funderSiret}
                onChange={(e) => setFunderSiret(e.target.value)}
                placeholder="ex. 123 456 789 00012"
                inputMode="numeric"
                className="bg-background/80 font-mono tracking-wide"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-funder-em">E-mail du financeur</Label>
              <Input
                id="profile-funder-em"
                type="email"
                value={funderEmail}
                onChange={(e) => setFunderEmail(e.target.value)}
                placeholder="ex. contact@opco.fr"
                className="bg-background/80"
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Ces informations apparaissent sur la convention imprimée. L&apos;e-mail
              sert aussi à la relance si la convention n&apos;est pas signée.
            </p>
          </CardContent>
        </Card>

        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Mail className="size-5 text-indigo-600 dark:text-violet-300" />
              Suivi dossier &amp; relances
            </CardTitle>
            <CardDescription>
              État du dossier d&apos;inscription, création de la convention
              depuis cette fiche, et envoi de rappels par e-mail (convocation,
              documents manquants, confirmation de présence).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {followUp ? (
              <ul className="space-y-2">
                {followUp.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 dark:border-white/10"
                  >
                    {item.ok ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          item.ok ? "text-emerald-900 dark:text-emerald-100" : "",
                        )}
                      >
                        {item.label}
                      </p>
                      {!item.ok ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.id === "convention"
                            ? "Créez la convention ci-dessous, puis faites-la signer"
                            : "Action requise"}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => triggerProfilePrint("convention")}
              >
                <FileText className="size-4" />
                Créer la convention
              </Button>
              <Button
                type="button"
                variant={isConventionSigned(student) ? "secondary" : "outline"}
                className="gap-2 rounded-full"
                onClick={toggleConventionSigned}
              >
                <CheckCircle2 className="size-4" />
                {isConventionSigned(student)
                  ? "Convention signée"
                  : "Marquer convention signée"}
              </Button>
              {followUp?.upcomingSession ? (
                <Button
                  type="button"
                  variant={
                    isPresenceConfirmedForSession(
                      student,
                      followUp.upcomingSession.id,
                    )
                      ? "secondary"
                      : "outline"
                  }
                  className="gap-2 rounded-full"
                  onClick={togglePresenceConfirmed}
                >
                  <CheckCircle2 className="size-4" />
                  {isPresenceConfirmedForSession(
                    student,
                    followUp.upcomingSession.id,
                  )
                    ? "Présence confirmée"
                    : "Confirmer la présence"}
                </Button>
              ) : null}
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4 dark:border-white/10">
              <p className="font-heading text-sm font-semibold">Relances e-mail</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  disabled={
                    sendingReminder === "convention" ||
                    isConventionSigned(student) ||
                    !funderEmail.trim()
                  }
                  onClick={() => sendReminder("convention")}
                >
                  <Mail className="size-4" />
                  {sendingReminder === "convention"
                    ? "Envoi…"
                    : "Relancer le financeur (convention)"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  disabled={
                    sendingReminder === "convention_candidate" ||
                    !student.email?.trim()
                  }
                  onClick={() => sendReminder("convention_candidate")}
                >
                  <Mail className="size-4" />
                  {sendingReminder === "convention_candidate"
                    ? "Envoi…"
                    : "Envoyer la convention au candidat"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  disabled={sendingReminder === "documents"}
                  onClick={() => sendReminder("documents")}
                >
                  <Mail className="size-4" />
                  {sendingReminder === "documents"
                    ? "Envoi…"
                    : "Relancer documents manquants"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  disabled={
                    sendingReminder === "presence" || !followUp?.upcomingSession
                  }
                  onClick={() => sendReminder("presence")}
                >
                  <Mail className="size-4" />
                  {sendingReminder === "presence"
                    ? "Envoi…"
                    : "Demander confirmation de présence"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  disabled={
                    sendingReminder === "convocation" ||
                    !followUp?.upcomingSession ||
                    !student.email?.trim()
                  }
                  onClick={() => sendReminder("convocation")}
                >
                  <Mail className="size-4" />
                  {sendingReminder === "convocation"
                    ? "Envoi…"
                    : "Envoyer la convocation"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Si le serveur mail n&apos;est pas configuré, votre client mail
                s&apos;ouvrira avec le message pré-rempli. Pour la convention
                candidat, le document s&apos;imprime aussi pour l&apos;ajouter en
                pièce jointe. Vous pouvez aussi copier le texte ci-dessous.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => copyReminderText("convention")}
                >
                  Copier texte convention
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => copyReminderText("convention_candidate")}
                >
                  Copier texte convention candidat
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => copyReminderText("documents")}
                >
                  Copier texte documents
                </Button>
                {followUp?.upcomingSession ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => copyReminderText("convocation")}
                    >
                      Copier texte convocation
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => copyReminderText("presence")}
                    >
                      Copier texte présence
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Printer className="size-5 text-indigo-600 dark:text-violet-300" />
              Documents administratifs
            </CardTitle>
            <CardDescription>
              Imprimez ou enregistrez en PDF la convention de formation ou la
              fiche récapitulative (moyen de financement inclus). Le bouton
              « Créer la convention » est aussi disponible dans le suivi dossier
              ci-dessus.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => triggerProfilePrint("convention")}
            >
              <Printer className="size-4" />
              Imprimer la convention
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => triggerProfilePrint("recap")}
            >
              <Printer className="size-4" />
              Fiche récapitulative
            </Button>
          </CardContent>
        </Card>

        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <IdCard className="size-5 text-indigo-600 dark:text-violet-300" />
              Documents d&apos;inscription
            </CardTitle>
            <CardDescription>
              Carte d&apos;identité, passeport ou autres pièces nécessaires à l&apos;inscription
              (images ou PDF, 4 Mo max).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {(student.documents ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Aucun document pour l&apos;instant.
              </p>
            ) : (
              <ul className="space-y-3">
                {(student.documents ?? []).map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        {doc.label}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {doc.fileName} ·{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={doc.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "gap-1.5 rounded-full",
                        )}
                      >
                        <ExternalLink className="size-3.5" />
                        Ouvrir
                      </a>
                      <a
                        href={doc.dataUrl}
                        download={doc.fileName}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "gap-1.5 rounded-full",
                        )}
                      >
                        <Download className="size-3.5" />
                        Télécharger
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <Trash2 className="size-3.5" />
                        Retirer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-xl border border-border/70 bg-background/50 p-4 dark:border-white/10">
              <p className="mb-3 font-heading text-sm font-semibold">Ajouter un document</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="doc-kind">Type de document</Label>
                  <Select
                    value={docKind}
                    onValueChange={(v) =>
                      setDocKind(v as (typeof DOCUMENT_PRESETS)[number]["value"])
                    }
                  >
                    <SelectTrigger id="doc-kind" className="bg-background/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {docKind === "other" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="doc-label">Libellé</Label>
                    <Input
                      id="doc-label"
                      value={docLabel}
                      onChange={(e) => setDocLabel(e.target.value)}
                      placeholder="ex. Justificatif de domicile"
                      className="bg-background/80"
                    />
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 gap-2 rounded-full"
                onClick={onPickDocument}
              >
                <Upload className="size-4" />
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={onDocumentSelected}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="btn-gradient rounded-full px-8">
            Enregistrer la fiche
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/eleves")}
          >
            Retour à l&apos;annuaire
          </Button>
        </div>
      </form>

      {profilePrintMode ? (
        <StudentProfilePrint
          mode={profilePrintMode}
          organizationName={state.organizationName}
          student={student}
          session={followUp?.upcomingSession}
          sessionStudents={conventionSessionStudents}
        />
      ) : null}
    </div>
  );
}
