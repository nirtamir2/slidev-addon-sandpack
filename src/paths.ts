const ERROR_PREFIX = "[slidev-addon-sandpack]";

function pathError(message: string): Error {
  return new Error(`${ERROR_PREFIX} ${message}`);
}

/**
 * Converts an authored filename into Sandpack's canonical absolute path form.
 */
export function normalizeSandpackPath(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) throw pathError("File paths cannot be empty.");
  if (trimmed.includes("\\"))
    throw pathError(
      `File path ${JSON.stringify(input)} cannot contain backslashes.`,
    );
  if (trimmed.includes("\0"))
    throw pathError(
      `File path ${JSON.stringify(input)} cannot contain NUL bytes.`,
    );
  if (trimmed.includes("?") || trimmed.includes("#"))
    throw pathError(
      `File path ${JSON.stringify(input)} cannot contain a query or fragment.`,
    );

  const withoutLeadingDot = trimmed.startsWith("./")
    ? trimmed.slice(2)
    : trimmed;
  const collapsed = withoutLeadingDot.replaceAll(/\/{2,}/g, "/");
  const relative = collapsed.startsWith("/") ? collapsed.slice(1) : collapsed;
  const segments = relative.split("/");

  if (!relative || segments.includes(""))
    throw pathError("File paths cannot be empty.");

  const invalidSegment = segments.find(
    (segment) => segment === "." || segment === "..",
  );
  if (invalidSegment)
    throw pathError(
      `File path ${JSON.stringify(input)} cannot contain ${JSON.stringify(invalidSegment)} segments.`,
    );

  return `/${segments.join("/")}`;
}

/**
 * Normalizes the keys in a file map and rejects aliases that collapse to the
 * same Sandpack path.
 */
export function normalizeSandpackFileMap<Value>(
  files: Readonly<Record<string, Value>>,
): Record<string, Value> {
  const normalized = new Map<string, Value>();

  for (const [path, value] of Object.entries(files)) {
    const canonicalPath = normalizeSandpackPath(path);
    if (normalized.has(canonicalPath))
      throw pathError(
        `Duplicate file path ${JSON.stringify(canonicalPath)} after normalization.`,
      );
    normalized.set(canonicalPath, value);
  }

  return Object.fromEntries(normalized);
}
