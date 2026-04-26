import { CATEGORY_RECOMMENDATION_LABELS } from "../constants/categoryRecommendationLabels";
import type { LedgerEntryType } from "../types/ledger";

export type CategoryRecommendationInput = {
  content: string;
  entryType: LedgerEntryType;
};

export type CategoryRecommendation = {
  category: string;
  matchedKeyword: string;
};

export function recommendCategory({
  content,
  entryType,
}: CategoryRecommendationInput): CategoryRecommendation | null {
  const normalizedContent = normalizeCategoryRecommendationText(content);
  if (!normalizedContent) {
    return null;
  }

  for (const label of CATEGORY_RECOMMENDATION_LABELS) {
    if (label.entryType !== entryType) {
      continue;
    }

    const matchedKeyword = label.keywords.find((keyword) =>
      normalizedContent.includes(normalizeCategoryRecommendationText(keyword)),
    );
    if (matchedKeyword) {
      return {
        category: label.category,
        matchedKeyword,
      };
    }
  }

  return null;
}

function normalizeCategoryRecommendationText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]<>.,/\\|·ㆍ・:;'"`~!@#$%^&*_+=?-]/g, "");
}
