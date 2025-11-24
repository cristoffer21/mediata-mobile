import { Audio } from "expo-av";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function RecordScreen() {
  const [nomePaciente, setNomePaciente] = useState("");
  const [cpfPaciente, setCpfPaciente] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [accepted, setAccepted] = useState(false);
  const { medicoId } = useAuth();

  async function startRecording() {
    if (!accepted) {
      Alert.alert(
        "Atenção",
        "Você precisa declarar que revise as informações antes de gravar."
      );
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Preciso de acesso ao microfone.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  }

  async function stopRecording() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (!uri) return;

    try {
      const formData = new FormData();
      formData.append("medicoId", String(medicoId ?? 1));
      formData.append("nomePaciente", nomePaciente);
      formData.append("cpfPaciente", cpfPaciente);
      formData.append("audio", {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
      } as any);

      await api.post("/registros", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Sucesso", "Registro salvo com sucesso!");
      setNomePaciente("");
      setCpfPaciente("");
      setAccepted(false);
    } catch (err) {
      Alert.alert("Erro", "Falha ao enviar o registro.");
    }
  }

  const isRecording = !!recording;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Registro Paciente" showBack />

      <View style={styles.container}>
        <Text style={styles.title}>O que o paciente relatou hoje?</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nome do Paciente</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do paciente"
            value={nomePaciente}
            onChangeText={setNomePaciente}
          />

          <Text style={styles.label}>CPF do Paciente</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o CPF do paciente"
            value={cpfPaciente}
            onChangeText={setCpfPaciente}
          />
        </View>

        <View style={styles.centerArea}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && { backgroundColor: "#EF4444" },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordIcon}>{isRecording ? "⏹" : "▶"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.declarationRow}>
          <Switch value={accepted} onValueChange={setAccepted} />
          <Text style={styles.declarationText}>
            Declaro que revisei as informações geradas pela plataforma MedAta e
            assumo total responsabilidade pelas condutas médicas descritas.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
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
    marginBottom: 16,
  },
  centerArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recordIcon: {
    color: "#FFF",
    fontSize: 32,
  },
  declarationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  declarationText: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
  },
});
