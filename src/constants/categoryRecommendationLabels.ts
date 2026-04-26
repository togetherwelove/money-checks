import type { LedgerEntryType } from "../types/ledger";
import { EXPENSE_CATEGORY_LABELS } from "./expenseCategories";
import { INCOME_CATEGORY_LABELS } from "./incomeCategories";

export type CategoryRecommendationLabel = {
  category: string;
  entryType: LedgerEntryType;
  keywords: readonly string[];
};

export const CATEGORY_RECOMMENDATION_LABELS = [
  {
    category: EXPENSE_CATEGORY_LABELS.food,
    entryType: "expense",
    keywords: [
      "마트",
      "슈퍼",
      "식자재",
      "농협",
      "축산",
      "정육",
      "청과",
      "수산",
      "반찬",
      "편의점",
      "gs25",
      "cu",
      "세븐일레븐",
      "이마트",
      "홈플러스",
      "롯데마트",
      "코스트코",
    ],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.dining,
    entryType: "expense",
    keywords: [
      "식당",
      "한식",
      "중식",
      "일식",
      "분식",
      "치킨",
      "피자",
      "버거",
      "카페",
      "커피",
      "베이커리",
      "술집",
      "호프",
      "포차",
      "배달",
      "요기요",
      "배민",
      "쿠팡이츠",
    ],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.transport,
    entryType: "expense",
    keywords: [
      "주유",
      "충전소",
      "택시",
      "버스",
      "지하철",
      "철도",
      "고속도로",
      "하이패스",
      "주차",
      "카카오t",
      "쏘카",
      "그린카",
    ],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.shopping,
    entryType: "expense",
    keywords: [
      "쿠팡",
      "네이버페이",
      "11번가",
      "g마켓",
      "옥션",
      "무신사",
      "올리브영",
      "다이소",
      "백화점",
      "아울렛",
      "몰",
    ],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.medical,
    entryType: "expense",
    keywords: ["병원", "의원", "약국", "치과", "한의원", "검진", "의료원", "동물병원"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.beauty,
    entryType: "expense",
    keywords: ["미용", "헤어", "네일", "피부", "왁싱", "바버", "염색"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.living,
    entryType: "expense",
    keywords: ["월세", "관리비", "부동산", "인테리어", "가구", "세탁소", "철물", "수리"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.publicUtilities,
    entryType: "expense",
    keywords: ["전기", "가스", "수도", "통신", "인터넷", "휴대폰", "보험료", "도시가스"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.subscription,
    entryType: "expense",
    keywords: [
      "넷플릭스",
      "유튜브",
      "디즈니",
      "spotify",
      "apple",
      "구독",
      "멜론",
      "티빙",
      "웨이브",
      "쿠팡플레이",
    ],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.leisure,
    entryType: "expense",
    keywords: ["영화", "극장", "공연", "여행", "숙박", "호텔", "펜션", "게임", "노래방", "헬스"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.education,
    entryType: "expense",
    keywords: ["학원", "교육", "도서", "서점", "강의", "인강", "교재", "문구"],
  },
  {
    category: EXPENSE_CATEGORY_LABELS.occasion,
    entryType: "expense",
    keywords: ["경조", "축의", "조의", "선물", "화환", "꽃", "기프티콘"],
  },
  {
    category: INCOME_CATEGORY_LABELS.salary,
    entryType: "income",
    keywords: ["급여", "월급", "보수", "임금", "연봉"],
  },
  {
    category: INCOME_CATEGORY_LABELS.sideIncome,
    entryType: "income",
    keywords: ["부업", "외주", "프리랜서", "알바", "수당"],
  },
  {
    category: INCOME_CATEGORY_LABELS.bonus,
    entryType: "income",
    keywords: ["상여", "성과", "보너스", "인센티브"],
  },
  {
    category: INCOME_CATEGORY_LABELS.resale,
    entryType: "income",
    keywords: ["중고", "당근", "번개장터", "판매"],
  },
  {
    category: INCOME_CATEGORY_LABELS.refund,
    entryType: "income",
    keywords: ["환불", "환급", "취소", "캐시백", "정산"],
  },
  {
    category: INCOME_CATEGORY_LABELS.interest,
    entryType: "income",
    keywords: ["이자", "배당", "예금", "적금"],
  },
] as const satisfies readonly CategoryRecommendationLabel[];
