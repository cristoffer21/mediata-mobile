import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View, findNodeHandle, } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { login } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "LoginScreen">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const emailRef = useRef<any>(null);
  const senhaRef = useRef<any>(null);

  function scrollToInput(ref: any) {
    const node = findNodeHandle(ref?.current);
    if (!node) return;
    UIManager.measure(node, (_x, _y, _width, _height, _pageX, pageY) => {
      const headerOffset = 64;
      const offset = Math.max(pageY - headerOffset - 20, 0);
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    });
  }

  async function handleLogin() {
    try {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!email || !senha) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }
    const dados = await login(email, senha);
    
    const medicoGuid: string = String(dados.medicoId);
    await signIn(medicoGuid);

    navigation.replace("RecordScreen");

    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        Alert.alert("Credenciais inválidas", "E-mail ou senha incorretos.");
        return;
      }
      const backendMsg = error?.response?.data?.message || error?.response?.data;
      const msg = backendMsg
        ? (typeof backendMsg === "string" ? backendMsg : JSON.stringify(backendMsg))
        : (error?.message || "Falha na autenticação");
      Alert.alert("Falha na autenticação", msg);
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="" />
      
      <View style={styles.brandBanner}>
        <TouchableOpacity
          style={styles.bannerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.bannerArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.brandBannerTitle}>Entrar</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={64}
      >
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar</Text>

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Digite Seu E-mail"
              value={email}
              onChangeText={setEmail}
              onFocus={() => scrollToInput(emailRef)}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              ref={senhaRef}
              style={styles.input}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              onFocus={() => scrollToInput(senhaRef)}
            />

            <TouchableOpacity style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]} onPress={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Ainda não tem conta?{" "}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("RegisterScreen")}
              >
                Cadastre-se
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


const styles = StyleSheet.create({
  brandBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brandBannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bannerBackButton: {
    position: 'absolute',
    left: 24,
    padding: 4,
  },
  bannerArrow: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginTop: 40,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  footerText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
});
