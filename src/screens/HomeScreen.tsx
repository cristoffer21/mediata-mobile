import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="mediAta" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.mainTitle}>
          Menos burocracia,{`\n`}
          <Text style={styles.mainTitleHighlight}>mais cuidado.</Text>
        </Text>

        <Text style={styles.description}>
          Plataforma idealizada para médicos, visando reduzir o tempo gasto com
          registros burocráticos e aumentar o tempo dedicado ao paciente.
        </Text>

        <Text style={styles.subtitle}>
          Mais agilidade para você, mais tempo para o paciente.
        </Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1 }]}
            onPress={() => navigation.navigate("Record")}
          >
            <Text style={styles.primaryButtonText}>Testar agora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { flex: 1 }]}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.secondaryButtonText}>Histórico</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.featuresTitle}>Funcionalidades-chave:</Text>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎙️</Text>
            <Text style={styles.featureText}>Transcrição automática</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📄</Text>
            <Text style={styles.featureText}>Geração de prontuário</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureText}>Histórico de pacientes</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✏️</Text>
            <Text style={styles.featureText}>Edição rápida</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  mainTitleHighlight: {
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    textAlign: "center",
  },
});
