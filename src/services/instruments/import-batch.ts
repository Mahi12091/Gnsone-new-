import type { ImportRetryPolicy } from "./import-errors";
import { DEFAULT_IMPORT_RETRY_POLICY, isRetryableImportError, retryDelayMs } from "./import-errors";

export type ImportBatchStatus = "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export type ImportRowExecutor<T> = (row: T) => Promise<"INSERTED" | "UPDATED" | "SKIPPED" | "FAILED">;

export type ImportBatchResult = {
  status: ImportBatchStatus;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: Array<{ index: number; message: string }>;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function processImportBatch<T>(
  rows: T[],
  executeRow: ImportRowExecutor<T>,
  policy: ImportRetryPolicy = DEFAULT_IMPORT_RETRY_POLICY,
): Promise<ImportBatchResult> {
  let insertedRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;
  let failedRows = 0;
  const errors: ImportBatchResult["errors"] = [];

  for (let index = 0; index < rows.length; index += 1) {
    let attempt = 1;

    while (true) {
      try {
        const result = await executeRow(rows[index]);
        if (result === "INSERTED") insertedRows += 1;
        if (result === "UPDATED") updatedRows += 1;
        if (result === "SKIPPED") skippedRows += 1;
        if (result === "FAILED") failedRows += 1;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isRetryableImportError(error) || attempt >= policy.maxAttempts) {
          failedRows += 1;
          errors.push({ index, message });
          break;
        }

        await sleep(retryDelayMs(attempt, policy));
        attempt += 1;
      }
    }
  }

  const status: ImportBatchStatus =
    failedRows === 0 ? "SUCCESS" : insertedRows + updatedRows + skippedRows > 0 ? "PARTIAL" : "FAILED";

  return {
    status,
    totalRows: rows.length,
    insertedRows,
    updatedRows,
    skippedRows,
    failedRows,
    errors,
  };
}
