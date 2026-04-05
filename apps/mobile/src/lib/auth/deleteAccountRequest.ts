import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";

type DeleteAccountResponse = {
  error?: string;
  success?: boolean;
};

type DeleteAccountRequestOptions = {
  accessToken: string | null;
  invokeFn: (
    functionName: string,
    options: { body: { accessToken: string } },
  ) => Promise<{
    data: DeleteAccountResponse | null;
    error: unknown;
  }>;
  onDeleted: () => Promise<void>;
};

const DELETE_ACCOUNT_FUNCTION = "delete-account";

export async function deleteAccountRequest({
  accessToken,
  invokeFn,
  onDeleted,
}: DeleteAccountRequestOptions): Promise<void> {
  if (!accessToken) {
    throw new Error(AccountDeletionMessages.errorFallback);
  }

  const { data, error } = await invokeFn(DELETE_ACCOUNT_FUNCTION, {
    body: { accessToken },
  });

  if (error) {
    const payload = await readFunctionsErrorPayload(error);
    console.error("[deleteAccountRequest] Request failed", {
      error,
      payload,
    });
    throw new Error(payload.errorMessage || AccountDeletionMessages.errorFallback);
  }

  if (data?.success !== true) {
    throw new Error(AccountDeletionMessages.errorFallback);
  }

  await onDeleted();
}

async function readFunctionsErrorPayload(error: unknown): Promise<{
  errorMessage: string | null;
  rawText: string | null;
}> {
  const context = extractErrorContext(error);
  if (!context) {
    return {
      errorMessage: extractErrorMessage(error),
      rawText: null,
    };
  }

  try {
    const rawText = await context.text();
    if (!rawText.trim()) {
      return {
        errorMessage: extractErrorMessage(error),
        rawText: null,
      };
    }

    try {
      const parsedPayload = JSON.parse(rawText) as DeleteAccountResponse;
      return {
        errorMessage:
          typeof parsedPayload.error === "string" && parsedPayload.error.trim()
            ? parsedPayload.error
            : extractErrorMessage(error),
        rawText,
      };
    } catch {
      return {
        errorMessage: extractErrorMessage(error),
        rawText,
      };
    }
  } catch {
    return {
      errorMessage: extractErrorMessage(error),
      rawText: null,
    };
  }
}

function extractErrorContext(error: unknown): Response | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const context = Reflect.get(error, "context");
  return context instanceof Response ? context : null;
}

function extractErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = Reflect.get(error, "message");
  return typeof message === "string" && message.trim() ? message : null;
}
