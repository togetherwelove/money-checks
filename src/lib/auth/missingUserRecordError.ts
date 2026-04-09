const MISSING_PROFILE_USER_CONSTRAINT = "profiles_id_fkey";
const MISSING_USER_DETAILS = 'Key is not present in table "users".';

type PostgrestLikeError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

export function isMissingUserRecordError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const postgrestError = error as PostgrestLikeError;
  return (
    postgrestError.code === "23503" &&
    postgrestError.details === MISSING_USER_DETAILS &&
    typeof postgrestError.message === "string" &&
    postgrestError.message.includes(MISSING_PROFILE_USER_CONSTRAINT)
  );
}
