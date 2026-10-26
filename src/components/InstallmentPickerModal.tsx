import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, TextInput, type TextInputInstance } from "react-native";

import { FormInputTextStyle, NoteTextStyle } from "../constants/uiStyles";
import { InstallmentPickerConfig as Config, InstallmentPickerCopy as Copy } from "../constants/installmentPicker";
import { MAX_INSTALLMENT_MONTHS } from "../lib/installments";
import { EntryComposerHeader } from "./entryComposer/EntryComposerHeader";
import { NativePickerSheet } from "./NativePickerSheet";

type InstallmentPickerModalProps = {
  installmentMonths: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectInstallmentMonths: (months: number) => void;
};

export function InstallmentPickerModal(props: InstallmentPickerModalProps) {
  return <CustomInstallmentInput {...props} />;
}

function CustomInstallmentInput({ installmentMonths, isOpen, onClose, onSelectInstallmentMonths }: InstallmentPickerModalProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const [text, setText] = useState(installmentMonths > Config.presetMaxMonths ? String(installmentMonths) : "");
  useEffect(() => {
    if (isOpen) setText(installmentMonths > Config.presetMaxMonths ? String(installmentMonths) : "");
  }, [installmentMonths, isOpen]);
  const months = Number(text);
  const valid = /^\d+$/.test(text) && Number.isInteger(months)
    && months >= Config.customMinMonths && months <= MAX_INSTALLMENT_MONTHS;
  const close = () => { Keyboard.dismiss(); onClose(); };
  const confirm = () => {
    if (!valid) return;
    onSelectInstallmentMonths(months);
    close();
  };

  return <NativePickerSheet isOpen={isOpen} title={Copy.customLabel} onClose={close}
    header={<EntryComposerHeader title={Copy.customLabel} saving={false}
      actionDisabled={!valid} actionLabel={Copy.confirm} onAction={confirm} onClose={close} />}
    onShow={() => inputRef.current?.focus()}>
    <TextInput ref={inputRef} accessibilityLabel={Copy.customAccessibilityLabel}
      inputMode="numeric" keyboardType="number-pad" value={text} onChangeText={setText}
      onSubmitEditing={confirm} placeholder={Copy.customAccessibilityLabel}
      returnKeyType="done" style={FormInputTextStyle} />
    <Text style={NoteTextStyle}>{Copy.customHint}</Text>
  </NativePickerSheet>;
}
