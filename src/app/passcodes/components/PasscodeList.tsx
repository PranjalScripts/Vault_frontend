import React from "react";
import { ScrollView, View } from "react-native";

import type { Passcode } from "../types";
import { styles } from "../styles";

type PasscodeListProps = {
  passcodes: Passcode[];
  renderPasscode: (item: Passcode, index: number) => React.ReactNode;
};

export function PasscodeList({ passcodes, renderPasscode }: PasscodeListProps) {
  return (
    <ScrollView
      style={styles.listScroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cardsGrid}>{passcodes.map(renderPasscode)}</View>
    </ScrollView>
  );
}
