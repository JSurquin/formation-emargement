import {
  listAccountingRows,
  type AccountingCategory,
  type AccountingRowEnriched,
  ACCOUNTING_CATEGORY_LABELS,
} from "./accounting";
import type {
  SessionStudentAccounting,
  Student,
  TrainingSession,
} from "./types";

export type BillingRowEnriched = AccountingRowEnriched & {
  amountHt: number | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
};

export function enrichBillingRow(row: AccountingRowEnriched): BillingRowEnriched {
  const acc = row.accounting;
  return {
    ...row,
    amountHt: acc?.amountHt ?? null,
    invoiceNumber: acc?.invoiceNumber?.trim() || null,
    invoiceDate: acc?.invoiceDate ?? null,
  };
}

export function listBillingRows(
  students: Student[],
  sessions: TrainingSession[],
  filterCategory?: AccountingCategory,
): BillingRowEnriched[] {
  return listAccountingRows(students, sessions, filterCategory).map(
    enrichBillingRow,
  );
}

export type BillingSummary = {
  totalInvoicedHt: number;
  totalPaidHt: number;
  totalPendingHt: number;
  countByCategory: Record<AccountingCategory, number>;
};

export function computeBillingSummary(
  students: Student[],
  sessions: TrainingSession[],
): BillingSummary {
  const rows = listBillingRows(students, sessions);
  const countByCategory: Record<AccountingCategory, number> = {
    relance: 0,
    facture_a_envoyer: 0,
    en_attente_paiement: 0,
    paye: 0,
  };

  let totalInvoicedHt = 0;
  let totalPaidHt = 0;
  let totalPendingHt = 0;

  for (const row of rows) {
    countByCategory[row.category]++;
    const amount = row.amountHt ?? 0;
    if (row.accounting?.invoiceSentAt && amount > 0) {
      totalInvoicedHt += amount;
    }
    if (row.category === "paye" && amount > 0) {
      totalPaidHt += amount;
    }
    if (row.category === "en_attente_paiement" && amount > 0) {
      totalPendingHt += amount;
    }
  }

  return {
    totalInvoicedHt,
    totalPaidHt,
    totalPendingHt,
    countByCategory,
  };
}

export function formatAmountHt(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export { ACCOUNTING_CATEGORY_LABELS };

export type BillingPatch = Pick<
  SessionStudentAccounting,
  "invoiceNumber" | "amountHt" | "invoiceDate" | "notes"
>;
