import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from 'expo-image';
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "HomeScreen">;

export default function HomeScreen({ navigation }: Props) {
  
  const HERO_IMAGE = require('../../assets/images/medico(a).jpg');
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="" />
      
      <View style={styles.brandBanner}>
        <View style={styles.brandBannerContent}>
          <View>
            <Text style={styles.brandBannerTitle}>MediAta</Text>
            <Text style={styles.brandBannerSubtitle}>O seu App de transcrição de prontuários.</Text>
          </View>
          <TouchableOpacity
            style={styles.bannerLoginButton}
            onPress={() => navigation.navigate("LoginScreen")}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerLoginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            contentFit="cover"
          />
        </View>

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
            style={[styles.primaryButton]}
            onPress={() => navigation.navigate("RegisterScreen")}
          >
            <Text style={styles.primaryButtonText}>Testar agora</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.featuresTitle}>Funcionalidades-chave:</Text>

            <View style={styles.featuresList}>
            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎙️</Text>
                <Text style={styles.featureText}>Transcrição automática</Text>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📄</Text>
                <Text style={styles.featureText}>Geração de prontuário</Text>
              </View>
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📚</Text>
                <Text style={styles.featureText}>Histórico de pacientes</Text>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✏️</Text>
                <Text style={styles.featureText}>Edição rápida</Text>
              </View>
            </View>
        </View>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  brandBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  brandBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBannerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  brandBannerSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.95,
  },
  bannerLoginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bannerLoginText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  hero: {
    height: 210,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 14,
    backgroundColor: '#e5e7eb'
  },
  heroImage: {
    width: '100%',
    height: '130%'
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  mainTitleHighlight: {
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 18,
  },
  buttonsRow: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
  },

  featuresList: {
  marginTop: 6,
  marginBottom: 20,
  gap: 10,
  },

  featuresRow: {
  flexDirection: "row",
  gap: 12,
  },

  featureItem: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  },

  featureIcon: {
  fontSize: 20,
  marginRight: 8,
  },

  featureText: {
  fontSize: 14,
  color: colors.text,
  },

  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  
});
