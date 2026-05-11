import type { ko } from "./ko";

export const en = {
  common: {
    cancel: "Cancel",
    confirm: "OK",
    save: "Save",
  },
  footer: {
    tabs: {
      allEntries: "Entries",
      calendar: "Calendar",
      charts: "Charts",
      entry: "Add",
      export: "Export",
    },
  },
  language: {
    cardTitle: "Language / Currency",
    currencySelectLabel: "Display Currency",
    deviceDefault: "The first language is selected from your device settings.",
    english: "English",
    korean: "한국어",
    languageSelectLabel: "Language",
    restartNotice: "Fully restart the app to apply the selected language to every screen.",
    screenTitle: "Language",
    selected: "Selected",
    systemSectionTitle: "Language Settings",
  },
  currency: {
    KRW: "KRW (₩)",
    USD: "USD ($)",
  },
  menu: {
    sections: {
      account: "Account & Alerts",
      ledger: "Export",
      support: "Plans & Support",
    },
  },
  screens: {
    account: "Account",
    allEntries: "All Entries",
    calendar: "Calendar",
    charts: "Charts",
    contactSupport: "Contact Support",
    entry: "Add Entry",
    help: "Help",
    languageSettings: "Language",
    notificationSettings: "Alert Settings",
    share: "Sharing",
    subscription: "Subscription",
    support: "Support",
  },
  categories: {
    expense: {
      beauty: "Beauty",
      dining: "Dining",
      education: "Edu.",
      food: "Food",
      leisure: "Leisure",
      living: "Living",
      medical: "Medical",
      occasion: "Events",
      other: "Other",
      publicUtilities: "Utilities",
      shopping: "Shopping",
      subscription: "Sub.",
      transport: "Transit",
    },
    income: {
      bonus: "Bonus",
      interest: "Interest",
      other: "Other",
      refund: "Refund",
      resale: "Resale",
      salary: "Salary",
      sideIncome: "Side Income",
    },
  },
  push: {
    entryCreated: {
      body: "{{actorName}} added {{category}} {{amount}}.",
      title: "Entry Added",
    },
    expenseLimitExceeded: {
      body: "{{period}} expenses reached {{totalAmount}}.",
      title: "Expense Limit Exceeded",
    },
    fallbacks: {
      member: "Member",
      period: "period",
      sharedLedger: "shared ledger",
      uncategorized: "uncategorized",
    },
    joinRequest: {
      body: "{{requesterName}} requested access to {{bookName}}.",
      title: "Join Request",
    },
    memberJoinedBook: {
      body: "{{actorName}} joined {{bookName}}.",
      title: "Shared Ledger Member Joined",
    },
    memberLeftBook: {
      body: "{{actorName}} left {{bookName}}.",
      title: "Shared Ledger Member Left",
    },
    memberRemovedFromBook: {
      body: "{{actorName}} removed you from {{bookName}}.",
      title: "Removed from Shared Ledger",
    },
  },
} as const satisfies typeof ko;
