import { AppFontSize, AppLineHeight } from "../../constants/typography";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { createThemeValue } from "../../lib/appTheme";
import { StyleSheet } from "react-native";

import { AuthControls } from "../../constants/authControls";
import { getAppColors } from "../../constants/colors";
import { SharedLedgerPanelUi } from "../../constants/sharedLedgerPanel";

export const getSharedLedgerPanelStyles = createThemeValue(() =>
  StyleSheet.create({
    currentBookCapsule: {
      ...getSettingsGroupStyles().card,
      ...getSettingsGroupStyles().row,
      minHeight: SettingsGroupDesign.singleLineHeight,
      borderBottomWidth: SettingsGroupDesign.borderWidth,
      gap: SettingsGroupDesign.textGap,
    },
    membersDirectory: { paddingHorizontal: SettingsGroupDesign.horizontalPadding },
    bookListHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingEnd: SettingsGroupDesign.horizontalPadding,
    },
    otherBookList: { paddingHorizontal: SettingsGroupDesign.horizontalPadding },
    otherBookRow: {
      ...getSettingsGroupStyles().row,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: getAppColors().border,
      gap: SettingsGroupDesign.titleGap,
    },
    panel: {
      gap: SettingsGroupDesign.sectionGap,
    },
    section: { ...getSettingsGroupStyles().card, gap: SettingsGroupDesign.textGap },
    primarySection: { backgroundColor: getAppColors().surface },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: AuthControls.inlineControlHeight,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingTop: SettingsGroupDesign.verticalPadding,
      paddingBottom: SettingsGroupDesign.textGap,
    },
    sectionContent: {
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    sectionContentInset: {
      gap: 8,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.verticalPadding,
    },
    sectionBottomInset: {
      paddingBottom: SettingsGroupDesign.verticalPadding,
    },
    sectionTitle: getSettingsGroupStyles().label,
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 6,
      minHeight: AuthControls.inlineControlHeight,
    },
    bookName: { ...getSettingsGroupStyles().label, flexShrink: 1 },
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
      ...getSettingsGroupStyles().input,
      flex: 1,
    },
    bookNameActionSlot: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    bookNameCancelAction: {
      color: getAppColors().mutedText,
      fontSize: AppFontSize.body,
      fontWeight: "700",
    },
    codeBlock: {
      gap: 8,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    shareCodePreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    shareCodePreviewValue: {
      color: getAppColors().mutedStrongText,
      fontSize: AppFontSize.caption,
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    shareCodeRow: {
      flexDirection: "row",
    },
    capsuleActionContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      alignSelf: "stretch",
      gap: SettingsGroupDesign.contentGap,
    },
    capsuleActionText: getSettingsGroupStyles().label,
    helpText: {
      color: getAppColors().mutedText,
      fontSize: AppFontSize.caption,
      lineHeight: AppLineHeight.caption,
    },
    hintText: getSettingsGroupStyles().count,
    input: { ...getSettingsGroupStyles().input, textTransform: "uppercase" },
    disabledInput: {
      opacity: 0.55,
    },
    statusText: {
      fontSize: AppFontSize.caption,
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
      paddingStart: SettingsGroupDesign.horizontalPadding,
    },
    ledgerBookMembersBlock: {
      paddingTop: SharedLedgerPanelUi.ledgerBookMembersBlockTopPadding,
    },
    ledgerBookItem: {
      ...getSettingsGroupStyles().row,
      paddingStart: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: getAppColors().border,
    },
    lastLedgerBookItem: { borderBottomWidth: 0 },
    activeLedgerBookItem: {
      borderBottomColor: getAppColors().primary,
      backgroundColor: getAppColors().surface,
    },
    readOnlyLedgerBookItem: {
      opacity: 0.78,
    },
    ledgerBookItemContent: {
      flex: 1,
      minWidth: 0,
      gap: 5,
    },
    ledgerBookItemNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    ledgerBookItemName: { ...getSettingsGroupStyles().label, flexShrink: 1 },
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
      fontSize: AppFontSize.caption,
      fontWeight: "800",
    },
    ledgerBookItemMeta: {
      color: getAppColors().mutedStrongText,
      fontSize: AppFontSize.caption,
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
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    createBookInput: {
      ...getSettingsGroupStyles().input,
      flex: 1,
    },
    disconnectActionRow: {
      alignSelf: "flex-end",
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    subsection: {
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: getAppColors().border,
      paddingTop: SettingsGroupDesign.verticalPadding,
    },
  }),
);
