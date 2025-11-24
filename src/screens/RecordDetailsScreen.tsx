import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetails">;

type RegistroDetalhado = {
  id: number;
  pacienteNome: string;
  dataRegistro: string;
  transcricao: string;
};

export default function RecordDetailsScreen({ route }: Props) {
  const { id } = route.params;
  const [registro, setRegistro] = useState<RegistroDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get<RegistroDetalhado>(`/registros/${id}`);
        setRegistro(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !registro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{registro.pacienteNome}</Text>
      <Text style={styles.date}>
        {new Date(registro.dataRegistro).toLocaleString("pt-BR")}
      </Text>
      <Text style={styles.label}>Transcrição:</Text>
      <Text style={styles.text}>{registro.transcricao}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  date: { fontSize: 12, color: "#555", marginBottom: 16 },
  label: { fontWeight: "bold", marginBottom: 4 },
  text: { fontSize: 14, lineHeight: 20 },
});
