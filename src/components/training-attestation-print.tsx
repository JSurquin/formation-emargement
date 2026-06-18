"use client";

import type { Student, TrainingSession } from "@/lib/types";
import { getFundingMethodLabel } from "@/lib/funding-method";
import {
  buildAttestationDurationLabel,
  formatAttestationIssueDate,
  getAttestationSignature,
  getStudentAttendanceSummary,
} from "@/lib/training-attestation";

type TrainingAttestationPrintProps = {
  organizationName?: string;
  session: TrainingSession;
  students: Student[];
  formatFrenchDate: (iso: string) => string;
  issueDate?: string;
};

export function TrainingAttestationPrint({
  organizationName,
  session,
  students,
  formatFrenchDate,
  issueDate = formatAttestationIssueDate(),
}: TrainingAttestationPrintProps) {
  const orgLabel =
    organizationName?.trim() || "L’organisme de formation";

  return (
    <div className="print-attestation-only hidden print:block">
      {students.map((student, index) => {
        const summary = getStudentAttendanceSummary(session, student.id);
        const duration = buildAttestationDurationLabel(summary);
        const location = session.location?.trim();
        const trainer = session.trainer?.trim();
        const trainerSignature = getAttestationSignature(session, student.id);

        return (
          <article
            key={student.id}
            className={
              index < students.length - 1
                ? "mb-0 break-after-page pb-8"
                : "pb-8"
            }
          >
            <header className="mb-10 border-b-2 border-black pb-4 text-center">
              {organizationName?.trim() ? (
                <p className="text-lg font-bold tracking-tight">
                  {organizationName.trim()}
                </p>
              ) : null}
              <h1 className="mt-4 text-2xl font-bold uppercase tracking-wide">
                Attestation de fin de formation
              </h1>
            </header>

            <div className="space-y-6 text-[15px] leading-relaxed text-neutral-900">
              <p>Je soussigné(e), représentant(e) {orgLabel}, atteste que :</p>

              <p className="text-center text-xl font-bold">
                {student.firstName} {student.lastName.toUpperCase()}
              </p>

              {student.company?.trim() ? (
                <p className="text-center text-sm text-neutral-700">
                  Structure : {student.company.trim()}
                </p>
              ) : null}

              {student.fundingMethod ? (
                <p className="text-center text-sm text-neutral-700">
                  Moyen de financement :{" "}
                  {getFundingMethodLabel(student.fundingMethod)}
                </p>
              ) : null}

              <p>
                a suivi la formation intitulée{" "}
                <span className="font-semibold">« {session.title} »</span>
                {location ? (
                  <>
                    {" "}
                    qui s&apos;est déroulée à{" "}
                    <span className="font-semibold">{location}</span>
                  </>
                ) : null}{" "}
                le{" "}
                <span className="font-semibold">
                  {formatFrenchDate(session.date)}
                </span>
                , pour une durée équivalente à une{" "}
                <span className="font-semibold">{duration}</span>.
              </p>

              {trainer ? (
                <p>
                  Formation animée par :{" "}
                  <span className="font-semibold">{trainer}</span>.
                </p>
              ) : null}

              <p>
                La présence du stagiaire a été contrôlée via la feuille
                d&apos;émargement de la session.
              </p>

              <p className="pt-4">
                Fait pour servir et valoir ce que de droit.
              </p>
            </div>

            <footer className="mt-16 flex flex-col gap-12 sm:flex-row sm:justify-between">
              <div className="text-sm text-neutral-700">
                <p>Le {issueDate}</p>
              </div>
              <div className="min-w-[220px] text-sm">
                <p className="mb-4 font-medium">
                  Signature du formateur{trainer ? ` (${trainer})` : ""} :
                </p>
                {trainerSignature ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={trainerSignature.signatureDataUrl}
                      alt="Signature du formateur"
                      className="max-h-24 max-w-full object-contain"
                    />
                    <p className="text-xs text-neutral-600">
                      Signé le{" "}
                      {new Date(trainerSignature.signedAt).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="mb-16 border-t border-neutral-400 pt-2 text-xs text-neutral-600">
                    {trainer || orgLabel}
                  </div>
                )}
              </div>
            </footer>

            <p className="mt-10 text-[10px] text-neutral-500">
              Document généré localement — attestation n° {session.id.slice(0, 8)}-
              {student.id.slice(0, 8)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
