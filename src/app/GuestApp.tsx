import { getAppNavigationTheme } from "../lib/navigationTheme";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../components/ActionButton";
import { AppNativeHeaderTitle } from "../components/AppNativeHeaderTitle";
import { LedgerEntryAppendRow } from "../components/LedgerEntryAppendRow";
import { EntryHeaderDatePicker as HeaderDatePicker } from "../components/entryComposer/EntryHeaderDatePicker";
import { CalendarSummaryModes } from "../constants/calendarSummary";
import { getAppColors } from "../constants/colors";
import { GuestCopy } from "../constants/guest";
import { AppLayout } from "../constants/layout";
import { FooterTabBarUi } from "../constants/menu";
import { getFormLabelTextStyle, ResponsivePageContentStyle } from "../constants/uiStyles";
import { BottomContentInsetContext } from "../contexts/BottomContentInsetContext";
import { ExpenseTextColorProvider } from "../contexts/ExpenseTextColorContext";
import { useGuestHomeState } from "../hooks/useGuestHomeState";
import { getAppScreenLabel } from "../lib/appScreenLabels";
import { createCalendarTodayButton } from "../lib/calendarTodayButton";
import { HomeScreen } from "../screens/HomeScreen";
import { SignedInTabNavigator } from "./SignedInTabNavigator";
import type { PrimaryStackScreen } from "./signedInNavigation";

const Stack = createNativeStackNavigator<{ home: undefined }>();
const badges: [] = [];
const ignore = () => {};
const ignoreAsync = async () => true;

type Props = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onLogin: () => void;
  onRegister: () => void;
};

function GuestTab({ screen, ...props }: Props & { screen: PrimaryStackScreen }) {
  const styles = getStyles();
  useAppTheme();
  const state = useGuestHomeState(props.selectedDate, props.onSelectDate);
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: getAppColors().screenBackground },
          contentStyle: { backgroundColor: getAppColors().screenBackground },
        }}
      >
        <Stack.Screen
          name="home"
          options={{
            unstable_headerRightItems:
              screen === "calendar"
                ? () => [createCalendarTodayButton(props.selectedDate, props.onSelectDate)]
                : undefined,
            headerTitle: () =>
              screen === "calendar" ? (
                <HeaderDatePicker
                  variant="navigation"
                  selectedDate={props.selectedDate}
                  onSelectDate={props.onSelectDate}
                />
              ) : (
                <AppNativeHeaderTitle title={getAppScreenLabel(screen)} />
              ),
          }}
        >
          {() =>
            screen === "calendar" ? (
              <HomeScreen
                state={state}
                calendarSummaryMode={CalendarSummaryModes.monthly}
                isCalendarHeatmapEnabled={false}
                showsBannerAd={false}
                screenTitle={() => null}
                onSelectCalendarDate={props.onSelectDate}
                onDeleteSelectedEntry={ignoreAsync}
                onDuplicateEntry={ignore}
                onEditSelectedEntry={ignore}
                onPrepayInstallmentEntry={ignoreAsync}
                entryAppend={
                  <LedgerEntryAppendRow
                    selectedDate={props.selectedDate}
                    disabled={false}
                    hintLabel={GuestCopy.entryHint}
                    clipboardDraft={null}
                    onAdd={props.onRegister}
                    onApplyClipboard={ignore}
                    onDismissClipboard={ignore}
                  />
                }
              />
            ) : (
              <View style={styles.prompt}>
                <Text style={styles.message}>{GuestCopy.accountHint}</Text>
                <ActionButton
                  label={GuestCopy.login}
                  size="large"
                  variant="primary"
                  onPress={props.onLogin}
                />
              </View>
            )
          }
        </Stack.Screen>
      </Stack.Navigator>
    </>
  );
}

export function GuestApp(props: Props) {
  useAppTheme();
  const [footerHeight, setFooterHeight] = useState(0);
  return (
    <ExpenseTextColorProvider>
      <BottomContentInsetContext.Provider value={FooterTabBarUi.contentBottomGap + footerHeight}>
        <NavigationContainer theme={getAppNavigationTheme()}>
          <SignedInTabNavigator
            disabled={false}
            badges={badges}
            onFooterHeightChange={setFooterHeight}
            renderGuestScreen={(screen) => <GuestTab screen={screen} {...props} />}
          />
        </NavigationContainer>
      </BottomContentInsetContext.Provider>
    </ExpenseTextColorProvider>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    prompt: {
      ...ResponsivePageContentStyle,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: AppLayout.screenPadding,
      gap: AppLayout.cardGap,
    },
    message: { ...getFormLabelTextStyle(), textAlign: "center" },
  }),
);
