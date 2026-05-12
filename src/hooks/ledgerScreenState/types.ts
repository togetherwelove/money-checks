import type { MonthPage } from "../../components/monthCalendarPager/monthCalendarPagerUtils";
import type {
  LedgerEntry,
  LedgerEntryDraft,
  LedgerEntryPhotoAttachment,
  LedgerEntryType,
  MonthlyInsights,
  MonthlyLedgerSummary,
} from "../../types/ledger";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
  LedgerBookJoinRequestCountByBookId,
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
  accessibleBooks: AccessibleLedgerBook[];
  currentChartMonth: ChartMonthData;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  errorMessage: string | null;
  currentMonthPage: MonthPage;
  entries: LedgerEntry[];
  isBusy: boolean;
  isLoading: boolean;
  isLoadingSelectedDateEntries: boolean;
  isRefreshing: boolean;
  createLedgerBook: (nextName: string) => Promise<boolean>;
  joinSharedLedgerBookByCode: (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  monthlyLedger: MonthlyLedgerSummary;
  monthlyInsights: MonthlyInsights;
  nextMonthPage: MonthPage;
  nextChartMonth: ChartMonthData;
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  pendingJoinRequests: LedgerBookJoinRequest[];
  previousMonthPage: MonthPage;
  previousChartMonth: ChartMonthData;
  previewSharedLedgerBookJoinByCode: (shareCode: string) => Promise<JoinSharedLedgerBookPreview>;
  approveLedgerJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  rejectLedgerJoinRequest: (requestId: string) => Promise<boolean>;
  removeSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  renameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  refreshLedger: () => Promise<void>;
  refreshSharedLedgerBook: () => Promise<void>;
  selectedDate: string;
  selectedEntries: LedgerEntry[];
  selectedDateNote: string;
  setVisibleMonth: (nextMonth: Date) => void;
  switchLedgerBook: (bookId: string) => Promise<boolean>;
  visibleMonth: Date;
  handleDeleteSelectedDateNote: () => Promise<void>;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  handleEditEntry: (entry: LedgerEntry) => void;
  handleSaveDraftEntry: (draft: LedgerEntryDraft) => Promise<LedgerEntry[]>;
  handleSaveSelectedDateNote: (note: string) => Promise<void>;
  handleSaveEntry: () => Promise<LedgerEntry[]>;
  handleSettleInstallmentEntry: (entry: LedgerEntry) => Promise<LedgerEntry | null>;
  handleSelectDate: (isoDate: string) => void;
  resetEditor: (isoDate: string) => void;
  updateDraftField: (field: keyof LedgerEntryDraft, value: string) => void;
  updateDraftInstallmentMonths: (installmentMonths: number) => void;
  updateDraftPhotoAttachments: (nextPhotoAttachments: LedgerEntryPhotoAttachment[]) => void;
  updateDraftType: (type: LedgerEntryType) => void;
};
