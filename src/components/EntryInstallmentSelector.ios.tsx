import { Button, Host, HStack, Menu, Spacer, Text } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import { Keyboard, StyleSheet } from "react-native";
import { EntryComposerUi } from "../constants/entryComposer";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { InstallmentPickerConfig as Config, InstallmentPickerCopy } from "../constants/installmentPicker";
import { formatInstallmentLabel } from "../lib/installments";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";

const presetMonths = Array.from({ length: Config.presetMaxMonths }, (_, index) => index + ONE_TIME_INSTALLMENT_MONTHS);

export function EntryInstallmentSelector({ installmentMonths, onRequestCustom, onSelectInstallmentMonths }: {
  installmentMonths: number;
  onRequestCustom: () => void;
  onSelectInstallmentMonths: (months: number) => void;
}) {
  return <Host style={styles.row}>
    <Menu label={<HStack><Text>{EntryRegistrationCopy.paymentMethodLabel}</Text><Spacer /><Text>{formatInstallmentLabel(installmentMonths)}</Text></HStack>}
      modifiers={[buttonStyle("plain")]}>
      {presetMonths.map(months => <Button key={months} label={formatInstallmentLabel(months)}
        systemImage={months === installmentMonths ? "checkmark" : undefined}
        onPress={() => { Keyboard.dismiss(); onSelectInstallmentMonths(months); }} />)}
      <Button label={InstallmentPickerCopy.customLabel} systemImage={installmentMonths > Config.presetMaxMonths ? "checkmark" : undefined}
        onPress={() => { Keyboard.dismiss(); onRequestCustom(); }} />
    </Menu>
  </Host>;
}

const styles = StyleSheet.create({ row: { height: EntryComposerUi.fieldHeight } });
