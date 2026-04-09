import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";

type DeleteAccountResponse = {
  error?: string;
  success?: boolean;
};

type DeleteAccountFetch = (
  input: string,
  init: {
    headers: Record<string, string>;
    method: "POST";
  },
) => Promise<Response>;

type DeleteAccountRequestOptions = {
  accessToken: string;
  fetchFn: DeleteAccountFetch;
  functionUrl: string;
  publishableKey: string;
  onDeleted: () => Promise<void>;
};

export async function deleteAccountRequest({
  accessToken,
  fetchFn,
  functionUrl,
  publishableKey,
  onDeleted,
}: DeleteAccountRequestOptions): Promise<void> {
  const response = await fetchFn(functionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
  });

  const payload = await readDeleteAccountResponse(response);
  if (!response.ok) {
    console.error("[deleteAccountRequest] Request failed", {
      payload,
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error(payload.errorMessage || AccountDeletionMessages.errorFallback);
  }

  if (payload.success !== true) {
    throw new Error(AccountDeletionMessages.errorFallback);
  }

  await onDeleted();
}

async function readDeleteAccountResponse(response: Response): Promise<{
  errorMessage: string | null;
  rawText: string | null;
  success: boolean;
}> {
  try {
    const rawText = await response.text();
    if (!rawText.trim()) {
      return {
        errorMessage: null,
        rawText: null,
        success: false,
      };
    }

    try {
      const parsedPayload = JSON.parse(rawText) as DeleteAccountResponse;
      return {
        errorMessage:
          typeof parsedPayload.error === "string" && parsedPayload.error.trim()
            ? parsedPayload.error
            : null,
        rawText,
        success: parsedPayload.success === true,
      };
    } catch {
      return {
        errorMessage: rawText.trim(),
        rawText,
        success: false,
      };
    }
  } catch {
    return {
      errorMessage: null,
      rawText: null,
      success: false,
    };
  }
}
