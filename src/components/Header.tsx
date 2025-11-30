import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showHistory?: boolean;
  onHistory?: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
};

export default function Header({ title, subtitle, showBack = false, showHistory, onHistory, showLogout, onLogout, }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <View style={styles.centerContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightContainer}>
        {showHistory ? (
          <TouchableOpacity
            onPress={() => (onHistory ? onHistory() : navigation.navigate("HistoryScreen"))}
            style={styles.iconButton}
          >
            <Ionicons name="time-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}

        {showLogout ? (
          <TouchableOpacity
            onPress={async () => {
              try {
                if (onLogout) await onLogout();
                else await signOut();
              } catch (e) {
                
              }
              Alert.alert("Sessão encerrada");
              navigation.navigate("HomeScreen");
            }}
            style={styles.iconButton}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  backPlaceholder: {
    width: 32,
  },
  rightPlaceholder: {
    width: 32,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
