import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { NormalizedInstrumentRow } from "../normalizer";

export type InstrumentImportRowInput = {
  rowNumber: number;
  rawPayload: Record<string, unknown>;
  normalized: NormalizedInstrumentRow;
};

export async function createInstrumentImportBatch(input: {
  source: "NSE" | "BSE";
  sourceVersion?: string | null;
  rows: InstrumentImportRowInput[];
}) {
  const supabase = createSupabaseServiceRoleClient();

  const { data: batch, error: batchError } = await supabase
    .from("instrument_import_batches")
    .insert({
      source: input.source,
      source_version: input.sourceVersion ?? null,
      source_retrieved_at: new Date().toISOString(),
      status: "PENDING",
      total_rows: input.rows.length,
      valid_rows: input.rows.length,
      inserted_rows: 0,
      updated_rows: 0,
      skipped_rows: 0,
      failed_rows: 0,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (batchError) throw new Error(`Unable to create import batch: ${batchError.message}`);

  const importRows = input.rows.map((row) => ({
    batch_id: batch.id,
    row_number: row.rowNumber,
    raw_payload: row.rawPayload,
    normalized_payload: row.normalized,
    status: "VALID" as const,
  }));

  const { data: insertedRows, error: rowsError } = await supabase
    .from("instrument_import_rows")
    .insert(importRows)
    .select("id, row_number");

  if (rowsError) {
    await supabase
      .from("instrument_import_batches")
      .update({ status: "FAILED", failed_rows: input.rows.length, error_summary: rowsError.message, completed_at: new Date().toISOString() })
      .eq("id", batch.id);
    throw new Error(`Unable to persist import rows: ${rowsError.message}`);
  }

  for (const row of insertedRows ?? []) {
    const sourceRow = input.rows.find((item) => item.rowNumber === row.row_number);
    if (!sourceRow) continue;

    const { error } = await supabase.rpc("resolve_and_upsert_instrument", {
      p_batch_id: batch.id,
      p_row_id: row.id,
      p_normalized: sourceRow.normalized,
    });

    if (error) {
      await supabase
        .from("instrument_import_rows")
        .update({ status: "FAILED", error_message: error.message })
        .eq("id", row.id);
    }
  }

  const { data: counts, error: countError } = await supabase
    .from("instrument_import_rows")
    .select("status")
    .eq("batch_id", batch.id);

  if (countError) throw new Error(`Unable to finalize import batch: ${countError.message}`);

  const summary = (counts ?? []).reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const failed = (summary.FAILED ?? 0) + (summary.INVALID ?? 0);
  const inserted = summary.INSERTED ?? 0;
  const updated = summary.UPDATED ?? 0;
  const skipped = summary.SKIPPED ?? 0;

  const status = failed === counts?.length ? "FAILED" : failed > 0 ? "PARTIAL" : "SUCCESS";

  const { error: finalizeError } = await supabase
    .from("instrument_import_batches")
    .update({
      status,
      inserted_rows: inserted,
      updated_rows: updated,
      skipped_rows: skipped,
      failed_rows: failed,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  if (finalizeError) throw new Error(`Unable to update import summary: ${finalizeError.message}`);

  return { batchId: batch.id, status, inserted, updated, skipped, failed };
}
