const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type RecoraDbWriteGuardCliOptions = {
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
};

type RecoraDbWriteGuardInput = RecoraDbWriteGuardCliOptions & {
  databaseUrl: string;
  operation: string;
  projectSlug?: string | null;
  isWrite: boolean;
};

type RecoraDatabaseTarget = {
  host: string;
  port: string;
  isLocal: boolean;
};

export function createRecoraDbWriteGuardCliOptions(): RecoraDbWriteGuardCliOptions {
  return {
    allowNonLocalDb: false,
    confirmNonLocalDbWrite: null
  };
}

export function parseRecoraDbWriteGuardArg(
  args: string[],
  index: number,
  options: RecoraDbWriteGuardCliOptions
): number {
  const arg = args[index];

  if (arg === "--allow-non-local-db") {
    options.allowNonLocalDb = true;
    return 1;
  }

  if (arg === "--confirm-non-local-db-write") {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error("--confirm-non-local-db-write requires a value.");
    }
    options.confirmNonLocalDbWrite = value;
    return 2;
  }

  if (arg.startsWith("--confirm-non-local-db-write=")) {
    options.confirmNonLocalDbWrite = arg.slice("--confirm-non-local-db-write=".length);
    return 1;
  }

  return 0;
}

export function assertRecoraDbWriteAllowed(input: RecoraDbWriteGuardInput): RecoraDatabaseTarget {
  const target = parseDatabaseTarget(input.databaseUrl);
  if (!input.isWrite || target.isLocal) return target;

  const expectedConfirmation = buildNonLocalDbWriteConfirmation(input.projectSlug);
  if (input.allowNonLocalDb && input.confirmNonLocalDbWrite === expectedConfirmation) {
    return target;
  }

  throw new Error(
    [
      `Refusing ${input.operation} against a non-local database.`,
      `targetHost=${target.host}${target.port ? `:${target.port}` : ""}`,
      "This command would write Recora data outside local Supabase.",
      "Review the target database, then pass both flags only for an explicitly approved target:",
      `--allow-non-local-db --confirm-non-local-db-write ${expectedConfirmation}`
    ].join(" ")
  );
}

export function buildNonLocalDbWriteConfirmation(projectSlug?: string | null) {
  const slug = projectSlug?.trim();
  return slug ? `write:${slug}` : "write:non-local-recora-db";
}

function parseDatabaseTarget(databaseUrl: string): RecoraDatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("RECORA_DATABASE_URL is not a valid Postgres connection URL.");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("RECORA_DATABASE_URL must use the postgres or postgresql protocol.");
  }

  return {
    host: parsed.hostname,
    port: parsed.port,
    isLocal: LOCAL_DATABASE_HOSTS.has(parsed.hostname)
  };
}
