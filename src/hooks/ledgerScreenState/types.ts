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

export type LedgerScreenState = {
  activeBook: LedgerBook | null;
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
  pendingJoinRequests: LedgerBookJoinRequest[];
  previousMonthPage: MonthPage;
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
  handleSaveEntry: () => Promise<LedgerEntry | null>;
  handleSelectDate: (isoDate: string) => void;
  resetEditor: (isoDate: string) => void;
  updateDraftField: (field: keyof LedgerEntryDraft, value: string) => void;
  updateDraftType: (type: LedgerEntryType) => void;
};
