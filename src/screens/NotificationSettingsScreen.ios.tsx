import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Button, Host, List, RNHostView, Section, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import { Linking, StyleSheet, View } from "react-native";
import { NotificationThresholdField } from "../components/accountScreen/NotificationThresholdField";
import { AppSettingsCopy } from "../constants/appSettings";
import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { getNativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { NotificationSettingsScreenProps } from "./NotificationSettingsScreen";

const getRowModifiers = createThemeValue(() => getNativeSettingsStyles().row);
const getSectionTitleModifiers = createThemeValue(() => getNativeSettingsStyles().sectionTitle);
const getTitleModifiers = createThemeValue(() => getNativeSettingsStyles().title);
const getDescriptionModifiers = createThemeValue(() => getNativeSettingsStyles().description);

export function NotificationSettingsScreen(props: NotificationSettingsScreenProps) {
  const colorScheme = useAppTheme();
  const openNotificationPermission = () => {
    if (props.notificationPermissionState === "default")
      void props.onRequestNotificationPermission();
    else void Linking.openSettings();
  };
  const notificationPermissionContent = (
    <VStack alignment="leading" spacing={AppLayout.compactGap}>
      <Text modifiers={getTitleModifiers()}>{NotificationUiCopy.permissionSectionTitle}</Text>
      <Text modifiers={getDescriptionModifiers()}>{props.notificationPermissionLabel}</Text>
    </VStack>
  );
  return (
    <Host
      style={styles.screen}
      useViewportSizeMeasurement
      colorScheme={colorScheme}
      seedColor={getAppColors().primary}
    >
      <List modifiers={getNativeSettingsStyles().list}>
        {props.screenTitle ? (
          <RNHostView matchContents>
            <View>{props.screenTitle}</View>
          </RNHostView>
        ) : null}
        <Section
          header={
            <Text modifiers={getSectionTitleModifiers()}>
              {AppSettingsCopy.pushNotificationSectionTitle}
            </Text>
          }
        >
          {!props.showNotificationSettings ? (
            <Text modifiers={getDescriptionModifiers()}>
              {PushNotificationCopy.permissionUnsupported}
            </Text>
          ) : props.notificationPermissionState === "granted" ? (
            <VStack alignment="leading" modifiers={getRowModifiers()}>
              {notificationPermissionContent}
            </VStack>
          ) : (
            <Button onPress={openNotificationPermission} modifiers={getRowModifiers()}>
              {notificationPermissionContent}
            </Button>
          )}
          {props.notificationStatusMessage ? (
            <Text modifiers={getDescriptionModifiers()}>{props.notificationStatusMessage}</Text>
          ) : null}
        </Section>
        {props.showNotificationSettings
          ? props.notificationPreferenceGroups.map((group) => (
              <Section
                key={group.id}
                header={<Text modifiers={getSectionTitleModifiers()}>{group.title}</Text>}
              >
                {group.thresholdSettings ? (
                  <VStack alignment="leading" modifiers={getRowModifiers()}>
                    <RNHostView matchContents={{ vertical: true }}>
                      <NotificationThresholdField
                        embeddedInNativeRow
                        settings={group.thresholdSettings}
                        onChangePeriod={props.onChangeNotificationThresholdPeriod}
                        onChangeValue={(value) =>
                          props.onChangeNotificationThreshold(
                            group.thresholdSettings!.selectedKey,
                            value,
                          )
                        }
                        onToggleEnabled={props.onChangeNotificationThresholdEnabled}
                      />
                    </RNHostView>
                  </VStack>
                ) : null}
                {group.items.map((item) => (
                  <Toggle
                    key={item.type}
                    isOn={item.enabled}
                    modifiers={getRowModifiers()}
                    onIsOnChange={(enabled) =>
                      props.onToggleNotificationPreference(item.eventTypes ?? item.type, enabled)
                    }
                  >
                    <VStack alignment="leading" spacing={AppLayout.compactGap}>
                      <Text modifiers={getTitleModifiers()}>{item.label}</Text>
                      {item.helpMessage ? (
                        <Text modifiers={getDescriptionModifiers()}>{item.helpMessage}</Text>
                      ) : null}
                    </VStack>
                  </Toggle>
                ))}
              </Section>
            ))
          : null}
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
