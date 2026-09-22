import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useGameTheme } from '@/features/games/GameUI';
import type { PuzzleVisual } from './puzzles';

/** SVGs arrive with the authenticated answer; never persist solution images to disk. */
export function PuzzleDiagram({ visual }: { visual: PuzzleVisual }) {
  const theme = useGameTheme();
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const picture = <Image
    source={{ uri: visual.uri }}
    accessible
    accessibilityLabel={visual.description}
    contentFit="contain"
    cachePolicy="none"
    onError={() => setFailed(true)}
    style={{ width: expanded ? visual.width : '100%', aspectRatio: visual.width / visual.height }}
  />;
  return <View testID="puzzle-visual" style={{ gap: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 12, backgroundColor: theme.backgroundElement }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17, fontWeight: '700', flexShrink: 1 }}>Visual explanation</Text>
      {!failed && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
        <Text style={{ color: theme.accent, fontWeight: '700' }}>{expanded ? 'Fit image' : 'Enlarge'}</Text>
      </Pressable>}
    </View>
    {failed ? <Text style={{ color: theme.textSecondary }}>The image could not load. The complete text solution is below.</Text> : expanded ? <ScrollView horizontal showsHorizontalScrollIndicator>{picture}</ScrollView> : picture}
    {expanded && !failed && <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Swipe horizontally to inspect the enlarged image.</Text>}
    <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 21 }}>{visual.caption}</Text>
  </View>;
}
