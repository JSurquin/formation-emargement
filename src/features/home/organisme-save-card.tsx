"use client";

import * as React from "react";
import { Download, FileDown, GitMerge, History, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import { useConfirm } from "@/components/confirm-provider";
import { Button } from "@/components/ui/button";
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
  buildExportPayload,
  parseAppStateImport,
  parseSessionJsonBundle,
} from "@/lib/app-state-io";
import {
  clearEmergencySnapshot,
  loadEmergencySnapshot,
  saveEmergencySnapshot,
} from "@/lib/emergency-snapshot";
import { exportSessionsInventoryCsv } from "@/lib/export-csv";
import {
  formatStorageSize,
  getFormationStorageByteSize,
} from "@/lib/formation-storage-size";
import { postponeBackupNudge } from "@/lib/backup-nudge";

export function OrganismeSaveCard() {
  const {
    state,
    hydrated,
    setOrganizationName,
    importAppState,
    importAppStateMerge,
    importSessionBundle,
    removeSessionTemplate,
  } = useFormation();
  const confirm = useConfirm();
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const importMergeInputRef = React.useRef<HTMLInputElement>(null);
  const importSessionBundleInputRef = React.useRef<HTMLInputElement>(null);

  const emergencySnap = React.useMemo(
    () => (hydrated ? loadEmergencySnapshot() : null),
    [hydrated, state],
  );

  const exportJson = () => {
    const payload = buildExportPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formation-emargement-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON téléchargé.");
    postponeBackupNudge();
  };

  const onImportPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const next = parseAppStateImport(parsed);
        if (!next) {
          toast.error("Fichier non reconnu ou incomplet.");
          return;
        }
        const ok = await confirm({
          title: "Remplacer toutes les données ?",
          description:
            "Les élèves et sessions locaux seront remplacés par ce fichier.",
          confirmLabel: "Remplacer",
          variant: "destructive",
        });
        if (!ok) {
          e.target.value = "";
          return;
        }
        saveEmergencySnapshot(state);
        importAppState(next);
        toast.success("Données importées.");
      } catch {
        toast.error("Impossible de lire ce JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const onImportMergePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const next = parseAppStateImport(parsed);
        if (!next) {
          toast.error("Fichier non reconnu ou incomplet.");
          e.target.value = "";
          return;
        }
        const ok = await confirm({
          title: "Fusionner avec les données locales ?",
          description:
            "Les élèves existants (même id) seront mis à jour ; les sessions en conflit d’id seront dupliquées avec le suffixe « (import) ».",
          confirmLabel: "Fusionner",
        });
        if (!ok) {
          e.target.value = "";
          return;
        }
        importAppStateMerge(next);
        toast.success("Fusion terminée.");
      } catch {
        toast.error("Impossible de lire ce JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const onImportSessionBundlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const bundle = parseSessionJsonBundle(parsed);
        if (!bundle) {
          toast.error(
            "Fichier non reconnu : attendu un export JSON « une session » (version 1).",
          );
          e.target.value = "";
          return;
        }
        const ok = await confirm({
          title: `Importer « ${bundle.session.title} » ?`,
          description:
            "Les fiches élèves du fichier seront fusionnées dans l’annuaire ; une nouvelle feuille sera créée.",
          confirmLabel: "Importer",
        });
        if (!ok) {
          e.target.value = "";
          return;
        }
        importSessionBundle(bundle);
        toast.success("Session importée (nouvelle feuille en tête de liste).");
      } catch {
        toast.error("Impossible de lire ce JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const restoreEmergencySnapshot = React.useCallback(async () => {
    const snap = loadEmergencySnapshot();
    if (!snap) {
      toast.error("Aucune sauvegarde de secours disponible.");
      return;
    }
    const when = new Date(snap.savedAt).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const ok = await confirm({
      title: "Restaurer la sauvegarde de secours ?",
      description: `Remplacer les données actuelles par la copie du ${when} (avant le dernier import « Remplacer »).`,
      confirmLabel: "Restaurer",
      variant: "destructive",
    });
    if (!ok) return;
    const next = parseAppStateImport(snap.state);
    if (!next) {
      toast.error("La sauvegarde de secours est illisible.");
      return;
    }
    importAppState(next);
    clearEmergencySnapshot();
    toast.success("Sauvegarde de secours restaurée.");
  }, [confirm, importAppState]);

  return (
    <Card id="sauvegarde-donnees" className="dg-surface scroll-mt-24 ring-0">
      <CardHeader className="border-b border-border/50 dark:border-white/10">
        <CardTitle className="font-heading text-lg">
          Organisme & sauvegarde
        </CardTitle>
        <CardDescription>
          Sans base de données : tout reste dans le navigateur. Remplacer efface
          tout ; fusionner combine les exports (sessions en conflit
          d’identifiant sont dupliquées). Vous pouvez aussi importer un fichier
          JSON « une session » exporté depuis une feuille.
        </CardDescription>
        {hydrated ? (
          <p className="text-xs text-muted-foreground">
            Espace local approximatif :{" "}
            <span className="font-mono tabular-nums">
              {formatStorageSize(getFormationStorageByteSize())}
            </span>{" "}
            (sauvegarde JSON dans ce navigateur).
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid min-w-[200px] flex-1 gap-2">
          <Label htmlFor="org-name">Nom affiché (impression / export)</Label>
          <Input
            id="org-name"
            value={state.organizationName ?? ""}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="ex. Mon organisme de formation"
            className="bg-background/80"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={exportJson}
          >
            <Download className="size-4" />
            Exporter JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            disabled={state.sessions.length === 0}
            onClick={() => {
              exportSessionsInventoryCsv(
                state.sessions,
                `inventaire-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
              );
              toast.success("Inventaire des sessions (CSV) téléchargé.");
            }}
          >
            <FileDown className="size-4" />
            CSV inventaire
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Remplacer (import)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => importMergeInputRef.current?.click()}
          >
            <GitMerge className="size-4" />
            Fusionner
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => importSessionBundleInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Importer session (JSON)
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onImportPick}
          />
          <input
            ref={importMergeInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onImportMergePick}
          />
          <input
            ref={importSessionBundleInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onImportSessionBundlePick}
          />
        </div>
        {emergencySnap ? (
          <div className="flex w-full flex-col gap-3 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] p-4 dark:border-amber-400/25 dark:bg-amber-950/30">
            <p className="text-sm text-foreground">
              <span className="font-medium">Sauvegarde de secours</span> — un
              cliché de vos données a été enregistré avant le dernier import «
              Remplacer » (
              {new Date(emergencySnap.savedAt).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              ).
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit gap-2 rounded-full border-amber-600/40 bg-background/80 hover:bg-amber-500/10 dark:border-amber-400/35"
              onClick={() => void restoreEmergencySnapshot()}
            >
              <History className="size-4" />
              Restaurer cette sauvegarde
            </Button>
          </div>
        ) : null}
        {(state.sessionTemplates ?? []).length > 0 ? (
          <div className="border-t border-border/50 pt-4 dark:border-white/10">
            <p className="mb-2 text-sm font-medium text-foreground">
              Modèles de groupe (création de session)
            </p>
            <ul className="flex flex-wrap gap-2">
              {(state.sessionTemplates ?? []).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/30 py-1 pl-3 pr-1 text-xs dark:border-white/10"
                >
                  <span>
                    {t.name}
                    <span className="text-muted-foreground">
                      {" "}
                      · {t.studentIds.length} élève
                      {t.studentIds.length > 1 ? "s" : ""}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer le modèle ${t.name}`}
                    onClick={() => {
                      removeSessionTemplate(t.id);
                      toast.success("Modèle supprimé.");
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
