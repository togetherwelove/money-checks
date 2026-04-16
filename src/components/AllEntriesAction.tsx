import { AllEntriesCopy } from "../constants/allEntries";
import { IconActionButton } from "./IconActionButton";

type AllEntriesActionProps = {
  onPress: () => void;
};

export function AllEntriesAction({ onPress }: AllEntriesActionProps) {
  return (
    <IconActionButton
      accessibilityLabel={AllEntriesCopy.openActionLabel}
      icon="inbox"
      onPress={onPress}
    />
  );
}
