import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
} from "../domain/notificationEvents";

export type NotificationPreferences = {
  enabledByEvent: Record<NotificationEventType, boolean>;
  enabledThresholds: Record<NotificationThresholdKey, boolean>;
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
  thresholdFields?: NotificationThresholdField[];
  title: string;
};

export type NotificationThresholdField = {
  enabled: boolean;
  key: NotificationThresholdKey;
  label: string;
  value: string;
};
