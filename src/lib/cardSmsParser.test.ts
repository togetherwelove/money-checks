import { describe, expect, it } from "vitest";

import { isLikelyCardSms, parseCardSms, resolveParsedCardSmsIsoDate } from "./cardSmsParser";

type CardSmsParserCase = {
  amount: number | null;
  day: number | null;
  merchantName: string | null;
  message: string;
  month: number | null;
};

const CARD_SMS_PARSER_CASES: readonly CardSmsParserCase[] = [
  {
    amount: 1500,
    day: null,
    merchantName: "마노핀익스프레스신림",
    month: null,
    message: `
[Web발신]
[현대카드]-승인
김재*님
1,500원(일시불)
마노핀익스프레스신림
누적:354,220원
`,
  },
  {
    amount: 3500,
    day: 6,
    merchantName: "씨유판교",
    month: 4,
    message: `
[Web발신]
하나(6*8*)김*호님 04/06 15:26 씨유판교 일시불/3,500원/누적-4,645원
`,
  },
  {
    amount: 2200,
    day: 25,
    merchantName: "미니스톱판교점",
    month: 3,
    message: `
[Web발신]
KB국민카드 2*5*
정*욱님
03/25 09:30
2,200원
미니스톱판교점
누적 97,440원
`,
  },
  {
    amount: 13000,
    day: 8,
    merchantName: "개성",
    month: 4,
    message: `
[Web발신]
[KB]04/08 21:27
078501**554
주식회사개성
체크카드출금
13,000
`,
  },
  {
    amount: 10000,
    day: 24,
    merchantName: "소문난우동",
    month: 3,
    message: `
[Web발신]
삼성가족카드승인9785
03/24 18:45
10,000원
일시불
소문난우동
`,
  },
  {
    amount: 30000,
    day: 23,
    merchantName: "이니",
    month: 3,
    message: `
[Web발신]
KEB하나 박솔*님 4*6*
일시불 30,000원
(주)이니 03/23 09:58
누적 2,368,397원
`,
  },
  {
    amount: 22000,
    day: 23,
    merchantName: "매일식당",
    month: 1,
    message: `
[체크.승인]
22,000원
씨티BC(1*9*)김*정님
01/23 12:34
매일식당
`,
  },
  {
    amount: 81400,
    day: 14,
    merchantName: "버거킹 판교유스페",
    month: 4,
    message: `
[Web발신]
농협BC(4*8*)오*름님.
04/14 11:51.
일시불81,400원.
누적금액679,780원.
버거킹 판교유스페
`,
  },
  {
    amount: 3400,
    day: null,
    merchantName: "SK플래닛판교마트",
    month: null,
    message: `
[Web발신]
[현대카드]-승인
***님
3,400원(일시불)
SK플래닛판교마트
누적:612,900원
`,
  },
  {
    amount: 20000,
    day: 24,
    merchantName: "효소원판교점",
    month: 4,
    message: `
[Web발신]
KB국민체크(6*3*)
***님
04/24 12:13
20,000원
효소원판교점 사용
`,
  },
  {
    amount: 16000,
    day: 22,
    merchantName: "찌개애감동",
    month: 4,
    message: `
[Web발신]
김*호님
삼성법인6265
04/22 19:56
찌개애감동
16,000원
일시불
잔액
4,968,160원
`,
  },
  {
    amount: 10000,
    day: 18,
    merchantName: "롯데쇼핑",
    month: 4,
    message: `
[Web발신]
KEB하나  박우*님 7*5* 일시불     10,000원 롯데쇼핑( 04/18 18:49
`,
  },
  {
    amount: 39500,
    day: 27,
    merchantName: "페어몬트",
    month: 4,
    message: `
[Web발신]
신한카드승인 강*혜(9*0*) 04/27 21:31 (일시불)39,500원 (주)페어몬트 누적688,800원
`,
  },
  {
    amount: 87000,
    day: 30,
    merchantName: "이꾸 정자점",
    month: 4,
    message: `
[Web발신]
KB국민체크(17)
강*혜님
04/30 22:34
87,000원
이꾸　정자점 사용
`,
  },
  {
    amount: 2400,
    day: 8,
    merchantName: "365PLUS정자",
    month: 5,
    message: `
[Web발신]
[KB]05/08 21:44
078501**554
365PLUS정자
체크카드출금
2,400
`,
  },
  {
    amount: 4350,
    day: 17,
    merchantName: "대성할인마트",
    month: 5,
    message: `
[Web발신]
[KB]05/17 12:33
435002**739
대성할인마트
체크카드출금
4,350
잔액3,172,018
`,
  },
  {
    amount: 320000,
    day: 29,
    merchantName: "우리동물메디컬",
    month: 5,
    message: `
[Web발신]
KB*카드
김재호님
05/29 20:52
320,000원
우리동물메디컬 취소
누적 560,060원
`,
  },
  {
    amount: null,
    day: 16,
    merchantName: "미국 GOOGLE",
    month: 10,
    message: `
[Web발신]
KB국민카드
김*호님
10/16 04:39
475.54(US$)
미국   GOOGLE * 승인
`,
  },
  {
    amount: 28680,
    day: null,
    merchantName: null,
    month: null,
    message: `
[Web발신]
[SSG.COM 주문완료]
▶상품명:코카콜라 1.8L*12...
▶결제금액:28,680원
`,
  },
  {
    amount: 699200,
    day: null,
    merchantName: "BSP대한항공",
    month: null,
    message: `
[Web발신]
[현대카드]-승인
김재*님
699,200원(일시불)
BSP대한항공(￦)
누적:844,350원
`,
  },
];

describe("parseCardSms", () => {
  it.each(CARD_SMS_PARSER_CASES)(
    "parses card SMS merchant, amount, and date %#",
    ({ amount, day, merchantName, message, month }) => {
      expect(parseCardSms(message)).toMatchObject({
        amount,
        day,
        merchantName,
        month,
      });
    },
  );
});

describe("resolveParsedCardSmsIsoDate", () => {
  it("resolves month and day with the current year", () => {
    expect(resolveParsedCardSmsIsoDate({ day: 25, month: 4 }, new Date(2026, 0, 1))).toBe(
      "2026-04-25",
    );
  });

  it("returns null for invalid dates", () => {
    expect(resolveParsedCardSmsIsoDate({ day: 31, month: 2 }, new Date(2026, 0, 1))).toBeNull();
  });
});

describe("isLikelyCardSms", () => {
  it("accepts card approval SMS text", () => {
    expect(isLikelyCardSms(CARD_SMS_PARSER_CASES[0].message)).toBe(true);
  });

  it("rejects ordinary clipboard text", () => {
    expect(isLikelyCardSms("장보기 목록\n우유\n계란")).toBe(false);
  });
});
