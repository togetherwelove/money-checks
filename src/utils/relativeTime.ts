import { resolveStaticCopyLanguage } from "../i18n/staticCopy";

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
const SECONDS_PER_WEEK = SECONDS_PER_DAY * DAYS_PER_WEEK;
const SECONDS_PER_MONTH = SECONDS_PER_DAY * DAYS_PER_MONTH;
const SECONDS_PER_YEAR = SECONDS_PER_MONTH * MONTHS_PER_YEAR;

type RelativeTimeUnit = "day" | "hour" | "minute" | "month" | "second" | "week" | "year";

const KoreanRelativeTimeCopy = {
  now: "방금 전",
  futureSuffix: "후",
  pastSuffix: "전",
  units: {
    day: "일",
    hour: "시간",
    minute: "분",
    month: "개월",
    second: "초",
    week: "주",
    year: "년",
  },
} as const;

const EnglishRelativeTimeCopy = {
  now: "just now",
  futurePrefix: "in",
  pastSuffix: "ago",
  units: {
    day: "day",
    hour: "hour",
    minute: "minute",
    month: "month",
    second: "second",
    week: "week",
    year: "year",
  },
} as const;

export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const timeValue = date.getTime();

  if (Number.isNaN(timeValue)) {
    return "";
  }

  const diffSeconds = Math.round((timeValue - now.getTime()) / MILLISECONDS_PER_SECOND);
  const absoluteSeconds = Math.abs(diffSeconds);

  if (absoluteSeconds < SECONDS_PER_MINUTE) {
    return formatRelativeTimeValue(diffSeconds, "second");
  }

  if (absoluteSeconds < SECONDS_PER_HOUR) {
    return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_MINUTE), "minute");
  }

  if (absoluteSeconds < SECONDS_PER_DAY) {
    return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_HOUR), "hour");
  }

  if (absoluteSeconds < SECONDS_PER_WEEK) {
    return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_DAY), "day");
  }

  if (absoluteSeconds < SECONDS_PER_MONTH) {
    return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_WEEK), "week");
  }

  if (absoluteSeconds < SECONDS_PER_YEAR) {
    return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_MONTH), "month");
  }

  return formatRelativeTimeValue(Math.round(diffSeconds / SECONDS_PER_YEAR), "year");
}

function formatRelativeTimeValue(value: number, unit: RelativeTimeUnit): string {
  if (value === 0) {
    return resolveStaticCopyLanguage() === "en"
      ? EnglishRelativeTimeCopy.now
      : KoreanRelativeTimeCopy.now;
  }

  const absoluteValue = Math.abs(value);
  const isFuture = value > 0;

  if (resolveStaticCopyLanguage() === "en") {
    const unitLabel = EnglishRelativeTimeCopy.units[unit];
    const pluralizedUnitLabel = absoluteValue === 1 ? unitLabel : `${unitLabel}s`;
    return isFuture
      ? `${EnglishRelativeTimeCopy.futurePrefix} ${absoluteValue} ${pluralizedUnitLabel}`
      : `${absoluteValue} ${pluralizedUnitLabel} ${EnglishRelativeTimeCopy.pastSuffix}`;
  }

  const unitLabel = KoreanRelativeTimeCopy.units[unit];
  return isFuture
    ? `${absoluteValue}${unitLabel} ${KoreanRelativeTimeCopy.futureSuffix}`
    : `${absoluteValue}${unitLabel} ${KoreanRelativeTimeCopy.pastSuffix}`;
}
