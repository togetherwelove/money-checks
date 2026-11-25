import { StyleSheet } from "react-native";
import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";
import { getSettingsGroupStyles, SettingsGroupDesign as Group } from "./settingsGroupStyles";
import { SubscriptionPageDesign as Design } from "./subscriptionPage";

export const getSubscriptionPageStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: getAppColors().screenBackground },
    content: { ...getSettingsGroupStyles().page, flexGrow: 1 },
    sections: { gap: Group.sectionGap },
    intro: {
      gap: Group.titleGap,
      paddingHorizontal: Group.horizontalPadding,
      paddingTop: Group.verticalPadding,
    },
    headline: {
      color: getAppColors().text,
      fontSize: Design.headlineFontSize,
      lineHeight: Design.headlineLineHeight,
      fontWeight: "600",
    },
    description: {
      color: getAppColors().mutedText,
      fontSize: Group.descriptionFontSize,
      lineHeight: Group.descriptionLineHeight,
    },
    benefits: { paddingHorizontal: Group.horizontalPadding },
    benefit: {
      flexDirection: "row",
      alignItems: "center",
      gap: Group.contentGap,
      paddingVertical: Design.benefitVerticalPadding,
    },
    benefitDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: getAppColors().border,
    },
    benefitContent: { flex: 1, minWidth: 0, gap: Group.textGap },
    benefitTitle: { ...getSettingsGroupStyles().label, fontWeight: "500" },
    benefitValue: {
      ...getSettingsGroupStyles().label,
      color: getAppColors().primary,
      fontWeight: "600",
    },
    plan: {
      ...getSettingsGroupStyles().card,
      backgroundColor: getAppColors().surfaceMuted,
      padding: Group.horizontalPadding,
      gap: Group.verticalPadding,
    },
    planHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Group.contentGap,
    },
    planTitle: { ...getSettingsGroupStyles().label, fontWeight: "600" },
    price: {
      color: getAppColors().text,
      fontSize: Design.priceFontSize,
      lineHeight: Design.priceLineHeight,
      fontWeight: "600",
    },
    activeState: {
      ...getSettingsGroupStyles().label,
      color: getAppColors().primary,
      textAlign: "center",
      paddingVertical: Group.rowVerticalPadding,
    },
    details: { gap: Group.titleGap, paddingHorizontal: Group.horizontalPadding },
    legalLinks: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      columnGap: Group.contentGap,
      rowGap: Group.titleGap,
      paddingTop: Group.titleGap,
    },
  }),
);
