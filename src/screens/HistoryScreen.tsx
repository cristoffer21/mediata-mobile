import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Audio } from 'expo-av';
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "HistoryScreen">;

type Registro = {
  id: string; // GUID ou string
  pacienteNome: string;
  cpfPaciente?: string;
  dataRegistro: string;
  resumo?: string;
  transcricaoFull?: string;
  audioPath?: string;
  audioDurationMs?: number;
  latitude?: number;
  longitude?: number;
  endereco?: string;
};

export default function HistoryScreen({ navigation }: Props) {
  const { medicoId, signOut } = useAuth();
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [initializedAudio, setInitializedAudio] = useState(false);

  async function carregarRegistros(filtroNome?: string) {
    if (!medicoId) return;
    setLoading(true);
    try {
      console.log(`[HISTORICO] GET /api/registro/historico/${medicoId}`);
      const response = await api.get<any[]>(`/api/registro/historico/${medicoId}`);
      let responseData = response.data || [];
      console.log(`[HISTORICO] ✅ ${responseData.length} registros recebidos`);
      console.log(`[HISTORICO] ===== DIAGNÓSTICO CPF =====`);
      console.log(`[HISTORICO] Primeiro registro completo:`, JSON.stringify(responseData[0], null, 2));
      console.log(`[HISTORICO] Chaves disponíveis:`, Object.keys(responseData[0] || {}));
      console.log(`[HISTORICO] Verificando variações de CPF:`);
      console.log(`[HISTORICO]   - cpfPaciente:`, responseData[0]?.cpfPaciente);
      console.log(`[HISTORICO]   - CpfPaciente:`, responseData[0]?.CpfPaciente);
      console.log(`[HISTORICO]   - cpf:`, responseData[0]?.cpf);
      console.log(`[HISTORICO]   - Cpf:`, responseData[0]?.Cpf);
      console.log(`[HISTORICO]   - CPF:`, responseData[0]?.CPF);
      console.log(`[HISTORICO] ===========================`);

      if (filtroNome && filtroNome.trim() !== "") {
        responseData = responseData.filter(item => {
          const nome = item.nomePaciente || item.pacienteNome || "";
          const cpf = item.cpfPaciente || item.CpfPaciente || "";
          const searchTerm = filtroNome.toLowerCase();
          return nome.toLowerCase().includes(searchTerm) || cpf.includes(searchTerm);
        });
      }

      const mapped: Registro[] = responseData.map((item, idx) => {
        console.log(`[HISTORICO] ===== Registro ${idx} =====`);
        console.log(`[HISTORICO] Chaves disponíveis:`, Object.keys(item));
        console.log(`[HISTORICO] Item completo:`, JSON.stringify(item, null, 2));
        
        const idCandidate = item.id || item.Id || item.ID || item.registroId || item.RegistroId || item.registroID;
        const pacienteNome = item.nomePaciente || item.pacienteNome || item.NomePaciente || item.PacienteNome || "Paciente";
        const cpfPaciente = item.cpfPaciente || item.CpfPaciente || item.cpf || item.Cpf || item.CPF || undefined;
        console.log(`[HISTORICO] CPF encontrado:`, cpfPaciente);
        
        const dataRegistro = item.dataRegistro || item.dataConsulta || item.DataConsulta || item.data || new Date().toISOString();
        const resumoOrig = item.resumo || item.transcricao || item.Transcricao || item.texto || "";
        const resumo = typeof resumoOrig === 'string' && resumoOrig.length > 180 ? resumoOrig.slice(0, 177) + "..." : resumoOrig;
        const audioPath = item.audioPath || item.AudioPath || item.caminhoAudio || item.CaminhoAudio || item.audio || item.Audio || item.audioUrl || item.AudioUrl || undefined;
        
        const latitude = item.latitude || item.Latitude;
        const longitude = item.longitude || item.Longitude;
        const endereco = item.endereco || item.Endereco || item.localizacao || item.Localizacao || item.address || item.Address;
        console.log(`[HISTORICO] Localização - Lat: ${latitude}, Lng: ${longitude}, Endereço: ${endereco}`);
        
        const fallbackId = `${pacienteNome}-${dataRegistro}-${idx}`;
        const id = String(idCandidate || fallbackId);
        console.log(`[HISTORICO] ========================`);
        return { id, pacienteNome, cpfPaciente, dataRegistro, resumo, transcricaoFull: resumoOrig, audioPath, latitude, longitude, endereco };
      });
      setRegistros(mapped);
    } catch (error: any) {
      const status = error?.response?.status;
      const backendError = error?.response?.data;
      console.log(`[HISTORICO] ❌ Status: ${status}`);
      console.log(`[HISTORICO] ❌ Erro backend:`, JSON.stringify(backendError, null, 2));
      console.log(`[HISTORICO] ❌ Mensagem:`, error?.message);
      let errorMsg = "Não foi possível carregar os registros.";
      const raw = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
      if (status === 500) {
        if (/cycle/i.test(raw)) {
          errorMsg = 'Erro interno: loop de referência nas entidades. Ajuste o backend para retornar DTO ou usar ReferenceHandler.IgnoreCycles.';
        } else {
          errorMsg = `Erro no servidor: ${raw}`;
        }
      }
      Alert.alert("Erro", errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRegistros();
  }, [medicoId]);
  
  useFocusEffect(
    React.useCallback(() => {
      carregarRegistros();
    }, [medicoId])
  );
 
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!initializedAudio) {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      }).then(() => {
        setInitializedAudio(true);
        console.log('[AUDIO] Modo áudio inicializado');
      }).catch(e => console.log('[AUDIO] Falha init áudio:', e?.message));
    }
  }, [initializedAudio]);

  function handleBuscar() {
    carregarRegistros(busca || undefined);
  }

  function handleLimpar() {
    setBusca("");
    carregarRegistros();
  }

  function renderItem({ item }: { item: Registro }) {
    async function handlePlay() {
      try {
        if (!item.audioPath) {
          Alert.alert('Áudio indisponível', 'Este registro não possui áudio.');
          return;
        }        
        if (playingId && playingId === item.id) {
          if (sound) {
            try { await sound.stopAsync(); } catch {}
            try { await sound.unloadAsync(); } catch {}
          }
          setSound(null);
          setPlayingId(null);
          return;
        }
        if (sound) {
          try { await sound.stopAsync(); } catch {}
          try { await sound.unloadAsync(); } catch {}
        }
       
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: false });
    
        const originalPath = item.audioPath.trim();
        const filename = (() => { try { const p = originalPath.split('/'); return p[p.length-1]; } catch { return originalPath; } })();
        const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
        const uri = `${base}/api/registro/audio/${encodeURIComponent(filename)}`;
        console.log('[AUDIO][HISTORICO] URI stream:', uri);
        
        const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
        setSound(newSound);
        setPlayingId(item.id);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (!status) return;
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlayingId(null);
            try { newSound.unloadAsync(); } catch {}
            setSound(null);
          }
        });
        await newSound.playAsync();
       
        const s = await newSound.getStatusAsync();
        if (s.isLoaded && s.durationMillis) {
          setRegistros(prev => prev.map(r => r.id === item.id ? { ...r, audioDurationMs: s.durationMillis } : r));
        }
      } catch (e: any) {
        console.log('[AUDIO][HISTORICO] Erro play:', e?.message);
        Alert.alert('Erro', 'Falha ao reproduzir áudio.');
      }
    }
    return (
      <View style={styles.recordCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.recordName}>{item.pacienteNome}</Text>
        </View>
        <Text style={styles.recordDate}>
          {new Date(item.dataRegistro).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate("RecordDetails", {
            id: item.id,
            pacienteNome: item.pacienteNome,
            cpfPaciente: item.cpfPaciente,
            dataRegistro: item.dataRegistro,
            transcricao: item.transcricaoFull || item.resumo,
            audioPath: item.audioPath,
            latitude: item.latitude,
            longitude: item.longitude,
            endereco: item.endereco,
          })}
        >
          <Text style={styles.detailsButtonText}>Detalhes</Text>
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.brandBannerTitle}>Histórico</Text>
        <TouchableOpacity
          style={styles.bannerIconButton}
          onPress={async () => {
            try {
              await signOut();
              Alert.alert("Sess\u00e3o encerrada");
              navigation.navigate("HomeScreen");
            } catch {}
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="power-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Relato dos pacientes:</Text>
        
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Buscar histórico</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome ou CPF do paciente"
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
          keyExtractor={(item, index) => (item.id && String(item.id).trim() !== '' ? String(item.id) : String(index))}
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
  bannerIconButton: {
    position: 'absolute',
    right: 24,
    padding: 4,
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
  container: { flex: 1, padding: 24, paddingBottom: 40 },
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  deleteBadge: { backgroundColor: '#ef4444', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deleteBadgeText: { color: '#fff', fontWeight: '700' },
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
  detailsButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 0,
    borderColor: colors.primary,
    alignItems: 'center',
    alignSelf: 'center'
  },
  detailsButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  playButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  playButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  noAudio: { marginTop: 8, fontSize: 11, color: colors.muted },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
  },
  audioMeta: { marginTop: 4, fontSize: 11, color: colors.muted },
  audioUrlPreview: { marginTop: 2, fontSize: 10, color: colors.muted, maxWidth: '100%' },
  
});
