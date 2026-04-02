"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Contact,
  Copy,
  Download,
  FileJson,
  Mail,
  Pencil,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { filterStudentsByQuery } from "@/lib/student-search";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import { cn } from "@/lib/utils";
import { exportStudentsCsv } from "@/lib/export-csv";
import { downloadStudentVcard } from "@/lib/export-vcard";
import { downloadStudentsJson } from "@/lib/export-students-json";
import { parseStudentsCsv } from "@/lib/import-students-csv";
import { parseStudentsJsonArray } from "@/lib/import-students-json";
import { countSessionsPerStudent } from "@/lib/student-session-counts";
import type { Student } from "@/lib/types";

function initials(first: string, last: string) {
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

export default function ElevesPage() {
  const {
    state,
    hydrated,
    addStudent,
    updateStudent,
    removeStudent,
    duplicateStudent,
  } = useFormation();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [qAnnuaire, setQAnnuaire] = React.useState("");
  const [editOpen, setEditOpen] = React.useState(false);
  const [editStudent, setEditStudent] = React.useState<Student | null>(null);
  const [efn, setEfn] = React.useState("");
  const [eln, setEln] = React.useState("");
  const [eem, setEem] = React.useState("");
  const [eph, setEph] = React.useState("");
  const [eco, setEco] = React.useState("");
  const importStudentsCsvRef = React.useRef<HTMLInputElement>(null);
  const importStudentsJsonRef = React.useRef<HTMLInputElement>(null);

  const studentsFiltered = React.useMemo(
    () => filterStudentsByQuery(state.students, qAnnuaire),
    [state.students, qAnnuaire],
  );

  const sessionCountByStudent = React.useMemo(
    () => countSessionsPerStudent(state.sessions),
    [state.sessions],
  );

  React.useEffect(() => {
    if (!editStudent) return;
    setEfn(editStudent.firstName);
    setEln(editStudent.lastName);
    setEem(editStudent.email ?? "");
    setEph(editStudent.phone ?? "");
    setEco(editStudent.company ?? "");
  }, [editStudent]);

  useSlashFocus("annuaire-search", hydrated);

  const onImportStudentsCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseStudentsCsv(String(reader.result));
        if (!rows) {
          toast.error(
            "CSV non reconnu : première ligne = en-têtes avec colonnes prénom et nom (ex. prénom;nom;email).",
          );
          e.target.value = "";
          return;
        }
        for (const r of rows) {
          addStudent(r);
        }
        toast.success(`${rows.length} élève(s) importé(s) dans l’annuaire.`);
      } catch {
        toast.error("Impossible de lire ce fichier.");
      }
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const onImportStudentsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const rows = parseStudentsJsonArray(parsed);
        if (!rows) {
          toast.error(
            "JSON non reconnu : attendu un tableau de fiches ou { « students » : [ … ] } avec prénom et nom.",
          );
          e.target.value = "";
          return;
        }
        for (const r of rows) {
          addStudent(r);
        }
        toast.success(`${rows.length} fiche(s) importée(s) dans l’annuaire.`);
      } catch {
        toast.error("Impossible de lire ce JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Prénom et nom sont obligatoires.");
      return;
    }
    addStudent({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
    });
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCompany("");
    toast.success("Élève ajouté.");
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setEditOpen(true);
  };

  const onEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!efn.trim() || !eln.trim()) {
      toast.error("Prénom et nom sont obligatoires.");
      return;
    }
    updateStudent(editStudent.id, {
      firstName: efn.trim(),
      lastName: eln.trim(),
      email: eem.trim() || undefined,
      phone: eph.trim() || undefined,
      company: eco.trim() || undefined,
    });
    setEditOpen(false);
    setEditStudent(null);
    toast.success("Fiche mise à jour.");
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Annuaire"
        title={
          <>
            Vos <GradientAccent>élèves</GradientAccent>
          </>
        }
        description="Carnet global de vos stagiaires. Chaque session a sa propre liste : vous choisissez qui y est inclus à la création ou depuis la feuille d’émargement. Touche / pour la recherche. Import CSV : en-têtes prénom, nom ; optionnel : email, téléphone, société (séparateur , ou ;). Import JSON : tableau de fiches ou objet { « students » } (mêmes champs que l’export annuaire)."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {state.students.length > 0 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  onClick={() => {
                    exportStudentsCsv(
                      state.students,
                      `annuaire-${new Date().toISOString().slice(0, 10)}.csv`,
                    );
                    toast.success("Export CSV de l’annuaire téléchargé.");
                  }}
                >
                  <Download className="size-4" />
                  CSV annuaire
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  onClick={() => {
                    const list = qAnnuaire.trim()
                      ? studentsFiltered
                      : state.students;
                    const tag = qAnnuaire.trim()
                      ? `annuaire-filtre-${new Date().toISOString().slice(0, 10)}`
                      : `annuaire-${new Date().toISOString().slice(0, 10)}`;
                    downloadStudentsJson(list, tag);
                    toast.success(
                      qAnnuaire.trim()
                        ? `JSON téléchargé (${list.length} fiche(s) dans la recherche).`
                        : "JSON de l’annuaire téléchargé.",
                    );
                  }}
                >
                  <FileJson className="size-4" />
                  JSON{qAnnuaire.trim() ? " (vue)" : ""}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  onClick={async () => {
                    const list = qAnnuaire.trim()
                      ? studentsFiltered
                      : state.students;
                    const emails = list
                      .map((s) => s.email?.trim())
                      .filter(Boolean) as string[];
                    if (emails.length === 0) {
                      toast.error(
                        "Aucun e-mail dans la liste affichée (ou filtre trop restrictif).",
                      );
                      return;
                    }
                    try {
                      await navigator.clipboard.writeText(emails.join("; "));
                      toast.success(
                        `${emails.length} adresse(s) copiée(s) (séparateur ;).`,
                      );
                    } catch {
                      toast.error("Impossible de copier.");
                    }
                  }}
                >
                  <Mail className="size-4" />
                  Copier e-mails
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => importStudentsCsvRef.current?.click()}
            >
              <Upload className="size-4" />
              Importer CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => importStudentsJsonRef.current?.click()}
            >
              <Upload className="size-4" />
              Importer JSON
            </Button>
            <input
              ref={importStudentsCsvRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={onImportStudentsCsv}
            />
            <input
              ref={importStudentsJsonRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={onImportStudentsJson}
            />
          </div>
        }
      />

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <UserPlus className="size-4" />
            </span>
            Ajouter un élève
          </CardTitle>
          <CardDescription className="text-base">
            Les nouveaux profils seront disponibles pour les ajouter aux
            sessions (case à cocher ou bouton sur la feuille).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid flex-1 gap-2 sm:min-w-[140px]">
                <Label htmlFor="fn">Prénom</Label>
                <Input
                  id="fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="bg-background/80"
                />
              </div>
              <div className="grid flex-1 gap-2 sm:min-w-[140px]">
                <Label htmlFor="ln">Nom</Label>
                <Input
                  id="ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="bg-background/80"
                />
              </div>
              <div className="grid min-w-0 flex-[2] gap-2 sm:min-w-[200px]">
                <Label htmlFor="em">E-mail (optionnel)</Label>
                <Input
                  id="em"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-background/80"
                />
              </div>
              <Button
                type="submit"
                className="btn-gradient h-10 w-full rounded-full sm:w-auto sm:px-8"
              >
                Ajouter
              </Button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid min-w-0 flex-1 gap-2 sm:min-w-[180px]">
                <Label htmlFor="ph">Téléphone (optionnel)</Label>
                <Input
                  id="ph"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="bg-background/80"
                />
              </div>
              <div className="grid min-w-0 flex-[2] gap-2 sm:min-w-[220px]">
                <Label htmlFor="co">Structure / employeur (optionnel)</Label>
                <Input
                  id="co"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ex. ACME SAS"
                  className="bg-background/80"
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="dg-surface overflow-hidden ring-0">
        <CardHeader className="space-y-4 border-b border-border/50 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Liste — {state.students.length}{" "}
            {state.students.length > 1 ? "personnes" : "personne"}
            {qAnnuaire.trim() ? (
              <span className="block text-sm font-normal text-muted-foreground">
                {studentsFiltered.length} résultat
                {studentsFiltered.length > 1 ? "s" : ""} affiché
                {studentsFiltered.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </CardTitle>
          {state.students.length > 0 ? (
            <ParticipantSearchInput
              id="annuaire-search"
              value={qAnnuaire}
              onChange={setQAnnuaire}
              placeholder="Rechercher dans l’annuaire…"
              aria-label="Rechercher un élève dans l’annuaire"
            />
          ) : null}
        </CardHeader>
        <CardContent className="p-0 sm:px-0">
          {state.students.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun élève pour l&apos;instant. Utilisez le formulaire ci-dessus.
            </p>
          ) : studentsFiltered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            <div className="dg-table-scroll border-t border-border/80 dark:border-white/10">
              <Table className="min-w-[34rem]">
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent dark:border-white/10">
                  <TableHead className="w-14 pl-6" />
                  <TableHead className="font-heading">Identité</TableHead>
                  <TableHead className="hidden w-20 text-center font-heading sm:table-cell">
                    Feuilles
                  </TableHead>
                  <TableHead className="hidden font-heading md:table-cell">
                    Coordonnées
                  </TableHead>
                  <TableHead className="w-32 pr-6 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsFiltered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-border/50 transition-colors hover:bg-muted/40 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <TableCell className="pl-6">
                      <Avatar className="size-9 ring-2 ring-indigo-200/60 dark:ring-violet-500/30">
                        <AvatarFallback
                          className={cn(
                            "font-heading text-xs font-semibold text-white",
                            "bg-gradient-to-br from-indigo-500 to-violet-600",
                          )}
                        >
                          {initials(s.firstName, s.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <span className="font-medium">
                        {s.firstName} {s.lastName}
                      </span>
                      {s.company ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {s.company}
                        </span>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground md:hidden">
                        {s.email ?? "—"}
                        {s.phone ? (
                          <span className="mt-0.5 block">{s.phone}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                        Sur{" "}
                        <span className="font-medium tabular-nums">
                          {sessionCountByStudent.get(s.id) ?? 0}
                        </span>{" "}
                        feuille
                        {(sessionCountByStudent.get(s.id) ?? 0) > 1 ? "s" : ""}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-center tabular-nums text-muted-foreground sm:table-cell">
                      {sessionCountByStudent.get(s.id) ?? 0}
                    </TableCell>
                    <TableCell className="hidden max-w-[260px] md:table-cell">
                      <span className="block truncate text-muted-foreground">
                        {s.email ?? "—"}
                      </span>
                      {s.phone ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {s.phone}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:bg-muted"
                          aria-label={`Télécharger la fiche vCard de ${s.firstName} ${s.lastName}`}
                          onClick={() => {
                            downloadStudentVcard(s);
                            toast.success("Fichier .vcf téléchargé.");
                          }}
                        >
                          <Contact className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:bg-muted"
                          aria-label={`Modifier ${s.firstName} ${s.lastName}`}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-violet-500/20 dark:hover:text-violet-100"
                          aria-label={`Dupliquer ${s.firstName} ${s.lastName}`}
                          onClick={() => {
                            duplicateStudent(s.id);
                            toast.success(
                              "Fiche dupliquée — pensez à l’ajouter aux sessions si besoin.",
                            );
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Retirer ${s.firstName} ${s.lastName}`}
                          onClick={() => removeStudent(s.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditStudent(null);
        }}
      >
        <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
          <form onSubmit={onEditSave}>
            <DialogHeader>
              <DialogTitle className="font-heading text-lg">
                Modifier la fiche
              </DialogTitle>
              <DialogDescription>
                Les changements s’appliquent à l’annuaire et aux exports ; les
                sessions existantes gardent le lien par identifiant élève.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fn">Prénom</Label>
                  <Input
                    id="edit-fn"
                    value={efn}
                    onChange={(e) => setEfn(e.target.value)}
                    className="bg-background/80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-ln">Nom</Label>
                  <Input
                    id="edit-ln"
                    value={eln}
                    onChange={(e) => setEln(e.target.value)}
                    className="bg-background/80"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-em">E-mail</Label>
                <Input
                  id="edit-em"
                  type="email"
                  value={eem}
                  onChange={(e) => setEem(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ph">Téléphone</Label>
                <Input
                  id="edit-ph"
                  type="tel"
                  value={eph}
                  onChange={(e) => setEph(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-co">Structure / employeur</Label>
                <Input
                  id="edit-co"
                  value={eco}
                  onChange={(e) => setEco(e.target.value)}
                  className="bg-background/80"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-gradient">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
