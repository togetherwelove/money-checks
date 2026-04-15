import type { MonthPage } from "../../components/monthCalendarPager/monthCalendarPagerUtils";
import type {
  LedgerEntry,
  LedgerEntryDraft,
  LedgerEntryType,
  MonthlyInsights,
  MonthlyLedgerSummary,
} from "../../types/ledger";
import type { LedgerBook } from "../../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  LedgerBookJoinRequest,
} from "../../types/ledgerBookJoinRequest";

export type BusyTaskTracker = <T>(task: () => Promise<T>) => Promise<T>;

export type ChartMonthData = {
  key: string;
  monthlyInsights: MonthlyInsights;
  monthlyLedger: MonthlyLedgerSummary;
  title: string;
};

export type LedgerScreenState = {
  activeBook: LedgerBook | null;
  currentChartMonth: ChartMonthData;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  errorMessage: string | null;
  currentMonthPage: MonthPage;
  entries: LedgerEntry[];
  isBusy: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  joinSharedLedgerBookByCode: (shareCode: string) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  monthlyLedger: MonthlyLedgerSummary;
  monthlyInsights: MonthlyInsights;
  nextMonthPage: MonthPage;
  nextChartMonth: ChartMonthData;
  pendingJoinRequests: LedgerBookJoinRequest[];
  previousMonthPage: MonthPage;
  previousChartMonth: ChartMonthData;
  approveLedgerJoinRequest: (requestId: string) => Promise<boolean>;
  rejectLedgerJoinRequest: (requestId: string) => Promise<boolean>;
  removeSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  refreshLedger: () => Promise<void>;
  refreshSharedLedgerBook: () => Promise<void>;
  selectedDate: string;
  selectedEntries: LedgerEntry[];
  setVisibleMonth: (nextMonth: Date) => void;
  visibleMonth: Date;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  handleEditEntry: (entry: LedgerEntry) => void;
  handleSaveEntry: () => Promise<LedgerEntry[]>;
  handleSaveEntryDrafts: (drafts: LedgerEntryDraft[]) => Promise<LedgerEntry[]>;
  handleSettleInstallmentEntry: (entry: LedgerEntry) => Promise<LedgerEntry | null>;
  handleSelectDate: (isoDate: string) => void;
  resetEditor: (isoDate: string) => void;
  updateDraftField: (field: keyof LedgerEntryDraft, value: string) => void;
  updateDraftInstallmentMonths: (installmentMonths: number) => void;
  updateDraftType: (type: LedgerEntryType) => void;
};
