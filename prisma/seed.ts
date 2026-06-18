import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const DEMO_PASSWORD = "Demo1234!";

const IDS = {
  admin: "seed-user-admin",
  trainer1: "seed-user-trainer-1",
  trainer2: "seed-user-trainer-2",
  student1: "seed-student-1",
  student2: "seed-student-2",
  student3: "seed-student-3",
  student4: "seed-student-4",
  student5: "seed-student-5",
  eleveUser1: "seed-user-eleve-1",
  eleveUser2: "seed-user-eleve-2",
  sessionActive: "seed-session-active",
  sessionPast: "seed-session-past",
  sessionArchived: "seed-session-archived",
  funderOpco: "seed-funder-opco",
  funderEmployeur: "seed-funder-employeur",
  templateCpf: "seed-template-cpf",
  templateAlternance: "seed-template-alternance",
} as const;

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

function iso(daysAgo = 0, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateOnly(daysFromNow = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function fakeDataUrl(mimeType: string, label: string): string {
  const text = Buffer.from(`Document de démonstration — ${label}`).toString("base64");
  return `data:${mimeType};base64,${text}`;
}

function fakeSignatureDataUrl(name: string): string {
  return fakeDataUrl("image/png", `Signature ${name}`);
}

type AttendanceSlot = {
  present: boolean;
  signatureDataUrl: string | null;
  signedAt: string | null;
};

function buildAttendance(
  studentIds: string[],
  preset: "empty" | "partial" | "complete",
): { morning: Record<string, AttendanceSlot>; afternoon: Record<string, AttendanceSlot> } {
  const morning: Record<string, AttendanceSlot> = {};
  const afternoon: Record<string, AttendanceSlot> = {};

  studentIds.forEach((id, index) => {
    const morningPresent = preset === "complete" || (preset === "partial" && index % 2 === 0);
    const afternoonPresent = preset === "complete" || (preset === "partial" && index % 3 !== 0);

    morning[id] = {
      present: morningPresent,
      signatureDataUrl: morningPresent ? fakeSignatureDataUrl(id) : null,
      signedAt: morningPresent ? iso(1, 9) : null,
    };
    afternoon[id] = {
      present: afternoonPresent,
      signatureDataUrl: afternoonPresent ? fakeSignatureDataUrl(id) : null,
      signedAt: afternoonPresent ? iso(1, 14) : null,
    };
  });

  return { morning, afternoon };
}

function sampleStudentDocument(label: string, kind: "identity" | "other") {
  return {
    id: crypto.randomUUID(),
    label,
    kind,
    fileName: `${label.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    mimeType: "application/pdf",
    dataUrl: fakeDataUrl("application/pdf", label),
    uploadedAt: iso(10),
  };
}

function sampleTrainerDocument(label: string, kind: "mission_order" | "other") {
  return {
    id: crypto.randomUUID(),
    label,
    kind,
    fileName: `${label.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    mimeType: "application/pdf",
    dataUrl: fakeDataUrl("application/pdf", label),
    uploadedAt: iso(5),
  };
}

function sampleTrainerProfileDocument(
  kind: "kbis" | "urssaf" | "insurance" | "other",
  label: string,
) {
  return {
    id: crypto.randomUUID(),
    label,
    kind,
    fileName: `${kind}.pdf`,
    mimeType: "application/pdf",
    dataUrl: fakeDataUrl("application/pdf", label),
    uploadedAt: iso(30),
  };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function clearDatabase(prisma: PrismaClient) {
  await prisma.attendanceSignToken.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.funder.deleteMany();
  await prisma.appMeta.deleteMany();
}

async function main() {
  const { prisma, pool } = createPrisma();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log("Nettoyage de la base…");
  await clearDatabase(prisma);

  console.log("Insertion des métadonnées application…");
  await prisma.appMeta.create({
    data: {
      id: "default",
      schemaVersion: 1,
      organizationName: "Centre de Formation Démo",
      noteSnippets: [
        "Accueil café à 8h45 — merci d'arriver à l'heure.",
        "Pensez à apporter votre pièce d'identité.",
        "Déjeuner sur place — prévoir 1h de pause.",
      ],
      sessionTemplates: [
        {
          id: IDS.templateCpf,
          name: "Groupe CPF — module accueil",
          studentIds: [IDS.student1, IDS.student2, IDS.student3],
        },
        {
          id: IDS.templateAlternance,
          name: "Alternants — suivi trimestriel",
          studentIds: [IDS.student4, IDS.student5],
        },
      ],
    },
  });

  console.log("Insertion des financeurs…");
  await prisma.funder.createMany({
    data: [
      {
        id: IDS.funderOpco,
        name: "OPCO Atlas",
        siret: "12345678901234",
        email: "contact@opco-atlas-demo.fr",
      },
      {
        id: IDS.funderEmployeur,
        name: "SARL Bâtiment Pro",
        siret: "98765432109876",
        email: "rh@batiment-pro-demo.fr",
      },
    ],
  });

  console.log("Insertion des candidats…");
  await prisma.student.createMany({
    data: [
      {
        id: IDS.student1,
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie.dupont@demo.fr",
        phone: "06 12 34 56 78",
        company: "Auto-entrepreneur",
        socialSecurityNumber: "285031512345678",
        dateOfBirth: "1985-03-15",
        fundingMethod: "cpf",
        funderName: "Mon Compte Formation",
        conventionSignedAt: iso(20),
        conventionCreatedAt: iso(21),
        documents: [sampleStudentDocument("Carte d'identité", "identity")],
      },
      {
        id: IDS.student2,
        firstName: "Thomas",
        lastName: "Martin",
        email: "thomas.martin@demo.fr",
        phone: "06 98 76 54 32",
        company: "Menuiserie Martin",
        socialSecurityNumber: "190072012345679",
        dateOfBirth: "1990-07-20",
        fundingMethod: "opco",
        funderName: "OPCO Atlas",
        funderSiret: "12345678901234",
        funderEmail: "contact@opco-atlas-demo.fr",
        conventionSignedAt: iso(15),
        conventionCreatedAt: iso(16),
        documents: [
          sampleStudentDocument("Carte d'identité", "identity"),
          sampleStudentDocument("RIB", "other"),
        ],
      },
      {
        id: IDS.student3,
        firstName: "Sophie",
        lastName: "Bernard",
        email: "sophie.bernard@demo.fr",
        phone: "07 11 22 33 44",
        company: "SARL Bâtiment Pro",
        socialSecurityNumber: "288051012345680",
        dateOfBirth: "1988-05-10",
        fundingMethod: "employeur",
        funderName: "SARL Bâtiment Pro",
        funderSiret: "98765432109876",
        funderEmail: "rh@batiment-pro-demo.fr",
        conventionSignedAt: iso(12),
        conventionCreatedAt: iso(13),
        presenceConfirmedForSessionId: IDS.sessionActive,
      },
      {
        id: IDS.student4,
        firstName: "Lucas",
        lastName: "Petit",
        email: "lucas.petit@demo.fr",
        phone: "06 55 44 33 22",
        company: "Recherche d'emploi",
        socialSecurityNumber: "195112512345681",
        dateOfBirth: "1995-11-25",
        franceTravailId: "FT-1234567A",
        fundingMethod: "france_travail",
        funderName: "France Travail",
        funderEmail: "conseiller@france-travail-demo.fr",
        conventionCreatedAt: iso(8),
      },
      {
        id: IDS.student5,
        firstName: "Emma",
        lastName: "Leroy",
        email: "emma.leroy@demo.fr",
        phone: "06 77 88 99 00",
        dateOfBirth: "1992-02-14",
        fundingMethod: "personnel",
        linkedConventionStudentId: IDS.student2,
        documents: [sampleStudentDocument("Justificatif de domicile", "other")],
      },
    ],
  });

  console.log("Insertion des utilisateurs…");
  await prisma.user.createMany({
    data: [
      {
        id: IDS.admin,
        email: "admin@demo.fr",
        passwordHash,
        firstName: "Alexandre",
        lastName: "Admin",
        role: "SUPER_ADMIN",
        phone: "01 23 45 67 89",
      },
      {
        id: IDS.trainer1,
        email: "formateur1@demo.fr",
        passwordHash,
        firstName: "Claire",
        lastName: "Formateur",
        role: "FORMATEUR",
        phone: "06 10 20 30 40",
        dateOfBirth: "1980-06-12",
        company: "CF Démo Formations",
        companySiret: "11122233344455",
        documents: [
          sampleTrainerProfileDocument("kbis", "Extrait Kbis"),
          sampleTrainerProfileDocument("insurance", "Assurance RC Pro"),
        ],
      },
      {
        id: IDS.trainer2,
        email: "formateur2@demo.fr",
        passwordHash,
        firstName: "Nicolas",
        lastName: "Intervenant",
        role: "FORMATEUR",
        phone: "06 50 60 70 80",
        company: "Nicolas Conseil",
        companySiret: "55566677788899",
        documents: [sampleTrainerProfileDocument("urssaf", "Attestation URSSAF")],
      },
      {
        id: IDS.eleveUser1,
        email: "marie.dupont@demo.fr",
        passwordHash,
        firstName: "Marie",
        lastName: "Dupont",
        role: "ELEVE",
        studentId: IDS.student1,
        phone: "06 12 34 56 78",
      },
      {
        id: IDS.eleveUser2,
        email: "thomas.martin@demo.fr",
        passwordHash,
        firstName: "Thomas",
        lastName: "Martin",
        role: "ELEVE",
        studentId: IDS.student2,
        phone: "06 98 76 54 32",
      },
    ],
  });

  const activeStudentIds = [IDS.student1, IDS.student2, IDS.student3, IDS.student4];
  const pastStudentIds = [IDS.student1, IDS.student2, IDS.student5];

  console.log("Insertion des sessions de formation…");
  await prisma.trainingSession.createMany({
    data: [
      {
        id: IDS.sessionActive,
        title: "SST — Sauveteur Secouriste du Travail",
        date: dateOnly(7),
        studentIds: activeStudentIds,
        notes: "Session en salle A — prévoir EPI.",
        tags: ["SST", "sécurité", "obligatoire"],
        favorited: true,
        archived: false,
        location: "12 rue de la Formation, Lyon",
        trainer: "Claire Formateur",
        trainerUserId: IDS.trainer1,
        trainerDocuments: [
          sampleTrainerDocument("Ordre de mission", "mission_order"),
          sampleTrainerDocument("Programme pédagogique", "other"),
        ],
        sessionAccounting: {
          [IDS.student1]: {
            invoiceSentAt: iso(3),
            paymentReceivedAt: iso(2),
            cpfEntryNotifiedAt: iso(4),
            notes: "Dossier CPF validé.",
          },
          [IDS.student2]: {
            invoiceSentAt: iso(3),
            notes: "En attente de paiement OPCO.",
          },
          [IDS.student3]: {
            invoiceSentAt: iso(2),
            paymentReceivedAt: iso(1),
          },
        },
        createdAt: new Date(iso(14)),
        lastActivityAt: new Date(iso(1)),
        attendance: buildAttendance(activeStudentIds, "partial"),
      },
      {
        id: IDS.sessionPast,
        title: "Habilitation électrique H0B0",
        date: dateOnly(-14),
        studentIds: pastStudentIds,
        notes: "Session terminée — attestations à envoyer.",
        tags: ["électricité", "habilitation"],
        favorited: false,
        archived: false,
        location: "Centre technique, Villeurbanne",
        trainer: "Nicolas Intervenant",
        trainerUserId: IDS.trainer2,
        attestationSignatures: {
          [IDS.student1]: {
            signatureDataUrl: fakeSignatureDataUrl("Claire Formateur"),
            signedAt: iso(13),
            signedByUserId: IDS.trainer1,
          },
          [IDS.student2]: {
            signatureDataUrl: fakeSignatureDataUrl("Claire Formateur"),
            signedAt: iso(13),
            signedByUserId: IDS.trainer1,
          },
        },
        sessionAccounting: {
          [IDS.student1]: {
            invoiceSentAt: iso(20),
            paymentReceivedAt: iso(19),
            cpfEntryNotifiedAt: iso(18),
            cpfExitNotifiedAt: iso(14),
          },
          [IDS.student2]: {
            invoiceSentAt: iso(20),
            paymentReceivedAt: iso(19),
          },
          [IDS.student5]: {
            invoiceSentAt: iso(20),
            paymentReceivedAt: iso(18),
          },
        },
        createdAt: new Date(iso(30)),
        lastActivityAt: new Date(iso(14)),
        attendance: buildAttendance(pastStudentIds, "complete"),
      },
      {
        id: IDS.sessionArchived,
        title: "Initiation Excel — niveau 1",
        date: dateOnly(-60),
        studentIds: [IDS.student3, IDS.student4],
        notes: "Archive — session de test 2025.",
        tags: ["bureautique"],
        favorited: false,
        archived: true,
        location: "Salle informatique",
        trainer: "Claire Formateur",
        trainerUserId: IDS.trainer1,
        createdAt: new Date(iso(70)),
        lastActivityAt: new Date(iso(60)),
        attendance: buildAttendance([IDS.student3, IDS.student4], "empty"),
      },
    ],
  });

  console.log("Insertion des jetons d'émargement…");
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 2);

  await prisma.attendanceSignToken.createMany({
    data: [
      {
        token: "seed-token-marie-morning",
        sessionId: IDS.sessionActive,
        studentId: IDS.student1,
        halfDay: "morning",
        expiresAt: tokenExpiry,
      },
      {
        token: "seed-token-thomas-afternoon",
        sessionId: IDS.sessionActive,
        studentId: IDS.student2,
        halfDay: "afternoon",
        expiresAt: tokenExpiry,
        usedAt: new Date(iso(1, 14)),
      },
    ],
  });

  console.log("");
  console.log("Seed terminé avec succès.");
  console.log("");
  console.log("Comptes de démonstration (mot de passe : Demo1234!) :");
  console.log("  • Super admin  : admin@demo.fr");
  console.log("  • Formateur 1  : formateur1@demo.fr");
  console.log("  • Formateur 2  : formateur2@demo.fr");
  console.log("  • Élève 1      : marie.dupont@demo.fr");
  console.log("  • Élève 2      : thomas.martin@demo.fr");
  console.log("");
  console.log("Données insérées : 5 candidats, 5 utilisateurs, 3 sessions, 2 financeurs.");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error("Échec du seed :", error);
  process.exit(1);
});
