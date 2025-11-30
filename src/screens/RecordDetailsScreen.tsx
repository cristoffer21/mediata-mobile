import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";
import { deleteRegistro } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetails">;

type RegistroDetalhado = {
  id: string;
  pacienteNome: string;
  cpfPaciente?: string;
  dataRegistro: string;
  transcricao: string;
  audioPath?: string;
  latitude?: number;
  longitude?: number;
  endereco?: string;
};

export default function RecordDetailsScreen({ route }: Props) {
  const { id, pacienteNome, cpfPaciente, dataRegistro, transcricao, audioPath, latitude, longitude, endereco } = route.params;
  const navigation = useNavigation();
  const [registro, setRegistro] = useState<RegistroDetalhado | null>({
    id: String(id),
    pacienteNome: pacienteNome || "Paciente",
    cpfPaciente: cpfPaciente,
    dataRegistro: dataRegistro || new Date().toISOString(),
    transcricao: transcricao || "",
    audioPath: audioPath,
    latitude: latitude,
    longitude: longitude,
    endereco: endereco,
  });
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  
  useEffect(() => {
    setLoading(false);
  }, []);

  
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  async function handlePlayAudio() {
    try {
      if (!registro?.audioPath) {
        Alert.alert('Áudio', 'Nenhum áudio disponível neste registro.');
        return;
      }
      
      if (isPlaying) {
        await sound?.stopAsync();
        await sound?.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }
      
      if (sound) {
        await sound.stopAsync().catch(()=>{});
        await sound.unloadAsync().catch(()=>{});
      }
     
      const originalPath = registro.audioPath.trim();
      const isHttp = (p: string) => /^https?:\/\//i.test(p);
      const extractFile = (p: string) => { try { const arr = p.split('/'); return arr[arr.length-1]; } catch { return p; } };
      const removeDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const safeName = (s: string) => removeDiacritics(s).replace(/\s+/g, '_').replace(/[\\/]+/g, '_');
      const filename = extractFile(originalPath);
      const base = (api.defaults.baseURL || '').replace(/\/$/, '');
      const buildStream = (name: string) => `${base}/api/registro/audio/${encodeURIComponent(name)}`;
      const buildStatic = (name: string) => `${base}/uploads/${encodeURIComponent(name)}`;
      const swapExt = (name: string) => name.replace(/\.(m4a|mp4)$/i, (m) => (m.toLowerCase() === '.m4a' ? '.mp4' : '.m4a'));

      const nameVariants = Array.from(new Set([
        filename,
        safeName(filename),
        swapExt(filename),
        safeName(swapExt(filename)),
      ].filter(Boolean)));

      const urlCandidates: string[] = [];
      if (isHttp(originalPath)) {
        urlCandidates.push(originalPath);
      }
      for (const n of nameVariants) {
        urlCandidates.push(buildStream(n));
        urlCandidates.push(buildStatic(n));
      }

      console.log('[AUDIO][DETAILS] Candidates:', JSON.stringify(urlCandidates, null, 2));
      let chosenUrl: string | null = null;
      for (const testUrl of urlCandidates) {
        try {
          const resp = await fetch(testUrl, { method: 'GET' });
          if (resp.ok) { chosenUrl = testUrl; break; }
          console.log('[AUDIO][DETAILS] Test URL falhou', resp.status, testUrl);
        } catch (e:any) {
          console.log('[AUDIO][DETAILS] Test URL erro', e?.message, testUrl);
        }
      }
      if (!chosenUrl) {
        Alert.alert('Áudio', 'Arquivo de áudio não encontrado (404).');
        return;
      }
      console.log('[AUDIO][DETAILS] URI stream:', chosenUrl);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: chosenUrl });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync().catch(()=>{});
          setSound(null);
        }
      });
    } catch (e: any) {
      console.log('[AUDIO][DETAILS] Erro:', e?.message);
      Alert.alert('Erro', 'Falha ao reproduzir áudio.');
      setIsPlaying(false);
    }
  }

  async function handleCopyTranscription() {
    const text = registro?.transcricao?.trim() || '';
    if (!text) {
      Alert.alert('Transcrição', 'Sem transcrição para copiar.');
      return;
    }
    try {
      await Clipboard.setStringAsync(text);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Transcrição copiada', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copiado', 'Transcrição copiada para a área de transferência.');
      }
    } catch {
      try {
       
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          
          await navigator.clipboard.writeText(text);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Transcrição copiada', ToastAndroid.SHORT);
          } else {
            Alert.alert('Copiado', 'Transcrição copiada para a área de transferência.');
          }
          return;
        }
      } catch {}
      Alert.alert('Aviso', 'Não foi possível copiar. Você pode compartilhar.');
    }
  }

  async function handleShareTranscription() {
    const text = registro?.transcricao?.trim() || '';
    if (!text) {
      Alert.alert('Transcrição', 'Sem transcrição para compartilhar.');
      return;
    }
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Erro', 'Falha ao compartilhar.');
    }
  }

  async function handleGeneratePDF() {
    const text = registro?.transcricao?.trim() || '';
    if (!text) {
      Alert.alert('PDF', 'Sem transcrição para gerar PDF.');
      return;
    }
    
    if (!registro) {
      Alert.alert('Erro', 'Registro não disponível.');
      return;
    }
    
    try {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #16a34a; font-size: 24px; margin-bottom: 10px; }
              .info { color: #666; font-size: 14px; margin-bottom: 20px; }
              .location { color: #15803d; font-size: 13px; margin-bottom: 15px; padding: 10px; background-color: #dcfce7; border-radius: 5px; }
              .content { font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>Mediata - Transcrição</h1>
            <div class="info">
              <strong>Paciente:</strong> ${registro.pacienteNome}<br/>
              ${registro.cpfPaciente ? `<strong>CPF:</strong> ${registro.cpfPaciente}<br/>` : ''}
              <strong>Data:</strong> ${new Date(registro.dataRegistro).toLocaleDateString('pt-BR')}
            </div>
            ${registro.endereco ? `<div class="location">📍 <strong>Local:</strong> ${registro.endereco}</div>` : ''}
            <div class="content">${text}</div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Falha ao gerar o PDF.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 8 }}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!registro) {
    return (
      <View style={styles.center}>
        <Text>Nenhum registro encontrado.</Text>
      </View>
    );
  }


  const dataFormatada = new Date(registro.dataRegistro).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
        <Text style={styles.brandBannerTitle}>Detalhes do Registro</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{registro.pacienteNome}</Text>
      {registro.cpfPaciente && <Text style={styles.cpf}>CPF: {registro.cpfPaciente}</Text>}
      <Text style={styles.date}>{dataFormatada}</Text>

      {/* Exibir localização se disponível */}
      {(registro.endereco || (registro.latitude && registro.longitude)) && (
        <View style={styles.locationBox}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Local do atendimento</Text>
            {registro.endereco ? (
              <Text style={styles.locationText}>{registro.endereco}</Text>
            ) : (registro.latitude && registro.longitude) ? (
              <Text style={styles.locationText}>
                Lat: {registro.latitude.toFixed(6)}, Lng: {registro.longitude.toFixed(6)}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <Text style={styles.label}>Transcrição do atendimento:</Text>
      <View style={styles.transcriptionBox}>
        <Text style={styles.transcriptionText}>
          {registro.transcricao?.trim() ? registro.transcricao : 'Sem transcrição disponível.'}
        </Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyTranscription}>
          <Text style={styles.secondaryButtonText}>Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleGeneratePDF}>
          <Text style={styles.secondaryButtonText}>Compartilhar PDF</Text>
        </TouchableOpacity>
      </View>
      {registro.audioPath ? (
        <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
          <Text style={styles.playButtonText}>{isPlaying ? 'Parar áudio' : 'Reproduzir áudio'}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noAudio}>Sem áudio neste registro.</Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert('Excluir', 'Confirmar exclusão deste registro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: async () => {
                try {
                  const ok = await deleteRegistro(registro.id);
                  if (ok) {
                    Alert.alert('Sucesso', 'Registro excluído com sucesso.');
                    
                    try { (navigation as any).goBack(); } catch {}
                  } else {
                    Alert.alert('Erro', 'Não foi possível excluir.');
                  }
                } catch {
                  Alert.alert('Erro', 'Falha ao excluir.');
                }
              } }
          ]);
        }}
      >
        <Text style={styles.deleteButtonText}>Excluir Registro</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
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
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  cpf: { fontSize: 14, color: "#666", marginBottom: 2 },
  date: { fontSize: 12, color: "#555", marginBottom: 16 },
  label: { fontWeight: "bold", marginBottom: 4 },
  text: { fontSize: 14, lineHeight: 20 },
  transcriptionBox: { marginTop: 4, marginBottom: 12, padding: 16, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  transcriptionText: { fontSize: 14, lineHeight: 22, color: '#1e293b' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6', backgroundColor: '#FFF' },
  secondaryButtonText: { color: '#3B82F6', fontWeight: '600' },
  deleteButton: { marginTop: 24, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
  playButton: { marginTop: 16, backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  playButtonText: { color: '#fff', fontWeight: '600' },
  noAudio: { marginTop: 12, fontSize: 12, color: '#666' },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#166534',
  },
});
