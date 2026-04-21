import type { SupportPackageIdentifier } from "../../constants/support";

export type SupportPackageSnapshot = {
  identifier: SupportPackageIdentifier;
  priceLabel: string | null;
};

type SupportSnapshot = {
  packages: SupportPackageSnapshot[];
};

export async function loadSupportSnapshot(_appUserId: string): Promise<SupportSnapshot> {
  return { packages: [] };
}

export async function purchaseSupportPackage(
  _appUserId: string,
  _identifier: SupportPackageIdentifier,
): Promise<void> {
  throw new Error("Support purchases are not available on web.");
}
