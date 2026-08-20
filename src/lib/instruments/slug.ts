export function createInstrumentSlug(name: string, symbol?: string | null): string {
  const source = symbol ? `${name}-${symbol}` : name;
  const slug = source
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "instrument";
}
