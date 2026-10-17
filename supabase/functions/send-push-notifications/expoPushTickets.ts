const DEVICE_NOT_REGISTERED = "DeviceNotRegistered";
const INVALID_TICKET = "InvalidPushTicket";

type ExpoPushTicket = {
  status?: string;
  id?: string;
  details?: { error?: string };
};

// Tickets confirm Expo acceptance, not delivery to the device.
export function summarizeExpoPushTickets(payload: unknown, tokens: readonly string[]) {
  const data = (payload as { data?: unknown } | null)?.data;
  const tickets: ExpoPushTicket[] = Array.isArray(data) ? data : [];
  const invalidTokens: string[] = [];
  const failures: { index: number; code: string }[] = [];
  let acceptedCount = 0;

  for (let index = 0; index < tokens.length; index++) {
    const ticket = tickets[index];
    if (tickets.length === tokens.length && ticket?.status === "ok" &&
      typeof ticket.id === "string" && ticket.id.length > 0) {
      acceptedCount++;
      continue;
    }
    const code = tickets.length === tokens.length && ticket?.status === "error"
      ? ticket.details?.error ?? INVALID_TICKET
      : INVALID_TICKET;
    failures.push({ index, code });
    if (code === DEVICE_NOT_REGISTERED) invalidTokens.push(tokens[index]);
  }

  return { acceptedCount, failedCount: failures.length, failures, invalidTokens };
}
