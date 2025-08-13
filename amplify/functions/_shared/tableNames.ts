/**
 * Shared DynamoDB table name utilities.
 */
export interface TableNameOptions {
  explicitName?: string;
  suffix?: string;
  required?: boolean; // default true
}

const SUFFIX_ENV_ORDER = ['TABLE_SUFFIX','NEXT_PUBLIC_BACKEND_SUFFIX'];

export function resolveBackendSuffix(opts?: TableNameOptions): string | undefined {
  if (opts?.suffix) return opts.suffix;
  for (const k of SUFFIX_ENV_ORDER) {
    const v = process.env[k];
    if (v) return v;
  }
  return undefined;
}

export function tableName(model: string, opts?: TableNameOptions): string {
  if (opts?.explicitName) return opts.explicitName;
  const suffix = resolveBackendSuffix(opts);
  if (!suffix) {
    if (opts?.required === false) return `${model}-missingSuffix-NONE`;
    throw new Error(`Missing backend suffix for table '${model}'. Set TABLE_SUFFIX or NEXT_PUBLIC_BACKEND_SUFFIX.`);
  }
  return `${model}-${suffix}-NONE`;
}

export function requestsTableName(opts?: TableNameOptions): string {
  const explicit = process.env.REQUESTS_TABLE;
  return tableName('Requests', { ...opts, explicitName: explicit || opts?.explicitName });
}
