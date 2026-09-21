import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { AppLayout } from "@/components/AppLayout";
import {
  GameArt,
  GameKind,
  gameColors,
  useGameTheme,
} from "@/features/games/GameUI";

const filters = ["All", "Single Player", "Multiplayer", "Puzzles"] as const;
const games = [
  {
    kind: "path" as GameKind,
    title: "PATH",
    route: "/games/path" as const,
    subtitle: "Daily  •  Procedural",
    description:
      "Connect every cell. Trace a single route through checkpoints.",
    tags: ["Logic", "Focus", "Variations"],
    filters: ["Single Player", "Puzzles"],
  },
  {
    kind: "clash" as GameKind,
    title: "TAP CLASH",
    route: "/games/tap-clash" as const,
    subtitle: "VS Computer  •  2 Players",
    description: "Tap faster. Take the screen.\nTwo territories. One winner.",
    tags: ["Speed", "Reaction", "Multiplayer"],
    filters: ["Single Player", "Multiplayer"],
  },
  {
    kind: "tic" as GameKind,
    title: "TIC TAC TOE",
    route: "/games/tic-tac-toe" as const,
    subtitle: "VS Computer  •  2 Players",
    description:
      "Three in a row wins. Classic game, play against a friend or AI.",
    tags: ["Strategy", "Classic", "Fun"],
    filters: ["Single Player", "Multiplayer", "Puzzles"],
  },
];
export default function GamesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const theme = useGameTheme();
  return (
    <AppLayout
      mobileTitle="🎮 Games"
      mobileSubtitle="Play. Improve. Repeat."
      themeOverride={theme}
      contentBackgroundColor={theme.background}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 680,
          alignSelf: "center",
          gap: 12,
          paddingBottom: 12,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 10,
            paddingVertical: 4,
            paddingBottom: 6,
          }}
        >
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === item }}
              onPress={() => setFilter(item)}
              style={{
                borderWidth: 1,
                borderColor: filter === item ? theme.accent : theme.border,
                backgroundColor:
                  filter === item ? theme.accentMuted : theme.backgroundElement,
                borderRadius: 28,
                minHeight: 42,
                paddingHorizontal: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 13,
                  fontWeight: filter === item ? "700" : "500",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {games
          .filter((game) => filter === "All" || game.filters.includes(filter))
          .map((game) => {
            const color = gameColors[game.kind];
            return (
              <Pressable
                key={game.kind}
                accessibilityRole="button"
                accessibilityLabel={`Play ${game.title}`}
                onPress={() => router.push(game.route)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  gap: 14,
                  borderWidth: 1,
                  borderColor: `${color}80`,
                  backgroundColor: `${color}16`,
                  borderRadius: 22,
                  padding: 13,
                  overflow: "hidden",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{
                    width: 90,
                    height: 102,
                    borderWidth: 1,
                    borderColor: `${color}80`,
                    borderRadius: 18,
                    backgroundColor: theme.backgroundElement,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <GameArt kind={game.kind} />
                </View>
                <View style={{ flex: 1, gap: 6, paddingVertical: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 4,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 20,
                        fontWeight: "800",
                        flex: 1,
                      }}
                    >
                      {game.title}
                    </Text>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name="chevron-right"
                        size={23}
                        color={theme.text}
                      />
                    </View>
                  </View>
                  <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
                    {game.subtitle}
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 13,
                      lineHeight: 19,
                    }}
                  >
                    {game.description}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 5,
                      marginTop: 3,
                    }}
                  >
                    {game.tags.map((tag) => (
                      <View
                        key={tag}
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: `${color}35`,
                          backgroundColor: theme.backgroundSelected,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: theme.text, fontSize: 10 }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 20,
            padding: 18,
          }}
        >
          <FontAwesome5 name="gamepad" size={30} color={theme.accent} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text
              style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}
            >
              More Games Coming Soon
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Puzzles, brain training, logic and more.
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 18,
            backgroundColor: theme.backgroundElement,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 20,
          }}
        >
          <Text
            style={{ color: theme.accent, fontSize: 40, fontWeight: "800" }}
          >
            “
          </Text>
          <View style={{ gap: 5, flexShrink: 1 }}>
            <Text style={{ color: theme.text, fontSize: 14 }}>
              A sharper you, one game at a time.
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              — Play. Improve. Repeat.
            </Text>
          </View>
        </View>
      </View>
    </AppLayout>
  );
}
