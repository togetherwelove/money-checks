import { tint } from "@expo/ui/swift-ui/modifiers";
import { getSwitchAppearance } from "../constants/switchAppearance";
import { Fragment } from "react";
import { NativeSettingsGroup } from "../components/appSettings/NativeSettingsGroup.ios";
import { getNativeSettingsGroupStyles } from "../constants/nativeSettingsGroupStyles.ios";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import {
  Button,
  Host,
  HStack,
  List,
  RNHostView,
  Spacer,
  Text,
  Toggle,
  VStack,
} from "@expo/ui/swift-ui";
import { Linking, StyleSheet, View } from "react-native";
import { NotificationThresholdField } from "../components/accountScreen/NotificationThresholdField";
import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { getNativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { NotificationSettingsScreenProps } from "./NotificationSettingsScreen";

const getRowModifiers = createThemeValue(() => getNativeSettingsGroupStyles().row);
const getToggleModifiers = createThemeValue(() => [
  ...getRowModifiers(),
  tint(getSwitchAppearance().trackColor.true),
]);
const getTitleModifiers = createThemeValue(() => getNativeSettingsGroupStyles().title);
const getDescriptionModifiers = createThemeValue(() => getNativeSettingsGroupStyles().description);

export function NotificationSettingsScreen(props: NotificationSettingsScreenProps) {
  const colorScheme = useAppTheme();
  const openNotificationPermission = () => {
    if (props.notificationPermissionState === "default")
      void props.onRequestNotificationPermission();
    else void Linking.openSettings();
  };
  const notificationPermissionContent = (
    <HStack spacing={AppLayout.compactGap}>
      <Text modifiers={getTitleModifiers()}>{NotificationUiCopy.permissionSectionTitle}</Text>
      <Spacer />
      <Text modifiers={getNativeSettingsGroupStyles().value}>
        {props.notificationPermissionLabel}
      </Text>
    </HStack>
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
        <VStack modifiers={getNativeSettingsStyles().menuGroup}>
          <NativeSettingsGroup description={props.notificationStatusMessage ?? undefined}>
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
          </NativeSettingsGroup>
        </VStack>
        {props.showNotificationSettings
          ? props.notificationPreferenceGroups.map((group) => (
              <Fragment key={group.id}>
                {group.thresholdSettings ? (
                  <VStack modifiers={getNativeSettingsStyles().menuGroup}>
                    <NativeSettingsGroup>
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
                    </NativeSettingsGroup>
                  </VStack>
                ) : null}
                {group.items.map((item) => (
                  <VStack key={item.type} modifiers={getNativeSettingsStyles().menuGroup}>
                    <NativeSettingsGroup description={item.helpMessage}>
                      <Toggle
                        isOn={item.enabled}
                        modifiers={getToggleModifiers()}
                        onIsOnChange={(enabled) =>
                          props.onToggleNotificationPreference(
                            item.eventTypes ?? item.type,
                            enabled,
                          )
                        }
                      >
                        <VStack alignment="leading" spacing={AppLayout.compactGap}>
                          <Text modifiers={getTitleModifiers()}>{item.label}</Text>
                        </VStack>
                      </Toggle>
                    </NativeSettingsGroup>
                  </VStack>
                ))}
              </Fragment>
            ))
          : null}
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
