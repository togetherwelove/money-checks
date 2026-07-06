import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../domain/notificationEvents";

export type NotificationPreferences = {
  enabledByEvent: Record<NotificationEventType, boolean>;
  enabledThresholds: Record<NotificationThresholdKey, boolean>;
  selectedThresholdPeriod: NotificationThresholdPeriod;
  thresholds: Record<NotificationThresholdKey, number>;
};

export type NotificationPreferenceItem = {
  enabled: boolean;
  eventTypes?: readonly NotificationEventType[];
  helpMessage?: string;
  label: string;
  type: NotificationEventType;
};

export type NotificationPreferenceGroup = {
  id: NotificationPreferenceGroupId;
  items: NotificationPreferenceItem[];
  thresholdSettings?: NotificationThresholdSettings;
  title: string;
};

export type NotificationThresholdPeriodOption = {
  key: NotificationThresholdKey;
  label: string;
};

export type NotificationThresholdSettings = {
  amountValue: string;
  enabled: boolean;
  periodOptions: NotificationThresholdPeriodOption[];
  selectedKey: NotificationThresholdKey;
};
