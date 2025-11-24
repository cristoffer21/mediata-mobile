import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

type Registro = {
  id: number;
  pacienteNome: string;
  dataRegistro: string;
  resumo?: string;
};

export default function HistoryScreen({ navigation }: Props) {
  const { medicoId } = useAuth();
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<Registro[]>([]);

  async function carregarRegistros(filtroNome?: string) {
    if (!medicoId) return;
    const response = await api.get<Registro[]>("/registros", {
      params: { medicoId, nomePaciente: filtroNome },
    });
    setRegistros(response.data);
  }

  useEffect(() => {
    carregarRegistros();
  }, [medicoId]);

  function handleBuscar() {
    carregarRegistros(busca || undefined);
  }

  function handleLimpar() {
    setBusca("");
    carregarRegistros();
  }

  function renderItem({ item }: { item: Registro }) {
    return (
      <TouchableOpacity
        style={styles.recordCard}
       onPress={() => navigation.navigate("RecordDetails", { id: item.id })}
      >
        <Text style={styles.recordName}>{item.pacienteNome}</Text>
        <Text style={styles.recordDate}>
          {new Date(item.dataRegistro).toLocaleString("pt-BR")}
        </Text>
        {item.resumo ? (
          <Text style={styles.recordResumo} numberOfLines={2}>
            {item.resumo}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Histórico" showBack />

      <View style={styles.container}>
        <Text style={styles.title}>Relato dos pacientes:</Text>

        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Buscar histórico</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do paciente (ex: teste)"
            value={busca}
            onChangeText={setBusca}
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBuscar}>
              <Text style={styles.primaryButtonText}>Buscar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleLimpar}>
              <Text style={styles.secondaryButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={registros}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum histórico encontrado.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  filtersCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#FFF",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  recordCard: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: "600",
  },
  recordDate: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  recordResumo: {
    fontSize: 13,
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
  },
});
