"use client";

import type { Student } from "@/lib/types";
import { getFundingMethodLabel } from "@/lib/funding-method";
import { formatSocialSecurityNumber } from "@/lib/student-profile";
import { formatAttestationIssueDate } from "@/lib/training-attestation";

export type StudentProfilePrintMode = "convention" | "recap";

type StudentProfilePrintProps = {
  mode: StudentProfilePrintMode;
  organizationName?: string;
  student: Student;
  issueDate?: string;
};

function FieldRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <tr>
      <th className="w-[38%] border border-black px-3 py-2 text-left align-top font-semibold">
        {label}
      </th>
      <td className="border border-black px-3 py-2 align-top">{value}</td>
    </tr>
  );
}

export function StudentProfilePrint({
  mode,
  organizationName,
  student,
  issueDate = formatAttestationIssueDate(),
}: StudentProfilePrintProps) {
  const orgLabel = organizationName?.trim() || "L'organisme de formation";
  const fundingLabel = getFundingMethodLabel(student.fundingMethod);
  const ssn = student.socialSecurityNumber
    ? formatSocialSecurityNumber(student.socialSecurityNumber)
    : undefined;

  if (mode === "convention") {
    return (
      <div className="print-profile-convention hidden print:block">
        <header className="mb-8 border-b-2 border-black pb-4 text-center">
          {organizationName?.trim() ? (
            <p className="text-lg font-bold tracking-tight">
              {organizationName.trim()}
            </p>
          ) : null}
          <h1 className="mt-4 text-2xl font-bold uppercase tracking-wide">
            Convention de formation
          </h1>
        </header>

        <div className="space-y-6 text-[15px] leading-relaxed text-neutral-900">
          <p>
            La présente convention est conclue entre{" "}
            <span className="font-semibold">{orgLabel}</span>, organisme de
            formation, et le stagiaire ci-dessous désigné.
          </p>

          <p className="text-center text-xl font-bold">
            {student.firstName} {student.lastName.toUpperCase()}
          </p>

          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <FieldRow label="E-mail" value={student.email} />
              <FieldRow label="Téléphone" value={student.phone} />
              <FieldRow label="Structure / employeur" value={student.company} />
              <FieldRow label="N° sécurité sociale" value={ssn} />
              <FieldRow
                label="Moyen de financement"
                value={fundingLabel ?? "Non renseigné"}
              />
            </tbody>
          </table>

          <p>
            Le stagiaire déclare suivre la formation dans le cadre du financement
            indiqué ci-dessus. Les modalités pédagogiques, le programme et les
            dates seront précisés sur la feuille de session ou le contrat
            complémentaire.
          </p>

          <p>
            Les parties reconnaissent avoir pris connaissance des conditions
            générales de formation et s&apos;engagent à respecter les obligations
            légales en vigueur, notamment en matière de présence et
            d&apos;émargement.
          </p>

          <p className="pt-2">Fait pour servir et valoir ce que de droit.</p>
        </div>

        <footer className="mt-16 flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div className="text-sm text-neutral-700">
            <p>Le {issueDate}</p>
            <p className="mt-8 font-medium">Signature du stagiaire :</p>
            <div className="mt-16 border-t border-neutral-400 pt-2 text-xs text-neutral-600">
              {student.firstName} {student.lastName}
            </div>
          </div>
          <div className="min-w-[220px] text-sm">
            <p className="mb-16 font-medium">Signature et cachet de l&apos;organisme :</p>
            <div className="border-t border-neutral-400 pt-2 text-xs text-neutral-600">
              {orgLabel}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="print-profile-recap hidden print:block">
      <header className="mb-8 border-b-2 border-black pb-4">
        {organizationName?.trim() ? (
          <p className="text-lg font-bold tracking-tight">
            {organizationName.trim()}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold">Fiche récapitulative candidat</h1>
        <p className="mt-1 text-base font-medium">
          {student.firstName} {student.lastName}
        </p>
        <p className="text-sm text-neutral-700">Établie le {issueDate}</p>
      </header>

      <table className="w-full border-collapse border border-black text-sm">
        <tbody>
          <FieldRow label="Prénom" value={student.firstName} />
          <FieldRow label="Nom" value={student.lastName} />
          <FieldRow label="E-mail" value={student.email} />
          <FieldRow label="Téléphone" value={student.phone} />
          <FieldRow label="Structure / employeur" value={student.company} />
          <FieldRow label="N° sécurité sociale" value={ssn} />
          <FieldRow
            label="Moyen de financement"
            value={fundingLabel ?? "Non renseigné"}
          />
          <FieldRow
            label="Justificatifs joints"
            value={
              (student.documents ?? []).length
                ? (student.documents ?? []).map((d) => d.label).join(", ")
                : "Aucun"
            }
          />
        </tbody>
      </table>

      <p className="mt-10 text-[10px] text-neutral-500">
        Document généré localement — fiche candidat n° {student.id.slice(0, 8)}
      </p>
    </div>
  );
}
