type EnvironmentReader = (name: string) => string | undefined;

const SECRET_KEYS_VARIABLE = "SUPABASE_SECRET_KEYS";
const SECRET_KEY_NAME_VARIABLE = "SUPABASE_SECRET_KEY_NAME";
const DEFAULT_KEY_NAME = "default";

// Invalid configured maps fail closed; never pass JSON or log secrets as API keys.
export function resolveSupabaseAdminKey(readEnvironment: EnvironmentReader): string {
  const rawKeys = readEnvironment(SECRET_KEYS_VARIABLE)?.trim();
  if (rawKeys) {
    try {
      const keys: unknown = JSON.parse(rawKeys);
      if (!keys || typeof keys !== "object" || Array.isArray(keys)) return "";
      const keyName = readEnvironment(SECRET_KEY_NAME_VARIABLE)?.trim() || DEFAULT_KEY_NAME;
      if (!Object.prototype.hasOwnProperty.call(keys, keyName)) return "";
      return readKey((keys as Record<string, unknown>)[keyName]);
    } catch {
      return "";
    }
  }

  // Compatibility for local and older runtimes without the named-key dictionary.
  return readKey(readEnvironment("SUPABASE_SECRET_KEY"))
    || readKey(readEnvironment("SUPABASE_SERVICE_ROLE_KEY"));
}

function readKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
