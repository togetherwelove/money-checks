import { Button } from "@expo/ui/swift-ui";
import { Keyboard } from "react-native";
import { NativeEntryDetailMenu } from "./entryComposer/NativeEntryDetailMenu";
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
  return <NativeEntryDetailMenu label={EntryRegistrationCopy.paymentMethodLabel}
    value={formatInstallmentLabel(installmentMonths)}>
      {presetMonths.map(months => <Button key={months} label={formatInstallmentLabel(months)}
        systemImage={months === installmentMonths ? "checkmark" : undefined}
        onPress={() => { Keyboard.dismiss(); onSelectInstallmentMonths(months); }} />)}
      <Button label={InstallmentPickerCopy.customLabel} systemImage={installmentMonths > Config.presetMaxMonths ? "checkmark" : undefined}
        onPress={() => { Keyboard.dismiss(); onRequestCustom(); }} />
  </NativeEntryDetailMenu>;
}
