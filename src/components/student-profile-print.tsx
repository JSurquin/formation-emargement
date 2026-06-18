"use client";

import type { Student, TrainingSession } from "@/lib/types";
import {
  buildConventionParticipantRows,
  formatSiret,
} from "@/lib/convention-print";
import { formatFrenchDateLong, formatFrenchDateShort } from "@/lib/date-format";
import { getFundingMethodLabel } from "@/lib/funding-method";
import { formatSocialSecurityNumber } from "@/lib/student-profile";
import { formatAttestationIssueDate } from "@/lib/training-attestation";

export type StudentProfilePrintMode = "convention" | "recap";

type StudentProfilePrintProps = {
  mode: StudentProfilePrintMode;
  organizationName?: string;
  student: Student;
  session?: TrainingSession;
  sessionStudents?: Student[];
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

function TemplateFieldRow({
  label,
  value,
  placeholder = "……………………………………",
}: {
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <tr>
      <th className="w-[38%] border border-black px-3 py-2 text-left align-top font-semibold">
        {label}
      </th>
      <td className="border border-black px-3 py-2 align-top">
        {value?.trim() || placeholder}
      </td>
    </tr>
  );
}

function ConventionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border-2 border-black p-4">
      <h2 className="mb-3 border-b border-black pb-2 text-sm font-bold uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function StudentProfilePrint({
  mode,
  organizationName,
  student,
  session,
  sessionStudents = [],
  issueDate = formatAttestationIssueDate(),
}: StudentProfilePrintProps) {
  const orgLabel = organizationName?.trim() || "L'organisme de formation";
  const fundingLabel = getFundingMethodLabel(student.fundingMethod);
  const ssn = student.socialSecurityNumber
    ? formatSocialSecurityNumber(student.socialSecurityNumber)
    : undefined;
  const birthDate = student.dateOfBirth
    ? formatFrenchDateShort(student.dateOfBirth)
    : undefined;
  const funderSiret = student.funderSiret
    ? formatSiret(student.funderSiret)
    : undefined;

  if (mode === "convention") {
    const participantRows = buildConventionParticipantRows(
      session,
      sessionStudents,
      student.id,
    );
    const sessionDate = session?.date
      ? formatFrenchDateLong(session.date)
      : undefined;

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
          <ConventionSection title="Formation">
            <table className="mb-4 w-full border-collapse border border-black text-sm">
              <tbody>
                <TemplateFieldRow
                  label="Intitulé de la convention / formation"
                  value={session?.title}
                />
                <TemplateFieldRow
                  label="Date(s) de formation"
                  value={sessionDate}
                />
                <TemplateFieldRow label="Lieu" value={session?.location} />
                <TemplateFieldRow label="Formateur" value={session?.trainer} />
              </tbody>
            </table>

            <p className="mb-2 text-sm font-semibold">
              Stagiaires inscrits à la session ({participantRows.length}{" "}
              {participantRows.length > 1 ? "places" : "place"})
            </p>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="w-12 border border-black px-2 py-1.5 text-left font-semibold">
                    N°
                  </th>
                  <th className="border border-black px-3 py-1.5 text-left font-semibold">
                    Nom et prénom du stagiaire
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantRows.map((row) => (
                  <tr key={row.index}>
                    <td className="border border-black px-2 py-1.5 align-top">
                      {row.index}
                    </td>
                    <td
                      className={
                        row.isCurrent
                          ? "border border-black px-3 py-1.5 align-top font-semibold"
                          : "border border-black px-3 py-1.5 align-top"
                      }
                    >
                      {row.name || "……………………………………"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConventionSection>

          <ConventionSection title="Informations du candidat">
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <TemplateFieldRow
                  label="Nom"
                  value={student.lastName.toUpperCase()}
                />
                <TemplateFieldRow label="Prénom" value={student.firstName} />
                <TemplateFieldRow label="Date de naissance" value={birthDate} />
                <TemplateFieldRow label="E-mail" value={student.email} />
                <TemplateFieldRow label="Téléphone" value={student.phone} />
                <TemplateFieldRow
                  label="Structure / employeur"
                  value={student.company}
                />
                <TemplateFieldRow label="N° sécurité sociale" value={ssn} />
                <TemplateFieldRow
                  label="Identifiant France Travail"
                  value={student.franceTravailId}
                />
              </tbody>
            </table>
          </ConventionSection>

          <ConventionSection title="Informations du financeur">
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <TemplateFieldRow
                  label="Nom du financeur"
                  value={student.funderName}
                />
                <TemplateFieldRow
                  label="N° SIRET du financeur"
                  value={funderSiret}
                />
                <TemplateFieldRow
                  label="Moyen de financement"
                  value={fundingLabel ?? undefined}
                />
                <TemplateFieldRow
                  label="E-mail du financeur"
                  value={student.funderEmail}
                />
              </tbody>
            </table>
          </ConventionSection>

          <p>
            La présente convention est conclue entre{" "}
            <span className="font-semibold">{orgLabel}</span>, organisme de
            formation, le financeur désigné ci-dessus et le stagiaire{" "}
            <span className="font-semibold">
              {student.firstName} {student.lastName.toUpperCase()}
            </span>
            , inscrit à la formation mentionnée dans le présent document.
          </p>

          <p>
            Le stagiaire déclare suivre la formation dans le cadre du financement
            indiqué. Les parties reconnaissent avoir pris connaissance des
            conditions générales de formation et s&apos;engagent à respecter les
            obligations légales en vigueur, notamment en matière de présence et
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
            <p className="mb-16 font-medium">
              Signature et cachet du financeur :
            </p>
            <div className="border-t border-neutral-400 pt-2 text-xs text-neutral-600">
              {student.funderName?.trim() || "……………………………………"}
            </div>
          </div>
          <div className="min-w-[220px] text-sm">
            <p className="mb-16 font-medium">
              Signature et cachet de l&apos;organisme :
            </p>
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
          <FieldRow label="Date de naissance" value={birthDate} />
          <FieldRow label="E-mail" value={student.email} />
          <FieldRow label="Téléphone" value={student.phone} />
          <FieldRow label="Structure / employeur" value={student.company} />
          <FieldRow label="N° sécurité sociale" value={ssn} />
          <FieldRow
            label="Identifiant France Travail"
            value={student.franceTravailId}
          />
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
