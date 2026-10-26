import { Image } from "react-native";
import { AuthControls } from "../../constants/authControls";

const googleLogo = require("../../../assets/brands/google-g.png");

export function GoogleGIcon({ size = AuthControls.providerIconSize }: { size?: number }) {
  return <Image source={googleLogo} resizeMode="contain" style={{ width: size, height: size }} />;
}
