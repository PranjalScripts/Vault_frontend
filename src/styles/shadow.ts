import { Platform, type ViewStyle } from "react-native";

type ShadowStyle = Pick<
  ViewStyle,
  | "boxShadow"
  | "shadowColor"
  | "shadowOpacity"
  | "shadowRadius"
  | "shadowOffset"
>;

/** Use CSS shadows on web and preserve native iOS shadow rendering. */
export function shadow({
  opacity,
  radius,
  x = 0,
  y = 0,
}: {
  opacity: number;
  radius: number;
  x?: number;
  y?: number;
}): ShadowStyle {
  if (Platform.OS === "web")
    return { boxShadow: `${x}px ${y}px ${radius}px rgba(0, 0, 0, ${opacity})` };
  return {
    shadowColor: "#000",
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: x, height: y },
  };
}
