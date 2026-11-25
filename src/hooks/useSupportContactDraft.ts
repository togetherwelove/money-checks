import { SupportContactCopy } from "../constants/supportContact";
import { useEffect, useRef, useState } from "react";
import {
  composeSupportMail,
  pickSupportAttachments,
  type SupportAttachment,
} from "../lib/supportContact";
import { showNativeToast } from "../lib/nativeToast";
import { useSupportContactDismiss } from "./useSupportContactDismiss";

export function useSupportContactDraft(email: string) {
  const busy = useRef(false);
  const mounted = useRef(true);
  const [isBusy, setIsBusy] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [subject, setSubject] = useState("");

  const handlePickAttachments = async () => {
    if (busy.current) return;
    busy.current = true;
    setIsBusy(true);
    try {
      const nextAttachments = await pickSupportAttachments();
      if (mounted.current && nextAttachments.length > 0) {
        setAttachments((currentAttachments) => [...currentAttachments, ...nextAttachments]);
      }
    } catch {
      showNativeToast(SupportContactCopy.imageError);
    } finally {
      busy.current = false;
      if (mounted.current) setIsBusy(false);
    }
  };

  const handleSendSupportMail = async () => {
    if (busy.current) return;
    if (!subject.trim()) {
      showNativeToast(SupportContactCopy.subjectRequired);
      return;
    }

    if (!messageBody.trim()) {
      showNativeToast(SupportContactCopy.bodyRequired);
      return;
    }

    busy.current = true;
    setIsBusy(true);
    try {
      await composeSupportMail({
        attachments,
        body: messageBody.trim(),
        subject: subject.trim(),
        userEmail: email,
      });
    } catch (error) {
      showNativeToast(error instanceof Error ? error.message : SupportContactCopy.mailError);
    } finally {
      busy.current = false;
      if (mounted.current) setIsBusy(false);
    }
  };

  useSupportContactDismiss(Boolean(subject || messageBody || attachments.length), isBusy);
  const removeAttachment = (uri: string) => {
    if (!busy.current)
      setAttachments((current) => current.filter((attachment) => attachment.uri !== uri));
  };
  return {
    attachments,
    subject,
    messageBody,
    setSubject,
    setMessageBody,
    removeAttachment,
    handlePickAttachments,
    handleSendSupportMail,
    isBusy,
  };
}
