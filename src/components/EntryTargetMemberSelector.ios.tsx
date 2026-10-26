import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { EntryRegistrationCopy as Copy } from "../constants/entryRegistration";
import type { LedgerBookMember } from "../types/ledgerBookMember";

export function EntryTargetMemberSelector({ members, selectedMemberId, onSelectMember }: {
  members: LedgerBookMember[];
  selectedMemberId: string;
  onSelectMember: (member: LedgerBookMember) => void;
}) {
  if (!members.length) return null;
  return <Host matchContents={{ vertical: true }}>
    <Picker label={Copy.targetMemberLabel} selection={selectedMemberId} modifiers={[pickerStyle("menu")]}
      onSelectionChange={id => { const member = members.find(item => item.userId === id); if (member) onSelectMember(member); }}>
      {!members.some(member => member.userId === selectedMemberId)
        ? <Text modifiers={[tag(selectedMemberId)]}>{Copy.targetMemberPlaceholder}</Text> : null}
      {members.map(member => <Text key={member.userId} modifiers={[tag(member.userId)]}>{member.displayName}</Text>)}
    </Picker>
  </Host>;
}
