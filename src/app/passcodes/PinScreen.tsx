import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useVault } from "@/contexts/VaultContext";
import { useTheme } from "@/hooks/use-theme";

export function PinScreen({ mode }: { mode: "create" | "unlock" }) {
  const theme = useTheme();
  const { createPin, verifyPin, isCreatingVault, isUnlockingVault } = useVault();
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePinSubmit = async () => {
    if (mode === "create") {
      if (!showConfirm) {
        if (pin.length < 4) {
          Toast.show({
            type: "error",
            text1: "PIN too short",
            text2: "PIN must be at least 4 digits",
          });
          return;
        }
        setShowConfirm(true);
      } else {
        if (pin !== confirmPin) {
          Toast.show({
            type: "error",
            text1: "PINs don't match",
            text2: "Please enter the same PIN twice",
          });
          setConfirmPin("");
          return;
        }
        const success = await createPin(pin);
        if (success) {
          setPin("");
          setConfirmPin("");
          setShowConfirm(false);
        }
      }
    } else {
      if (pin.length < 4) {
        Toast.show({
          type: "error",
          text1: "Invalid PIN",
          text2: "PIN must be at least 4 digits",
        });
        return;
      }
      const success = await verifyPin(pin);
      if (success) {
        setPin("");
      }
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      if (showConfirm && confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else if (!showConfirm && pin.length > 0) {
        setPin(pin.slice(0, -1));
      }
    } else if (pin.length < 6 && (!showConfirm || confirmPin.length < 6)) {
      if (showConfirm) {
        setConfirmPin(confirmPin + key);
      } else {
        setPin(pin + key);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>
          {mode === "create" ? "Create Vault PIN" : "Enter Vault PIN"}
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {mode === "create" 
            ? "Create a PIN to secure your passcodes" 
            : "Enter your PIN to access your passcodes"}
        </Text>

        {/* PIN Display */}
        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              <Text style={[
                styles.pinDotText,
                { color: theme.text },
                (showConfirm ? confirmPin : pin)[index] && styles.filledDot,
              ]}>
                {(showConfirm ? confirmPin : pin)[index] || "•"}
              </Text>
            </View>
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.key,
                { backgroundColor: theme.backgroundElement },
              ]}
              onPress={() => handleKeyPress(num.toString())}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { color: theme.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[
              styles.key,
              styles.actionKey,
              { backgroundColor: theme.backgroundElement },
            ]}
            onPress={() => handleKeyPress("backspace")}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, styles.actionText, { color: theme.text }]}>⌫</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.key,
              styles.actionKey,
              { backgroundColor: theme.accent },
            ]}
            onPress={handlePinSubmit}
            disabled={isCreatingVault || isUnlockingVault}
            activeOpacity={0.7}
          >
            {isCreatingVault || isUnlockingVault ? (
              <Text style={styles.loadingText}>⏳</Text>
            ) : (
              <Text style={[styles.keyText, styles.actionText, { color: "#fff" }]}>
                {mode === "create" && showConfirm ? "✓" : "→"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {showConfirm && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowConfirm(false);
              setConfirmPin("");
            }}
          >
            <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  pinDisplay: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  pinDot: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  pinDotText: {
    fontSize: 24,
    fontWeight: "600",
  },
  filledDot: {
    opacity: 1,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    maxWidth: 300,
  },
  key: {
    width: 80,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "600",
  },
  actionKey: {
    backgroundColor: "#f0f0f0",
  },
  actionText: {
    fontSize: 20,
  },
  loadingText: {
    fontSize: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});