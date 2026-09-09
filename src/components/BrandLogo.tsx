import React, { useState } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/use-theme";
import { logoInitials, resolveLogo, type LogoKind } from "@/utils/logos/resolveLogo";

export function BrandLogo({ name, kind = "subject", size = 40 }: { name: string; kind?: LogoKind; size?: number }) {
  const theme = useTheme();
  const logo = resolveLogo(name, kind);
  // Keying resets loading/failure state when an entry is renamed or a list cell is reused.
  return <LogoImage key={`${kind}:${name}:${logo?.id}`} name={name} logo={logo} size={size} foreground={theme.textSecondary} background={theme.backgroundSelected} />;
}
function LogoImage({ name, logo, size, foreground, background }: { name: string; logo: ReturnType<typeof resolveLogo>; size: number; foreground: string; background: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={logo && loaded ? `${name} logo` : `${name} initials`} style={{ width: size, height: size, flexShrink: 0, borderRadius: Math.round(size * 0.2), alignItems: "center", justifyContent: "center", backgroundColor: loaded ? "#FFFFFF" : background, overflow: "hidden" }}>
      {!loaded && <Text style={{ color: foreground, fontSize: size * 0.36, fontWeight: "700" }} numberOfLines={1}>{logoInitials(name)}</Text>}
      {logo && !failed && <Image source={{ uri: logo.uri }} contentFit="contain" cachePolicy="memory-disk" accessible={false} tintColor={logo.monochrome ? logo.color : undefined} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(false); }} style={{ position: "absolute", width: size * 0.76, height: size * 0.76, opacity: loaded ? 1 : 0 }} />}
    </View>
  );
}
