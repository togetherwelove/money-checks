import { recommendCategory } from "./categoryRecommendation";

const ISO_DATE_MONTH_OFFSET = 1;
const BROADCAST_PREFIX_PATTERN = /^\[[^\]]+\]\s*/;
const DATE_TIME_PATTERN = /(\d{1,2})\/(\d{2})\s+\d{1,2}:\d{2}/;
const KRW_AMOUNT_PATTERN = /(\d[\d,]*)\s*원/;
const KRW_AMOUNT_GLOBAL_PATTERN = /(\d[\d,]*)\s*원/g;
const PLAIN_AMOUNT_LINE_PATTERN = /^\d[\d,]*$/;
const CARD_MASK_PATTERN = /\d+\*+\d*|\d+\*\*\d+/g;
const PERSON_NAME_PATTERN = /\S*[*＊]\S*님?/g;
const CORPORATE_PREFIX_PATTERN = /^(?:\(주\)|주식회사)\s*/;
const MERCHANT_SUFFIX_PATTERN = /\s*(?:사용|취소|승인|\(￦\))\s*$/;
const MERCHANT_BLOCKLIST_PATTERN =
  /(?:web발신|카드|누적|잔액|일시불|체크카드출금|결제금액|상품명|승인내역|님|\bus\$)/i;
const FOREIGN_AMOUNT_PATTERN = /\d+(?:\.\d+)?\s*\(\s*[a-z]{2,3}\$\s*\)/i;
const CARD_SMS_KEYWORD_PATTERN =
  /(?:web발신|체크\.승인|카드|승인|일시불|누적|잔액|체크카드출금|결제금액)/i;

export type ParsedCardSms = {
  amount: number | null;
  category: string | null;
  day: number | null;
  isCancel: boolean;
  merchantName: string | null;
  month: number | null;
};

type MerchantCandidate = {
  text: string;
  priority: number;
};

export function parseCardSms(message: string): ParsedCardSms {
  const normalizedMessage = normalizeSmsText(message);
  const lines = normalizedMessage.split("\n").filter(Boolean);
  const parsedDate = parseCardSmsDate(normalizedMessage);
  const amount = parseCardSmsAmount(lines);
  const merchantName = parseCardSmsMerchantName(lines);
  const isCancel = normalizedMessage.includes("취소");
  const category = merchantName
    ? (recommendCategory({ content: merchantName, entryType: isCancel ? "income" : "expense" })
        ?.category ?? null)
    : null;

  return {
    amount,
    category,
    day: parsedDate?.day ?? null,
    isCancel,
    merchantName,
    month: parsedDate?.month ?? null,
  };
}

export function isLikelyCardSms(message: string): boolean {
  const normalizedMessage = normalizeSmsText(message);
  if (!normalizedMessage) {
    return false;
  }

  return (
    CARD_SMS_KEYWORD_PATTERN.test(normalizedMessage) &&
    (KRW_AMOUNT_PATTERN.test(normalizedMessage) ||
      PLAIN_AMOUNT_LINE_PATTERN.test(normalizedMessage))
  );
}

export function resolveParsedCardSmsIsoDate(
  parsedSms: Pick<ParsedCardSms, "day" | "month">,
  baseDate: Date,
): string | null {
  if (!parsedSms.month || !parsedSms.day) {
    return null;
  }

  const year = baseDate.getFullYear();
  const parsedDate = new Date(year, parsedSms.month - ISO_DATE_MONTH_OFFSET, parsedSms.day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== parsedSms.month - ISO_DATE_MONTH_OFFSET ||
    parsedDate.getDate() !== parsedSms.day
  ) {
    return null;
  }

  return [
    String(parsedDate.getFullYear()),
    String(parsedDate.getMonth() + ISO_DATE_MONTH_OFFSET).padStart(2, "0"),
    String(parsedDate.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeSmsText(message: string): string {
  return message
    .replace(/\r/g, "\n")
    .replace(/\u3000/g, " ")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

function parseCardSmsDate(message: string): { day: number; month: number } | null {
  const match = message.match(DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }

  return {
    day: Number(match[2]),
    month: Number(match[1]),
  };
}

function parseCardSmsAmount(lines: readonly string[]): number | null {
  for (const line of lines) {
    const match = findTransactionAmountMatch(line);
    if (match) {
      return Number(match[1].replace(/,/g, ""));
    }
  }

  for (const line of lines) {
    if (line.includes("누적") || line.includes("잔액")) {
      continue;
    }

    if (PLAIN_AMOUNT_LINE_PATTERN.test(line)) {
      return Number(line.replace(/,/g, ""));
    }
  }

  return null;
}

function parseCardSmsMerchantName(lines: readonly string[]): string | null {
  const candidates = buildMerchantCandidates(lines)
    .map((candidate) => ({
      ...candidate,
      text: cleanMerchantName(candidate.text),
    }))
    .filter((candidate) => isValidMerchantCandidate(candidate.text))
    .sort((left, right) => right.priority - left.priority);

  return candidates[0]?.text ?? null;
}

function findTransactionAmountMatch(line: string): RegExpMatchArray | null {
  const blockedAmountIndex = resolveBlockedAmountIndex(line);
  const amountMatches = [...line.matchAll(KRW_AMOUNT_GLOBAL_PATTERN)];
  for (const amountMatch of amountMatches) {
    if (amountMatch.index === undefined) {
      continue;
    }

    if (blockedAmountIndex === null || amountMatch.index < blockedAmountIndex) {
      return amountMatch;
    }
  }

  return null;
}

function resolveBlockedAmountIndex(line: string): number | null {
  const blockedIndexes = ["누적", "잔액"]
    .map((keyword) => line.indexOf(keyword))
    .filter((index) => index >= 0);
  return blockedIndexes.length > 0 ? Math.min(...blockedIndexes) : null;
}

function buildMerchantCandidates(lines: readonly string[]): MerchantCandidate[] {
  const candidates: MerchantCandidate[] = [];

  lines.forEach((line, index) => {
    const withoutBroadcastPrefix = line.replace(BROADCAST_PREFIX_PATTERN, "");
    const dateMatch = withoutBroadcastPrefix.match(DATE_TIME_PATTERN);
    const amountMatch = withoutBroadcastPrefix.match(KRW_AMOUNT_PATTERN);

    if (dateMatch) {
      const dateIndex = dateMatch.index ?? 0;
      const beforeDate = withoutBroadcastPrefix.slice(0, dateIndex).trim();
      const afterDate = withoutBroadcastPrefix.slice(dateIndex + dateMatch[0].length).trim();
      pushCandidate(candidates, extractTextAfterLastAmount(beforeDate) ?? beforeDate, 50 - index);
      pushCandidate(candidates, extractTextAfterLastAmount(afterDate) ?? afterDate, 45 - index);
    }

    if (amountMatch) {
      const amountIndex = amountMatch.index ?? 0;
      const beforeAmount = withoutBroadcastPrefix.slice(0, amountIndex).trim();
      const afterAmount = withoutBroadcastPrefix.slice(amountIndex + amountMatch[0].length).trim();
      pushCandidate(candidates, afterAmount, 40 - index);
      pushCandidate(candidates, beforeAmount, 35 - index);
    }

    pushCandidate(candidates, withoutBroadcastPrefix, 20 - index);
  });

  return candidates;
}

function extractTextAfterLastAmount(value: string): string | null {
  const amountMatches = [...value.matchAll(KRW_AMOUNT_GLOBAL_PATTERN)];
  const lastAmountMatch = amountMatches.at(-1);
  if (!lastAmountMatch || lastAmountMatch.index === undefined) {
    return null;
  }

  return value.slice(lastAmountMatch.index + lastAmountMatch[0].length).trim();
}

function pushCandidate(
  candidates: MerchantCandidate[],
  text: string | null | undefined,
  priority: number,
) {
  const candidateText = text?.trim();
  if (!candidateText) {
    return;
  }

  candidates.push({ priority, text: candidateText });
}

function cleanMerchantName(value: string): string {
  return value
    .replace(BROADCAST_PREFIX_PATTERN, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(DATE_TIME_PATTERN, "")
    .replace(KRW_AMOUNT_PATTERN, "")
    .replace(/\(\s*일시불\s*\)/g, "")
    .replace(/일시불\/?/g, "")
    .replace(/누적[:\-\s]?\d[\d,]*원?/g, "")
    .replace(/잔액[:\-\s]?\d[\d,]*원?/g, "")
    .replace(CARD_MASK_PATTERN, "")
    .replace(PERSON_NAME_PATTERN, "")
    .replace(
      /^(?:KEB하나|하나|KB국민체크|KB국민카드|KB|삼성가족카드|삼성법인|삼성|신한카드|농협BC|씨티BC|현대카드)[^\s]*/i,
      "",
    )
    .replace(CORPORATE_PREFIX_PATTERN, "")
    .replace(MERCHANT_SUFFIX_PATTERN, "")
    .replace(/[.。]+$/g, "")
    .replace(/[()]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(CORPORATE_PREFIX_PATTERN, "")
    .replace(MERCHANT_SUFFIX_PATTERN, "")
    .trim();
}

function isValidMerchantCandidate(value: string): boolean {
  if (value.length < 2) {
    return false;
  }

  if (MERCHANT_BLOCKLIST_PATTERN.test(value)) {
    return false;
  }

  if (PLAIN_AMOUNT_LINE_PATTERN.test(value)) {
    return false;
  }

  if (FOREIGN_AMOUNT_PATTERN.test(value)) {
    return false;
  }

  return /[가-힣a-zA-Z]/.test(value);
}
