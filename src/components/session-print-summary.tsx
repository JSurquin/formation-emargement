"use client";

import type { HalfDay, Student, TrainingSession } from "@/lib/types";

const HALF_LABELS: Record<HalfDay, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
};

type SessionPrintSummaryProps = {
  organizationName?: string;
  session: TrainingSession;
  students: Student[];
  formatFrenchDate: (iso: string) => string;
};

export function SessionPrintSummary({
  organizationName,
  session,
  students,
  formatFrenchDate,
}: SessionPrintSummaryProps) {
  const halves: HalfDay[] = ["morning", "afternoon"];

  return (
    <div className="hidden print:block">
      <header className="mb-8 border-b-2 border-black pb-4">
        {organizationName ? (
          <p className="text-lg font-bold tracking-tight">{organizationName}</p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold">Feuille d&apos;émargement</h1>
        <p className="mt-1 text-base font-medium">{session.title}</p>
        <p className="text-sm text-neutral-700">{formatFrenchDate(session.date)}</p>
        {session.location?.trim() ? (
          <p className="mt-1 text-sm text-neutral-800">
            Lieu : {session.location.trim()}
          </p>
        ) : null}
        {session.trainer?.trim() ? (
          <p className="text-sm text-neutral-800">
            Intervenant : {session.trainer.trim()}
          </p>
        ) : null}
        {session.tags && session.tags.length > 0 ? (
          <p className="mt-1 text-xs text-neutral-600">
            Étiquettes : {session.tags.join(", ")}
          </p>
        ) : null}
        {session.notes?.trim() ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
            {session.notes.trim()}
          </p>
        ) : null}
      </header>

      {halves.map((half) => (
        <section key={half} className="mb-10 break-inside-avoid-page">
          <h2 className="mb-3 border-b border-neutral-400 pb-1 text-lg font-semibold">
            {HALF_LABELS[half]}
          </h2>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border border-black px-2 py-2 text-left font-semibold">
                  Élève
                </th>
                <th className="border border-black px-2 py-2 text-center font-semibold">
                  Présent
                </th>
                <th className="border border-black px-2 py-2 text-left font-semibold">
                  Signature
                </th>
                <th className="border border-black px-2 py-2 text-left text-xs font-semibold text-neutral-600">
                  Horodatage
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-black px-2 py-6 text-center text-neutral-600"
                  >
                    Aucun participant sur cette feuille.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const slot = session.attendance[half][st.id] ?? {
                    present: false,
                    signatureDataUrl: null,
                    signedAt: null,
                  };
                  return (
                    <tr key={`${half}-${st.id}`}>
                      <td className="border border-black px-2 py-2 font-medium">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {slot.present ? "Oui" : "Non"}
                      </td>
                      <td className="border border-black px-2 py-2 align-middle">
                        {slot.signatureDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slot.signatureDataUrl}
                            alt=""
                            className="max-h-16 max-w-[200px] object-contain"
                          />
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-xs text-neutral-700">
                        {slot.signedAt
                          ? new Date(slot.signedAt).toLocaleString("fr-FR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      ))}

      <p className="mt-8 text-xs text-neutral-600">
        Document généré localement — à conserver selon vos obligations de
        traçabilité.
      </p>
    </div>
  );
}
