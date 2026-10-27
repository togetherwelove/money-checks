import { Button } from "@expo/ui/swift-ui";
import { Keyboard } from "react-native";
import { EntryRegistrationCopy as Copy } from "../constants/entryRegistration";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { NativeEntryDetailMenu } from "./entryComposer/NativeEntryDetailMenu";

export function EntryTargetMemberSelector({ members, selectedMemberId, onSelectMember }: {
  members: LedgerBookMember[];
  selectedMemberId: string;
  onSelectMember: (member: LedgerBookMember) => void;
}) {
  if (!members.length) return null;
  const selectedMember = members.find(member => member.userId === selectedMemberId);
  return <NativeEntryDetailMenu label={Copy.targetMemberLabel}
    value={selectedMember?.displayName ?? Copy.targetMemberPlaceholder}>
    {members.map(member => <Button key={member.userId} label={member.displayName}
      systemImage={member.userId === selectedMemberId ? "checkmark" : undefined}
      onPress={() => { Keyboard.dismiss(); onSelectMember(member); }} />)}
  </NativeEntryDetailMenu>;
}
