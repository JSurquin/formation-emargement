import { describe, expect, it } from "vitest";
import { parseAppStateImport } from "./app-state-io";

describe("sessionAccounting persistence", () => {
  it("conserve les champs CPF seuls à l'import", () => {
    const parsed = parseAppStateImport({
      students: [
        {
          id: "st1",
          firstName: "A",
          lastName: "B",
          fundingMethod: "cpf",
        },
      ],
      sessions: [
        {
          id: "s1",
          title: "test",
          date: "2020-01-01",
          studentIds: ["st1"],
          attendance: { morning: {}, afternoon: {} },
          sessionAccounting: {
            st1: {
              cpfEntryNotifiedAt: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      ],
    });

    expect(parsed?.sessions[0]?.sessionAccounting?.st1?.cpfEntryNotifiedAt).toBe(
      "2024-01-01T00:00:00.000Z",
    );
  });

  it("accepte les champs comptables null sans rejeter la session", () => {
    const parsed = parseAppStateImport({
      students: [{ id: "st1", firstName: "A", lastName: "B" }],
      sessions: [
        {
          id: "s1",
          title: "test",
          date: "2020-01-01",
          studentIds: ["st1"],
          attendance: { morning: {}, afternoon: {} },
          sessionAccounting: {
            st1: {
              invoiceSentAt: "2024-01-01T00:00:00.000Z",
              paymentReceivedAt: null,
              cpfEntryNotifiedAt: null,
            },
          },
        },
      ],
    });

    expect(parsed?.sessions[0]?.sessionAccounting?.st1?.invoiceSentAt).toBe(
      "2024-01-01T00:00:00.000Z",
    );
  });
});
