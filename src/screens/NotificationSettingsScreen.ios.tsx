import { Button, Host, List, RNHostView, Section, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import { Linking, StyleSheet, View } from "react-native";
import { NotificationThresholdField } from "../components/accountScreen/NotificationThresholdField";
import { AppSettingsCopy } from "../constants/appSettings";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { NativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { NotificationSettingsScreenProps } from "./NotificationSettingsScreen";

const rowModifiers = NativeSettingsStyles.row;
const sectionTitleModifiers = NativeSettingsStyles.sectionTitle;
const titleModifiers = NativeSettingsStyles.title;
const descriptionModifiers = NativeSettingsStyles.description;

export function NotificationSettingsScreen(props: NotificationSettingsScreenProps) {
  const openNotificationPermission = () => {
    if (props.notificationPermissionState === "default")
      void props.onRequestNotificationPermission();
    else void Linking.openSettings();
  };
  const notificationPermissionContent = (
    <VStack alignment="leading" spacing={AppLayout.compactGap}>
      <Text modifiers={titleModifiers}>{NotificationUiCopy.permissionSectionTitle}</Text>
      <Text modifiers={descriptionModifiers}>{props.notificationPermissionLabel}</Text>
    </VStack>
  );
  return (
    <Host
      style={styles.screen}
      useViewportSizeMeasurement
      colorScheme="light"
      seedColor={AppColors.primary}
    >
      <List modifiers={NativeSettingsStyles.list}>
        {props.screenTitle ? (
          <RNHostView matchContents>
            <View>{props.screenTitle}</View>
          </RNHostView>
        ) : null}
        <Section
          header={
            <Text modifiers={sectionTitleModifiers}>
              {AppSettingsCopy.pushNotificationSectionTitle}
            </Text>
          }
        >
          {!props.showNotificationSettings ? (
            <Text modifiers={descriptionModifiers}>
              {PushNotificationCopy.permissionUnsupported}
            </Text>
          ) : props.notificationPermissionState === "granted" ? (
            <VStack alignment="leading" modifiers={rowModifiers}>
              {notificationPermissionContent}
            </VStack>
          ) : (
            <Button onPress={openNotificationPermission} modifiers={rowModifiers}>
              {notificationPermissionContent}
            </Button>
          )}
          {props.notificationStatusMessage ? (
            <Text modifiers={descriptionModifiers}>{props.notificationStatusMessage}</Text>
          ) : null}
        </Section>
        {props.showNotificationSettings
          ? props.notificationPreferenceGroups.map((group) => (
              <Section
                key={group.id}
                header={<Text modifiers={sectionTitleModifiers}>{group.title}</Text>}
              >
                {group.thresholdSettings ? (
                  <VStack alignment="leading" modifiers={rowModifiers}>
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
                    modifiers={rowModifiers}
                    onIsOnChange={(enabled) =>
                      props.onToggleNotificationPreference(item.eventTypes ?? item.type, enabled)
                    }
                  >
                    <VStack alignment="leading" spacing={AppLayout.compactGap}>
                      <Text modifiers={titleModifiers}>{item.label}</Text>
                      {item.helpMessage ? (
                        <Text modifiers={descriptionModifiers}>{item.helpMessage}</Text>
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
