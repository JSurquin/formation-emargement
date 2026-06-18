import { describe, expect, it } from "vitest";
import {
  classifyCpfRow,
  countPendingCpfNotifications,
  getCpfEntryStatus,
  getCpfExitStatus,
  listCpfAccountingRows,
} from "./cpf-accounting";
import type { Student, TrainingSession } from "./types";

const cpfStudent: Student = {
  id: "s1",
  firstName: "Marie",
  lastName: "Martin",
  fundingMethod: "cpf",
};

const otherStudent: Student = {
  id: "s2",
  firstName: "Paul",
  lastName: "Durand",
  fundingMethod: "opco",
};

function session(
  id: string,
  date: string,
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id,
    title: "Formation CPF",
    date,
    studentIds: ["s1"],
    attendance: { morning: {}, afternoon: {} },
    ...overrides,
  };
}

describe("cpf-accounting", () => {
  it("ignore les stagiaires non financés par le CPF", () => {
    const sess = session("sess1", "2099-06-01", { studentIds: ["s2"] });
    expect(classifyCpfRow(otherStudent, sess, "2024-01-01")).toBeNull();
  });

  it("signale une entrée CPF en attente le jour de la formation", () => {
    const sess = session("sess1", "2024-06-01");
    expect(getCpfEntryStatus(sess, null, "2024-06-01")).toBe("pending");
    expect(getCpfExitStatus(sess, null, "2024-06-01")).toBe("upcoming");
  });

  it("signale une sortie CPF en attente après la formation", () => {
    const sess = session("sess1", "2024-05-10");
    expect(getCpfExitStatus(sess, null, "2024-06-01")).toBe("pending");
  });

  it("marque entrée et sortie comme faites", () => {
    const sess = session("sess1", "2024-05-10", {
      sessionAccounting: {
        s1: {
          cpfEntryNotifiedAt: "2024-05-09T10:00:00.000Z",
          cpfExitNotifiedAt: "2024-05-11T10:00:00.000Z",
        },
      },
    });
    const row = classifyCpfRow(cpfStudent, sess, "2024-06-01");
    expect(row?.entryStatus).toBe("done");
    expect(row?.exitStatus).toBe("done");
  });

  it("compte les notifications CPF en attente", () => {
    const upcoming = session("sess1", "2099-06-01");
    const finished = session("sess2", "2024-05-10");
    const counts = countPendingCpfNotifications(
      [cpfStudent],
      [upcoming, finished],
      "2024-06-01",
    );
    expect(counts).toBe(1);
  });

  it("liste les lignes CPF triées par date de session", () => {
    const rows = listCpfAccountingRows(
      [cpfStudent],
      [session("sess2", "2024-06-01"), session("sess1", "2024-05-01")],
      "2024-01-01",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.sessionId).toBe("sess1");
  });
});
