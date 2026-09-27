import React from "react";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { StyleProp, TextStyle } from "react-native";

const icons: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  "/interview": "briefcase", "/puzzles": "help-circle", "/games": "grid", "/dashboard": "home", "/todos": "check-square", "/subjects": "book-open",
  "/passcodes": "lock", "/trash": "trash-2", "/settings": "settings", "/search": "search",
};
export function NavigationIcon({ path, size = 22, color, style }: { path: string; size?: number; color: string; style?: StyleProp<TextStyle> }) {
  return path === "/whatsapp"
    ? <FontAwesome name="whatsapp" size={size} color={color} style={style} />
    : <Feather name={icons[path] || "circle"} size={size} color={color} style={style} />;
}
