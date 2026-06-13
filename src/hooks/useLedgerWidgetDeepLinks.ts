import { useEffect } from "react";
import { Linking } from "react-native";

import { resolveLedgerWidgetDeepLinkAction } from "../lib/widgetDeepLinks";

type UseLedgerWidgetDeepLinksOptions = {
  enabled: boolean;
  onOpenClipboardImport: () => void;
  onOpenEntry: () => void;
};

export function useLedgerWidgetDeepLinks({
  enabled,
  onOpenClipboardImport,
  onOpenEntry,
}: UseLedgerWidgetDeepLinksOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUrl = (url: string | null) => {
      const action = resolveLedgerWidgetDeepLinkAction(url);
      if (action === "clipboard") {
        onOpenClipboardImport();
        return;
      }

      if (action === "entry") {
        onOpenEntry();
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, onOpenClipboardImport, onOpenEntry]);
}
