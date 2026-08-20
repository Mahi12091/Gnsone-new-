import { describe, expect, it } from "vitest";

import { processImportBatch } from "./import-batch";

const noWaitPolicy = { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 };

describe("processImportBatch", () => {
  it("aggregates successful row outcomes", async () => {
    const result = await processImportBatch(
      ["a", "b", "c"],
      async (row) => (row === "a" ? "INSERTED" : row === "b" ? "UPDATED" : "SKIPPED"),
      noWaitPolicy,
    );

    expect(result).toMatchObject({
      status: "SUCCESS",
      totalRows: 3,
      insertedRows: 1,
      updatedRows: 1,
      skippedRows: 1,
      failedRows: 0,
    });
  });

  it("retries transient failures and succeeds", async () => {
    let attempts = 0;
    const result = await processImportBatch(
      ["a"],
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("temporary connection timeout");
        return "INSERTED";
      },
      noWaitPolicy,
    );

    expect(attempts).toBe(2);
    expect(result.status).toBe("SUCCESS");
  });

  it("does not retry identity conflicts", async () => {
    let attempts = 0;
    const result = await processImportBatch(
      ["a"],
      async () => {
        attempts += 1;
        throw new Error("INSTRUMENT_IDENTITY_CONFLICT: duplicate ISIN");
      },
      noWaitPolicy,
    );

    expect(attempts).toBe(1);
    expect(result.status).toBe("FAILED");
    expect(result.failedRows).toBe(1);
  });
});
