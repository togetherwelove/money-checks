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
  description: string;
  enabled: boolean;
  label: string;
  type: NotificationEventType;
};

export type NotificationPreferenceGroup = {
  description: string;
  id: NotificationPreferenceGroupId;
  items: NotificationPreferenceItem[];
  thresholdFields?: NotificationThresholdField[];
  title: string;
};

export type NotificationThresholdField = {
  description: string;
  enabled: boolean;
  key: NotificationThresholdKey;
  label: string;
  value: string;
};
