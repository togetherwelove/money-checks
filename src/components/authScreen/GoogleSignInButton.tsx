import { GoogleGIcon } from "./GoogleGIcon";
import { ProviderSignInButton } from "./ProviderSignInButton";

export function GoogleSignInButton({ onPress }: { onPress: () => void | Promise<void> }) {
  return <ProviderSignInButton icon={<GoogleGIcon />} label="Google로 로그인" onPress={onPress} />;
}
