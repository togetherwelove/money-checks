type ParsedWebAuthError = {
  code: string | null;
  description: string | null;
};

const AUTH_ERROR_KEYS = ["error", "error_code", "error_description"] as const;

export function readWebAuthError(): ParsedWebAuthError | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const searchParams = new URLSearchParams(window.location.search);
  const params = hasAuthError(hashParams)
    ? hashParams
    : hasAuthError(searchParams)
      ? searchParams
      : null;

  if (!params) {
    return null;
  }

  return {
    code: params.get("error_code") ?? params.get("error"),
    description: params.get("error_description"),
  };
}

export function clearWebAuthError(): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, nextUrl);
}

function hasAuthError(params: URLSearchParams): boolean {
  return AUTH_ERROR_KEYS.some((key) => params.has(key));
}
