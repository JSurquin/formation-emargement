export type HalfDay = "morning" | "afternoon";

export type AttendanceSlot = {
  present: boolean;
  signatureDataUrl: string | null;
  signedAt: string | null;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  /** Structure / employeur (affichage & export). */
  company?: string;
};

export type TrainingSession = {
  id: string;
  title: string;
  date: string;
  studentIds: string[];
  /** Notes internes (lieu, formateur, remarques…) — optionnel. */
  notes?: string;
  /** Libellés libres (filtrage, organisation). */
  tags?: string[];
  /** Mise en avant sur le tableau de bord. */
  favorited?: boolean;
  /** Masquée du filtre « actives » ; historique sans suppression. */
  archived?: boolean;
  /** Lieu de formation (salle, ville…). */
  location?: string;
  /** Intervenant référencé sur la feuille. */
  trainer?: string;
  /** Horodatage de création (ISO). */
  createdAt?: string;
  /** Dernière modification utile (présences, signatures, méta…). */
  lastActivityAt?: string;
  attendance: {
    morning: Record<string, AttendanceSlot>;
    afternoon: Record<string, AttendanceSlot>;
  };
};

/** Groupe d’élèves réutilisable à l’ouverture d’une nouvelle session. */
export type SessionTemplate = {
  id: string;
  name: string;
  studentIds: string[];
};

export type AppState = {
  /** Version du schéma pour migrations locales (voir formation-storage). */
  schemaVersion?: number;
  students: Student[];
  sessions: TrainingSession[];
  /** Affiché sur les exports / impressions. */
  organizationName?: string;
  /** Modèles réutilisables pour les notes de session. */
  noteSnippets?: string[];
  /** Modèles de sélection d’élèves (création de session). */
  sessionTemplates?: SessionTemplate[];
};

export function emptySlot(): AttendanceSlot {
  return {
    present: false,
    signatureDataUrl: null,
    signedAt: null,
  };
}

export function buildAttendanceForStudents(
  studentIds: string[],
): TrainingSession["attendance"] {
  const morning: Record<string, AttendanceSlot> = {};
  const afternoon: Record<string, AttendanceSlot> = {};
  for (const id of studentIds) {
    morning[id] = emptySlot();
    afternoon[id] = emptySlot();
  }
  return { morning, afternoon };
}

/** Fusionne de nouveaux élèves dans une feuille existante (sans écraser les signatures). */
export function mergeAttendanceWithNewStudents(
  attendance: TrainingSession["attendance"],
  newStudentIds: string[],
): TrainingSession["attendance"] {
  const morning = { ...attendance.morning };
  const afternoon = { ...attendance.afternoon };
  for (const id of newStudentIds) {
    if (!morning[id]) morning[id] = emptySlot();
    if (!afternoon[id]) afternoon[id] = emptySlot();
  }
  return { morning, afternoon };
}
