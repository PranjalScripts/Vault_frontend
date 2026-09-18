import React from "react";
import { View } from "react-native";

import type { Passcode } from "@/features/passcodes/types";

type PasscodeListProps = {
  passcodes: Passcode[];
  renderPasscode: (item: Passcode, index: number) => React.ReactNode;
};

export function PasscodeList({ passcodes, renderPasscode }: PasscodeListProps) {
  return <View style={{ gap: 8, width: '100%' }}>{passcodes.map(renderPasscode)}</View>;
}
