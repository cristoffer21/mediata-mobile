import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View, findNodeHandle, } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { registerMedico } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterScreen">;

export default function RegisterScreen({ navigation }: Props) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [crm, setCrm] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const scrollRef = useRef<ScrollView | null>(null);
  const nomeRef = useRef<any>(null);
  const sobrenomeRef = useRef<any>(null);
  const dataRef = useRef<any>(null);
  const crmRef = useRef<any>(null);
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

  
  function formatDate(dateStr: string) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  
  function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 8);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  }

  
  function formatCRMInput(value: string): string {
   
    const cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    
   
    const numbers = cleaned.replace(/[^0-9]/g, '');
    const letters = cleaned.replace(/[^A-Z]/g, '');
    
    if (numbers.length === 0) return '';
    if (letters.length === 0) return numbers;
    
    return `${numbers}/${letters.slice(0, 2)}`;
  }


  async function handleRegister() {
  if (!nome || !sobrenome || !dataNascimento || !crm || !email || !senha) {
    Alert.alert("Preencha todos os campos obrigatórios!");
    return;
  }

  const dataFormatada = formatDate(dataNascimento);
  if (!dataFormatada) {
    Alert.alert("Data de nascimento inválida.");
    return;
  }

  try {
    console.log("[CADASTRO] Iniciando cadastro...");
    console.log("[CADASTRO] Dados:", {
      nome,
      sobrenome,
      dataNascimento: dataFormatada,
      crm,
      email,
      senha: "***"
    });
    
    await registerMedico({
      nome,
      sobrenome,
      dataNascimento: dataFormatada,
      crm,
      email,
      senha,
    });

    console.log("[CADASTRO] ✓ Sucesso!");
    Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
    navigation.replace("LoginScreen");
  } catch (error: any) {
    console.log("[CADASTRO] ❌ Erro ao cadastrar:", error);
    console.log("[CADASTRO] Status:", error.response?.status);
    console.log("[CADASTRO] Data:", JSON.stringify(error.response?.data, null, 2));
    console.log("[CADASTRO] Message:", error.message);
    
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Falha ao cadastrar. Tente novamente.";
    Alert.alert("Erro", typeof message === 'string' ? message : JSON.stringify(message));
  }
}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={64}
    >
      <View style={{ flex: 1 }}>
        <Header title="" />
        
        <View style={styles.brandBanner}>
          <TouchableOpacity
            style={styles.bannerBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.bannerArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brandBannerTitle}>Cadastro</Text>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                ref={nomeRef}
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                onFocus={() => scrollToInput(nomeRef)}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput
                ref={sobrenomeRef}
                style={styles.input}
                value={sobrenome}
                onChangeText={setSobrenome}
                onFocus={() => scrollToInput(sobrenomeRef)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Data nascimento</Text>
              <TextInput
                ref={dataRef}
                style={styles.input}
                placeholder="dd/mm/aaaa"
                value={dataNascimento}
                onChangeText={(text) => setDataNascimento(formatDateInput(text))}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => scrollToInput(dataRef)}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>CRM</Text>
              <TextInput
                ref={crmRef}
                style={styles.input}
                placeholder="123456/SP"
                value={crm}
                onChangeText={(text) => setCrm(formatCRMInput(text))}
                maxLength={10}
                onFocus={() => scrollToInput(crmRef)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>e-mail</Text>
              <TextInput
                ref={emailRef}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollToInput(emailRef)}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                ref={senhaRef}
                style={styles.input}
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                onFocus={() => scrollToInput(senhaRef)}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Finalizar cadastro</Text>
          </TouchableOpacity>
        </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  col: {
    flex: 1,
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
    backgroundColor: "#FFF",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
