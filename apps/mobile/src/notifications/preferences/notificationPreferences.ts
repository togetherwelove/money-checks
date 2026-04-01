import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../domain/notificationEvents";

export type NotificationPreferences = {
  enabledByEvent: Record<NotificationEventType, boolean>;
  thresholdPeriods: Record<NotificationThresholdKey, NotificationThresholdPeriod>;
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
  key: NotificationThresholdKey;
  label: string;
  periodLabel: string;
  periodOptions: NotificationThresholdPeriodOption[];
  selectedPeriod: NotificationThresholdPeriod;
  value: string;
};

export type NotificationThresholdPeriodOption = {
  label: string;
  value: NotificationThresholdPeriod;
};
