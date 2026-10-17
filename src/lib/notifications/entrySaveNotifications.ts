type EntrySaveNotificationsOptions<Entry, Widget> = {
  entries: readonly Entry[];
  notifyThreshold: () => Promise<void>;
  loadWidget: () => Promise<Widget | undefined>;
  notifyMember: (entry: Entry, widget: Widget | undefined) => Promise<void>;
  onError: (error: unknown, step: string) => void;
};

export async function sendEntrySaveNotifications<Entry, Widget>({
  entries,
  notifyThreshold,
  loadWidget,
  notifyMember,
  onError,
}: EntrySaveNotificationsOptions<Entry, Widget>): Promise<void> {
  await notifyThreshold().catch((error) => onError(error, "notify_expense_threshold"));
  if (entries.length === 0) {
    return;
  }

  const widget = await loadWidget().catch((error) => {
    onError(error, "load_notification_widget_summary");
    return undefined;
  });
  for (const entry of entries) {
    await notifyMember(entry, widget).catch((error) => onError(error, "notify_shared_entry"));
  }
}
