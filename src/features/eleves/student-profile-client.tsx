"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  IdCard,
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
  StudentProfilePrint,
  type StudentProfilePrintMode,
} from "@/components/student-profile-print";

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
  }, [student]);

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
          </CardContent>
        </Card>

        <Card className="dg-surface ring-0">
          <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Printer className="size-5 text-indigo-600 dark:text-violet-300" />
              Documents administratifs
            </CardTitle>
            <CardDescription>
              Imprimez la convention de formation ou la fiche récapitulative avec
              le moyen de financement du candidat.
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
              Convention de formation
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
        />
      ) : null}
    </div>
  );
}
