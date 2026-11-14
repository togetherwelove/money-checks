import { createThemeValue } from "../../lib/appTheme";
import { StyleSheet } from "react-native";

import { AuthControls } from "../../constants/authControls";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";
import { getFormInputTextStyle } from "../../constants/uiStyles";

export const getSharedLedgerPanelStyles = createThemeValue(() =>
  StyleSheet.create({
    panel: {
      gap: AppLayout.cardContentPadding,
    },
    section: {
      gap: 8,
      borderWidth: AppLayout.dividerWidth,
      borderColor: getAppColors().border,
      borderRadius: AppLayout.groupRadius,
      backgroundColor: getAppColors().screenBackground,
      overflow: "hidden",
    },
    primarySection: {
      backgroundColor: getAppColors().surfaceMuted,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: AuthControls.inlineControlHeight,
      paddingHorizontal: AppLayout.cardContentPadding,
      paddingTop: AppLayout.cardContentPadding,
    },
    sectionContent: {
      paddingHorizontal: AppLayout.cardContentPadding,
    },
    sectionContentInset: {
      gap: 8,
      paddingHorizontal: AppLayout.cardContentPadding,
      paddingVertical: AppLayout.cardContentPadding,
    },
    sectionBottomInset: {
      paddingBottom: AppLayout.cardContentPadding,
    },
    sectionTitle: {
      color: getAppColors().text,
      fontSize: SharedLedgerPanelUi.sectionTitleFontSize,
      fontWeight: "800",
      includeFontPadding: false,
      lineHeight: SharedLedgerPanelUi.sectionTitleLineHeight,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 6,
      minHeight: AuthControls.inlineControlHeight,
    },
    bookName: {
      flexShrink: 1,
      color: getAppColors().text,
      fontSize: SharedLedgerPanelUi.sectionTitleFontSize,
      fontWeight: "800",
    },
    bookNameHeaderTitle: {
      flex: 1,
    },
    bookNameRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 6,
    },
    bookNameEditRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      flex: 1,
      gap: 8,
    },
    bookNameHeaderInput: {
      ...getFormInputTextStyle(),
      flex: 1,
    },
    bookNameActionSlot: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    bookNameCancelAction: {
      color: getAppColors().mutedText,
      fontSize: 13,
      fontWeight: "700",
    },
    codeBlock: {
      gap: 8,
      paddingHorizontal: AppLayout.cardContentPadding,
    },
    shareCodePreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    shareCodePreviewValue: {
      color: getAppColors().mutedStrongText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    shareCodeRow: {
      flexDirection: "row",
    },
    copyActionContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SharedLedgerPanelUi.copyActionGap,
    },
    copyActionText: {
      color: getAppColors().onPrimary,
      fontSize: SharedLedgerPanelUi.copyActionTextFontSize,
      fontWeight: "700",
    },
    helpText: {
      color: getAppColors().mutedText,
      fontSize: 12,
      lineHeight: 18,
    },
    hintText: {
      color: getAppColors().mutedStrongText,
      fontSize: 11,
      includeFontPadding: false,
      lineHeight: 16,
    },
    input: {
      paddingHorizontal: 0,
      paddingVertical: 10,
      borderWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: getAppColors().border,
      borderRadius: 0,
      backgroundColor: getAppColors().transparent,
      color: getAppColors().text,
      fontSize: 16,
      textTransform: "uppercase",
    },
    disabledInput: {
      opacity: 0.55,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    successText: {
      color: getAppColors().success,
    },
    errorText: {
      color: getAppColors().expense,
    },
    actionRow: {
      paddingTop: 2,
    },
    ledgerBookList: {
      gap: 0,
      paddingHorizontal: AppLayout.cardContentPadding,
    },
    ledgerBookMembersBlock: {
      paddingTop: SharedLedgerPanelUi.ledgerBookMembersBlockTopPadding,
    },
    ledgerBookItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: getAppColors().border,
      borderRadius: 0,
      backgroundColor: getAppColors().screenBackground,
    },
    activeLedgerBookItem: {
      borderBottomColor: getAppColors().primary,
      backgroundColor: getAppColors().surfaceMuted,
    },
    readOnlyLedgerBookItem: {
      opacity: 0.78,
    },
    ledgerBookItemContent: {
      flex: 1,
      gap: 5,
    },
    ledgerBookItemNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    ledgerBookItemName: {
      flexShrink: 1,
      color: getAppColors().text,
      fontSize: 14,
      fontWeight: "800",
    },
    activeLedgerBookItemName: {
      color: getAppColors().primary,
    },
    readOnlyLedgerBookChip: {
      borderRadius: 999,
      backgroundColor: getAppColors().surfaceStrong,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    readOnlyLedgerBookChipText: {
      color: getAppColors().expense,
      fontSize: 10,
      fontWeight: "800",
    },
    ledgerBookItemMeta: {
      color: getAppColors().mutedStrongText,
      fontSize: 11,
      fontWeight: "600",
    },
    ledgerBookItemMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    pendingRequestBadge: {
      width: SharedLedgerPanelUi.pendingRequestBadgeSize,
      height: SharedLedgerPanelUi.pendingRequestBadgeSize,
      borderRadius: SharedLedgerPanelUi.pendingRequestBadgeSize / 2,
      backgroundColor: getAppColors().expense,
    },
    createBookRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: AppLayout.cardContentPadding,
    },
    createBookInput: {
      ...getFormInputTextStyle(),
      flex: 1,
    },
    disconnectActionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: AppLayout.cardContentPadding,
      paddingTop: 2,
    },
    subsection: {
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: getAppColors().border,
      paddingTop: AppLayout.cardContentPadding,
    },
  }),
);
