const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const MONTHLY_SUMMARY_EVENT_TYPE = "month_end_summary";
const MONTHLY_SUMMARY_SEND_DAY = 1;
const MONTHLY_SUMMARY_SEND_HOUR = 9;
const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;
const MONTHLY_SUMMARY_CATEGORY_ID = "monthly_summary";
const MONTHLY_SUMMARY_ACTION_ROUTE = "charts";
const MONTHLY_SUMMARY_FUNCTION_NAME = "send-monthly-summary-notifications";
const MONTHLY_SUMMARY_MINIMUM_INVOCATION_INTERVAL = "55 minutes";

type SummaryUserPreferenceRow = {
  enabled_by_event: Record<string, boolean> | null;
  last_monthly_summary_sent_month: string | null;
  summary_timezone: string | null;
  user_id: string;
};

type PushDeviceTokenRow = {
  expo_push_token: string;
  platform: "android" | "ios";
  user_id: string;
};

type ProfileRow = {
  active_book_id: string | null;
  id: string;
};

type LedgerEntryRow = {
  amount: number;
  entry_type: "expense" | "income";
  occurred_on: string;
};

type ExpoPushMessage = {
  body: string;
  categoryId?: string;
  data?: Record<string, unknown>;
  sound: "default";
  title: string;
  to: string;
};

type SendMonthlySummaryNotificationsAdminClient = {
  from: (tableName: string) => unknown;
  rpc: (
    functionName: "try_acquire_function_invocation_lock",
    args: {
      minimum_interval: string;
      target_function_name: string;
    },
  ) => Promise<{ data: boolean | null; error: Error | null }>;
};

type SendMonthlySummaryNotificationsHandlerOptions = {
  createAdminClient: () => SendMonthlySummaryNotificationsAdminClient;
  cronSecret: string;
};

type MonthlyComparisonDirection = "increase" | "decrease" | "same";

type MonthlyComparisonMetric = {
  currentAmount: number;
  deltaAmount: number;
  direction: MonthlyComparisonDirection;
  previousAmount: number;
};

type MonthlyInsights = {
  currentMonthLabel: string;
  expenseComparison: MonthlyComparisonMetric;
  incomeComparison: MonthlyComparisonMetric;
  previousMonthLabel: string;
};

type PreviousMonthSummaryContent = {
  body: string;
  title: string;
};

const MonthlyComparisonCopy = {
  expenseDecrease: "전월보다 {amount} 덜 나갔어요",
  expenseIncrease: "전월보다 {amount} 더 나갔어요",
  incomeDecrease: "전월보다 {amount} 덜 들어왔어요",
  incomeIncrease: "전월보다 {amount} 더 들어왔어요",
  previousDataUnavailable: "전월 데이터 없음",
  same: "전월과 같아요",
} as const;

const PreviousMonthSummaryCopy = {
  body: "수입: {incomeSummary}\n지출: {expenseSummary}",
  title: "{currentMonthLabel} 수입·지출 돌아보기",
} as const;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Origin": "*",
} as const;

export async function handleSendMonthlySummaryNotificationsRequest(
  request: Request,
  options: SendMonthlySummaryNotificationsHandlerOptions,
): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    if (!options.cronSecret) {
      return createJsonResponse(500, { error: "Monthly summary cron secret is not configured." });
    }

    const requestSecret = request.headers.get("x-cron-secret");
    if (requestSecret !== options.cronSecret) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const triggeredAt = new Date();
    const adminClient = options.createAdminClient();
    const acquiredRunSlot = await acquireMonthlySummaryRunSlot(adminClient);
    if (!acquiredRunSlot) {
      return createJsonResponse(429, {
        error: "Monthly summary cron was invoked too recently.",
        success: false,
      });
    }

    const preferences = await fetchSummaryUserPreferences(adminClient);
    let scannedUserCount = 0;
    let sentUserCount = 0;
    let sentMessageCount = 0;

    for (const preference of preferences) {
      if (!preference.summary_timezone) {
        continue;
      }

      if (!preference.enabled_by_event?.[MONTHLY_SUMMARY_EVENT_TYPE]) {
        continue;
      }

      scannedUserCount += 1;

      const scheduleState = resolveScheduleState(triggeredAt, preference.summary_timezone);
      if (!scheduleState.isDue) {
        continue;
      }

      if (preference.last_monthly_summary_sent_month === scheduleState.summaryMonthKey) {
        continue;
      }

      const activeBookId = await fetchActiveBookId(adminClient, preference.user_id);
      if (!activeBookId) {
        continue;
      }

      const insights = await fetchMonthlyInsightsForBook(
        adminClient,
        activeBookId,
        scheduleState.summaryMonthKey,
      );
      const pushTokens = await fetchUserPushTokens(adminClient, preference.user_id);
      if (!pushTokens.length) {
        continue;
      }

      const pushContent = buildPreviousMonthSummaryPushContent(insights);
      const expoResponse = await fetch(EXPO_PUSH_API_URL, {
        body: JSON.stringify(
          pushTokens.map((token) => ({
            body: pushContent.body,
            categoryId: MONTHLY_SUMMARY_CATEGORY_ID,
            data: {
              actionRoute: MONTHLY_SUMMARY_ACTION_ROUTE,
            },
            sound: "default",
            title: pushContent.title,
            to: token,
          })),
        ),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!expoResponse.ok) {
        const responseText = await expoResponse.text();
        console.error("[send-monthly-summary-notifications] expo send failed", {
          responseText,
          status: expoResponse.status,
          userId: preference.user_id,
        });
        continue;
      }

      sentUserCount += 1;
      sentMessageCount += pushTokens.length;
      await markMonthlySummarySent(adminClient, preference.user_id, scheduleState.summaryMonthKey);
    }

    return createJsonResponse(200, {
      scannedUserCount,
      sentMessageCount,
      sentUserCount,
      success: true,
      triggeredAt: triggeredAt.toISOString(),
    });
  } catch (error) {
    console.error("[send-monthly-summary-notifications] unexpected error", error);
    return createJsonResponse(500, { error: "Failed to send monthly summary notifications." });
  }
}

async function acquireMonthlySummaryRunSlot(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("try_acquire_function_invocation_lock", {
    minimum_interval: MONTHLY_SUMMARY_MINIMUM_INVOCATION_INTERVAL,
    target_function_name: MONTHLY_SUMMARY_FUNCTION_NAME,
  });

  if (error) {
    throw error;
  }

  return data === true;
}

async function fetchSummaryUserPreferences(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
): Promise<SummaryUserPreferenceRow[]> {
  const notificationPreferencesQuery = adminClient.from("notification_preferences") as {
    select: (columns: string) => {
      returns: <Row>() => Promise<{ data: Row[] | null; error: Error | null }>;
    };
  };
  const { data, error } = await notificationPreferencesQuery
    .select("user_id, enabled_by_event, summary_timezone, last_monthly_summary_sent_month")
    .returns<SummaryUserPreferenceRow>();

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data;
}

async function fetchActiveBookId(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
  userId: string,
): Promise<string | null> {
  const profilesQuery = adminClient.from("profiles") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: <Row>() => Promise<{ data: Row | null; error: Error | null }>;
      };
    };
  };
  const { data, error } = await profilesQuery
    .select("id, active_book_id")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error || !data?.active_book_id) {
    return null;
  }

  return data.active_book_id;
}

async function fetchMonthlyInsightsForBook(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
  bookId: string,
  summaryMonthKey: string,
): Promise<MonthlyInsights> {
  const summaryMonthStart = `${summaryMonthKey}-01`;
  const summaryMonthDate = parseMonthKey(summaryMonthKey);
  const nextMonthDate = addMonth(summaryMonthDate, 1);
  const nextMonthStart = `${nextMonthDate.year}-${String(nextMonthDate.month).padStart(2, "0")}-01`;
  const previousMonthDate = addMonth(summaryMonthDate, -1);
  const previousMonthKey = `${previousMonthDate.year}-${String(previousMonthDate.month).padStart(2, "0")}`;
  const previousMonthStart = `${previousMonthKey}-01`;

  const ledgerEntriesQuery = adminClient.from("ledger_entries") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        gte: (
          nextColumn: string,
          nextValue: string,
        ) => {
          lt: (
            lastColumn: string,
            lastValue: string,
          ) => Promise<{ data: LedgerEntryRow[] | null; error: Error | null }>;
        };
      };
    };
  };
  const { data, error } = await ledgerEntriesQuery
    .select("entry_type, amount, occurred_on")
    .eq("book_id", bookId)
    .gte("occurred_on", previousMonthStart)
    .lt("occurred_on", nextMonthStart);

  const entries = error || !Array.isArray(data) ? [] : data;
  const currentMonthEntries = entries.filter((entry) =>
    entry.occurred_on.startsWith(`${summaryMonthKey}-`),
  );
  const previousMonthEntries = entries.filter((entry) =>
    entry.occurred_on.startsWith(`${previousMonthKey}-`),
  );

  return {
    currentMonthLabel: formatMonthLabel(summaryMonthDate.month),
    expenseComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "expense"),
    incomeComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "income"),
    previousMonthLabel: formatMonthLabel(previousMonthDate.month),
  };
}

async function fetchUserPushTokens(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
  userId: string,
): Promise<string[]> {
  const pushDeviceTokensQuery = adminClient.from("push_device_tokens") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ data: PushDeviceTokenRow[] | null; error: Error | null }>;
    };
  };
  const { data, error } = await pushDeviceTokensQuery
    .select("expo_push_token, platform, user_id")
    .eq("user_id", userId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .filter((row) => EXPO_PUSH_TOKEN_PATTERN.test(row.expo_push_token))
    .map((row) => row.expo_push_token);
}

async function markMonthlySummarySent(
  adminClient: SendMonthlySummaryNotificationsAdminClient,
  userId: string,
  summaryMonthKey: string,
): Promise<void> {
  const notificationPreferencesQuery = adminClient.from("notification_preferences") as {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
  const { error } = await notificationPreferencesQuery
    .update({
      last_monthly_summary_sent_month: summaryMonthKey,
    })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

function resolveScheduleState(
  triggeredAt: Date,
  timeZone: string,
): { isDue: boolean; summaryMonthKey: string } {
  const localTime = resolveTimeZoneDateParts(triggeredAt, timeZone);
  const summaryMonth = addMonth({ month: localTime.month, year: localTime.year }, -1);

  return {
    isDue:
      localTime.day === MONTHLY_SUMMARY_SEND_DAY && localTime.hour >= MONTHLY_SUMMARY_SEND_HOUR,
    summaryMonthKey: `${summaryMonth.year}-${String(summaryMonth.month).padStart(2, "0")}`,
  };
}

function resolveTimeZoneDateParts(
  date: Date,
  timeZone: string,
): { day: number; hour: number; month: number; year: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  return {
    day: Number(readDatePart(parts, "day")),
    hour: Number(readDatePart(parts, "hour")),
    month: Number(readDatePart(parts, "month")),
    year: Number(readDatePart(parts, "year")),
  };
}

function readDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? "0";
}

function parseMonthKey(monthKey: string): { month: number; year: number } {
  const [yearText, monthText] = monthKey.split("-");
  return {
    month: Number(monthText),
    year: Number(yearText),
  };
}

function addMonth(
  monthDate: { month: number; year: number },
  diff: number,
): { month: number; year: number } {
  const date = new Date(monthDate.year, monthDate.month - 1 + diff, 1);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function buildComparisonMetric(
  currentEntries: LedgerEntryRow[],
  previousEntries: LedgerEntryRow[],
  type: "expense" | "income",
): MonthlyComparisonMetric {
  const currentAmount = sumEntriesByType(currentEntries, type);
  const previousAmount = sumEntriesByType(previousEntries, type);
  const deltaAmount = currentAmount - previousAmount;

  return {
    currentAmount,
    deltaAmount: Math.abs(deltaAmount),
    direction: resolveDirection(deltaAmount),
    previousAmount,
  };
}

function sumEntriesByType(entries: LedgerEntryRow[], type: "expense" | "income"): number {
  return entries
    .filter((entry) => entry.entry_type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function resolveDirection(deltaAmount: number): MonthlyComparisonDirection {
  if (deltaAmount > 0) {
    return "increase";
  }

  if (deltaAmount < 0) {
    return "decrease";
  }

  return "same";
}

function buildPreviousMonthSummaryPushContent(
  insights: MonthlyInsights,
): PreviousMonthSummaryContent {
  const expenseSummary = buildMonthlyComparisonSummary(insights.expenseComparison, "expense");
  const incomeSummary = buildMonthlyComparisonSummary(insights.incomeComparison, "income");

  return {
    body: PreviousMonthSummaryCopy.body
      .replace("{incomeSummary}", incomeSummary)
      .replace("{expenseSummary}", expenseSummary),
    title: PreviousMonthSummaryCopy.title.replace(
      "{currentMonthLabel}",
      insights.currentMonthLabel,
    ),
  };
}

function buildMonthlyComparisonSummary(
  metric: MonthlyComparisonMetric,
  variant: "expense" | "income",
): string {
  if (metric.previousAmount <= 0) {
    return MonthlyComparisonCopy.previousDataUnavailable;
  }

  if (metric.direction === "same") {
    return MonthlyComparisonCopy.same;
  }

  const amountLabel = formatCurrency(metric.deltaAmount);
  if (variant === "expense") {
    const template =
      metric.direction === "increase"
        ? MonthlyComparisonCopy.expenseIncrease
        : MonthlyComparisonCopy.expenseDecrease;
    return template.replace("{amount}", amountLabel);
  }

  const template =
    metric.direction === "increase"
      ? MonthlyComparisonCopy.incomeIncrease
      : MonthlyComparisonCopy.incomeDecrease;
  return template.replace("{amount}", amountLabel);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount).concat("원");
}

function formatMonthLabel(month: number): string {
  return `${month}월`;
}

function createJsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}
