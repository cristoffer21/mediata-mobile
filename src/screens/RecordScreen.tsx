import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, findNodeHandle, KeyboardAvoidingView, PermissionsAndroid, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from "react-native";
import Header from "../components/Header";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { TRANSCRIBE_URL } from "../services/api";
import { gravarRegistroPaciente, transcreverAudio } from "../services/auth";

const MIC_ASKED_KEY = "@medata:micAsked";
const DRAFT_KEY = "@medata:recordDraft";


function formatCPF(value: string): string {
 
  const digits = value.replace(/\D/g, '');
    
  const limited = digits.slice(0, 11);
    
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  }
}

export default function RecordScreen() {
      const [nomePaciente, setNomePaciente] = useState("");
      const [cpfPaciente, setCpfPaciente] = useState("");
      const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number; endereco?: string } | null>(null);
      const [recording, setRecording] = useState<Audio.Recording | null>(null);
      const [recordedUri, setRecordedUri] = useState<string | null>(null);
      const [transcricao, setTranscricao] = useState<string | null>(null);
      const [isTranscribing, setIsTranscribing] = useState(false);
      const [saving, setSaving] = useState(false);
      const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
      const [isPlaying, setIsPlaying] = useState(false);
      const [micPermissionAsked, setMicPermissionAsked] = useState(false);
      const [accepted, setAccepted] = useState(false);

      const { medicoId, signOut } = useAuth();
      const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
      const scrollRef = useRef<ScrollView | null>(null);
      const nomePacienteRef = useRef<any>(null);
      const cpfPacienteRef = useRef<any>(null);

      
      useEffect(() => {
        (async () => {
          try {
            const stored = await AsyncStorage.getItem(MIC_ASKED_KEY);
            if (stored === "1") setMicPermissionAsked(true);
                        
            const draft = await AsyncStorage.getItem(DRAFT_KEY);
            if (draft) {
              const parsed = JSON.parse(draft);
              if (parsed.nomePaciente) setNomePaciente(parsed.nomePaciente);
              if (parsed.cpfPaciente) setCpfPaciente(parsed.cpfPaciente);
              if (parsed.recordedUri) setRecordedUri(parsed.recordedUri);
              if (parsed.transcricao) setTranscricao(parsed.transcricao);
              
              console.log("[DRAFT] Rascunho restaurado:", parsed);
            }
          } catch (e) {
            console.log("[DRAFT] Erro ao carregar:", e);
          }
        })();
      }, []);

      
      useEffect(() => {
        const timer = setTimeout(() => {
          if (nomePaciente || cpfPaciente || recordedUri || transcricao) {
            const saveDraft = async () => {
              try {
                const draft = {
                  nomePaciente,
                  cpfPaciente,
                  recordedUri,
                  transcricao,
                  accepted
                };
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                console.log("[DRAFT] Rascunho salvo");
              } catch (e) {
                console.log("[DRAFT] Erro ao salvar:", e);
              }
            };
            saveDraft();
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }, [nomePaciente, cpfPaciente, recordedUri, transcricao, accepted]);

      function scrollToInput(ref: any) {
        const node = findNodeHandle(ref?.current);
        if (!node) return;
        UIManager.measure(node, (_x, _y, _width, _height, _pageX, pageY) => {
          const headerOffset = 64;
          const offset = Math.max(pageY - headerOffset - 20, 0);
          scrollRef.current?.scrollTo({ y: offset, animated: true });
        });
      }

      const isRecording = !!recording;

      async function ensureMicPermission(): Promise<boolean> {
        try {
          if (Platform.OS === "android") {
            const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (already) {
              await AsyncStorage.setItem(MIC_ASKED_KEY, "1");
              setMicPermissionAsked(true);
              return true;
            }
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
              title: "Permissão de microfone",
              message: "O app precisa acessar o microfone para gravar áudio.",
              buttonPositive: "OK",
            });
            const granted = result === PermissionsAndroid.RESULTS.GRANTED;
            await AsyncStorage.setItem(MIC_ASKED_KEY, "1");
            setMicPermissionAsked(true);
            return granted;
          } else {
            const current = await Audio.getPermissionsAsync();
            if (current.status === "granted") {
              await AsyncStorage.setItem(MIC_ASKED_KEY, "1");
              setMicPermissionAsked(true);
              return true;
            }
            const { status } = await Audio.requestPermissionsAsync();
            const granted = status === "granted";
            await AsyncStorage.setItem(MIC_ASKED_KEY, "1");
            setMicPermissionAsked(true);
            return granted;
          }
        } catch {
          return false;
        }
      }

      async function startRecording() {
        try {
          console.log("[GRAVACAO] Iniciando startRecording...");
          console.log("[GRAVACAO] Nome:", nomePaciente);
          console.log("[GRAVACAO] CPF:", cpfPaciente);
          console.log("[GRAVACAO] Accepted:", accepted);
                    
          if (!nomePaciente.trim() || !cpfPaciente.trim()) {
            console.log("[GRAVACAO] Validação falhou: nome ou CPF vazio");
            Alert.alert("Atenção", "Por favor, informe o nome e CPF do paciente antes de gravar.");
            return;
          }
          
          const cpfDigits = cpfPaciente.replace(/\D/g, '');
          console.log("[GRAVACAO] CPF digits:", cpfDigits, "length:", cpfDigits.length);
          if (cpfDigits.length !== 11) {
            console.log("[GRAVACAO] Validação falhou: CPF não tem 11 dígitos");
            Alert.alert("Atenção", "CPF inválido. Digite um CPF válido com 11 dígitos.");
            return;
          }

          if (!accepted) {
            console.log("[GRAVACAO] Validação falhou: declaração não aceita");
            Alert.alert("Atenção", "Você precisa declarar que revise as informações antes de gravar.");
            return;
          }
          
          console.log("[GRAVACAO] Todas validações passaram");
          
          setRecordedUri(null);
          setTranscricao(null);
          if (soundObj) {
            try { await soundObj.unloadAsync(); } catch {}
            setSoundObj(null);
          }
          setIsPlaying(false);

          const storedAsked = await AsyncStorage.getItem(MIC_ASKED_KEY);
          console.log("[GRAVACAO] storedAsked:", storedAsked);

          async function startRecordingNow() {
            console.log("[GRAVACAO] startRecordingNow chamado");
            try {
             
              const { status } = await Audio.getPermissionsAsync();
              console.log("[GRAVACAO] Status permissão atual:", status);
              
              if (status !== 'granted') {
                console.log("[GRAVACAO] Permissão não concedida, solicitando...");
                const { status: newStatus } = await Audio.requestPermissionsAsync();
                console.log("[GRAVACAO] Novo status:", newStatus);
                
                if (newStatus !== 'granted') {
                  Alert.alert("Permissão negada", "Não é possível gravar sem permissão de microfone.");
                  return;
                }
              }
              
              await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: false });
              console.log("[GRAVACAO] Audio mode configurado");
              const recordingObj = new Audio.Recording();
              await recordingObj.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
              console.log("[GRAVACAO] Recording preparado");
              await recordingObj.startAsync();
              console.log("[GRAVACAO] Recording iniciado!");
              setRecording(recordingObj);
            } catch (e: any) {
              console.log("[GRAVACAO] Erro ao gravar:", e?.message);
              Alert.alert("Erro", "Não foi possível iniciar a gravação: " + e?.message);
              return;
            }
          }
          
          if (!storedAsked || storedAsked !== "1") {
            console.log("[GRAVACAO] Primeira vez, mostrando Alert de permissão");
            Alert.alert(
              "Permissão de microfone",
              "O app precisa acessar o microfone para gravar áudio. Deseja permitir?",
              [
                { text: "Não", style: "cancel", onPress: () => {
                  console.log("[GRAVACAO] Usuário negou permissão no Alert");
                } },
                { text: "Sim", onPress: async () => {
                  console.log("[GRAVACAO] Usuário aceitou permissão no Alert");
                  const granted = await ensureMicPermission();
                  console.log("[GRAVACAO] Permissão concedida:", granted);
                  if (granted) {
                    await startRecordingNow();
                  } else {
                    Alert.alert("Permissão negada", "Não foi possível obter acesso ao microfone.");
                  }
                } },
              ],
              { cancelable: false }
            );
            return;
          }

          
          console.log("[GRAVACAO] Já perguntou antes, verificando permissão...");
          const granted = await ensureMicPermission();
          console.log("[GRAVACAO] Permissão concedida:", granted);
          if (!granted) { 
            Alert.alert("Permissão negada", "Precisamos do microfone para gravar."); 
            return; 
          }
          await startRecordingNow();
        } catch {
          Alert.alert("Erro", "Não foi possível iniciar a gravação.");
        }
      }

      async function stopRecording() {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (!uri) return;
        setRecordedUri(uri);

        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (!info.exists || !info.size || Number(info.size) === 0) {
            setTranscricao(null);
            Alert.alert("Erro", "O arquivo de áudio gerado está vazio.");
            return;
          }
        } catch {}

        
        console.log("[TRANSCRICAO] Iniciando envio para:", TRANSCRIBE_URL);
        console.log("[TRANSCRICAO] URI:", uri);
        setIsTranscribing(true);
        setTranscricao("Transcrevendo...");
        try {
            const extMatch = uri.match(/\.([a-z0-9]+)(?:\?|$)/i);
            const ext = extMatch ? extMatch[1].toLowerCase() : "m4a";
            let mime = "audio/m4a";
            if (ext === "opus" || ext === "ogg") mime = "audio/ogg";
            if (ext === "wav") mime = "audio/wav";
            if (ext === "m4a" || ext === "mp4") mime = "audio/m4a";
            const filename = `audio.${ext}`;
            const audioFile = { uri, name: filename, type: mime };
            console.log("[TRANSCRICAO] Chamando transcreverAudio...");
            const data = await transcreverAudio(audioFile as any);
            console.log("[TRANSCRICAO] Data recebido:", JSON.stringify(data, null, 2));
            const texto = data.texto ?? data.text ?? "";
            console.log("[TRANSCRICAO] Texto extraído:", texto);
            
            if (!texto || texto.trim() === "") {
              console.log("[TRANSCRICAO] Texto vazio, setando 'Nenhum áudio detectado...'");
              setTranscricao("Nenhum áudio detectado...");
            } else {
              console.log("[TRANSCRICAO] Setando texto:", texto);
              setTranscricao(texto);
            }
            console.log("[TRANSCRICAO] Estado atualizado com sucesso");
        } catch (e:any) {
            console.log("[TRANSCRICAO] Falha:", e?.message, e?.response?.status);
            Alert.alert("Erro na Transcrição", "Não foi possível transcrever o áudio. Você pode salvar mesmo assim.");
            setTranscricao("Erro na transcrição - você pode salvar mesmo assim");
        } finally {
            setIsTranscribing(false);
        }
        
        try {
          console.log("[LOCALIZACAO] Iniciando captura de localização...");
                    
          Alert.alert(
            "Localização do Atendimento",
            "Deseja adicionar a localização onde este atendimento foi realizado?",
            [
              {
                text: "Não",
                style: "cancel",
                onPress: () => {
                  console.log("[LOCALIZACAO] Usuário optou por não adicionar localização");
                }
              },
              {
                text: "Sim",
                onPress: async () => {
                  try {
                    console.log("[LOCALIZACAO] Solicitando permissão...");
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    console.log("[LOCALIZACAO] Status:", status);
                    
                    if (status === 'granted') {
                      console.log("[LOCALIZACAO] Obtendo localização...");
                      const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced
                      });                      
                      
                      try {
                        const address = await Location.reverseGeocodeAsync({
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude
                        });
                        
                        if (address && address.length > 0) {
                          const addr = address[0];
                          const enderecoCompleto = [
                            addr.street,
                            addr.streetNumber,
                            addr.district,
                            addr.city,
                            addr.region
                          ].filter(Boolean).join(', ');
                          
                          setLocalizacao({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            endereco: enderecoCompleto
                          });
                          console.log("[LOCALIZACAO] ✓ Localização capturada:", enderecoCompleto);
                        } else {
                          setLocalizacao({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                          });
                          console.log("[LOCALIZACAO] ✓ Coordenadas capturadas");
                        }
                      } catch (e) {
                        console.log("[LOCALIZACAO] Erro ao geocodificar:", e);
                        setLocalizacao({
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude
                        });
                      }
                    } else {
                      console.log("[LOCALIZACAO] Permissão negada");
                      Alert.alert("Permissão Negada", "A localização não foi adicionada ao registro.");
                    }
                  } catch (e) {
                    console.log("[LOCALIZACAO] Erro:", e);
                    Alert.alert("Erro", "Não foi possível obter a localização.");
                  }
                }
              }
            ],
            { cancelable: false }
          );
        } catch (e) {
          console.log("[LOCALIZACAO] Erro ao obter localização:", e);
        }
      }

      async function playRecording() {
        if (!recordedUri) { Alert.alert("Atenção", "Não há gravação para reproduzir."); return; }
        try {
          if (soundObj) { try { await soundObj.unloadAsync(); } catch {} setSoundObj(null); }
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: false });
          const { sound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: false });
          setSoundObj(sound);
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (!status) return;
            if ("didJustFinish" in status && status.didJustFinish) {
              setIsPlaying(false);
              try { sound.unloadAsync(); } catch {}
              setSoundObj(null);
            }
          });
          await sound.playAsync();
          setIsPlaying(true);
        } catch {
          Alert.alert("Erro", "Falha ao reproduzir o áudio.");
          setIsPlaying(false);
        }
      }

      async function stopPlaying() {
        if (!soundObj) return;
        try { await soundObj.stopAsync(); await soundObj.unloadAsync(); } catch {}
        setIsPlaying(false);
        setSoundObj(null);
      }

      async function doSave(transcricaoToSend: string | null) {
  setSaving(true);
  try {
    if (!medicoId) {
      Alert.alert("Sessão expirada", "Faça login novamente para salvar.");
      setSaving(false);
      return;
    }
    const medicoIdStr = String(medicoId).trim();
    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(medicoIdStr);
    if (!isGuid) {
      Alert.alert("Erro", "MedicoId inválido. O servidor exige GUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
      setSaving(false);
      return;
    }

    const audioFile = recordedUri
      ? {
          uri: recordedUri,
          name: recordedUri.endsWith(".opus") ? "audio.opus" : "audio.m4a",
          type: recordedUri.endsWith(".opus") ? "audio/ogg" : "audio/mp4",
        }
      : undefined;
    
    const cpfDigits = cpfPaciente.replace(/\D/g, '');
    
    console.log("[GRAVAR] Dados sendo enviados:");
    console.log("[GRAVAR] - medicoId:", medicoIdStr);
    console.log("[GRAVAR] - nomePaciente:", nomePaciente);
    console.log("[GRAVAR] - cpfPaciente (digits):", cpfDigits);
    console.log("[GRAVAR] - transcricao length:", transcricaoToSend?.length || 0);
    console.log("[GRAVAR] - localização:", localizacao ? `${localizacao.latitude}, ${localizacao.longitude}` : "Não capturada");
    
    const response = await gravarRegistroPaciente({
      medicoId: medicoIdStr,
      nomePaciente,
      cpfPaciente: cpfDigits,
      transcricao: transcricaoToSend || "",
      audioFile,
      latitude: localizacao?.latitude,
      longitude: localizacao?.longitude,
      endereco: localizacao?.endereco,
    });

    console.log("[GRAVAR] resposta:", JSON.stringify(response, null, 2));

    Alert.alert("Sucesso!", "Registro salvo com sucesso.");
    setNomePaciente("");
    setCpfPaciente("");
    setAccepted(false);
    setRecordedUri(null);
    setTranscricao(null);
    setLocalizacao(null);
       
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
      console.log("[DRAFT] Rascunho limpo após salvar");
    } catch (e) {
      console.log("[DRAFT] Erro ao limpar:", e);
    }
  } catch (e: any) {
    console.log("[GRAVAR][RecordScreen] Erro capturado:", e?.message);
    const serverMsg = e?.message || "Falha ao salvar o registro do paciente.";
    Alert.alert("Erro ao Salvar", serverMsg);
  } finally {
    setSaving(false);
  }
}

      async function handleSave() {
        if (!recordedUri) { Alert.alert("Atenção", "Não há gravação para salvar."); return; }
        await doSave(transcricao);
      }

      console.log("[RENDER] Estado transcricao atual:", transcricao);

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
              <Text style={styles.brandBannerTitle}>Registro Paciente</Text>
              <View style={styles.bannerIconsContainer}>
                <TouchableOpacity
                  style={styles.bannerIconButton}
                  onPress={() => navigation.navigate("HistoryScreen")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bannerIconButton}
                  onPress={async () => {
                    try {
                      await signOut();
                      Alert.alert("Sessão encerrada");
                      navigation.navigate("HomeScreen");
                    } catch {}
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="power-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={64}
          >
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
              <View style={styles.container}>
                <Text style={styles.title}>Registro do Paciente</Text>
                <View style={styles.form}>
                  <Text style={styles.label}>Nome do Paciente</Text>
                  <TextInput ref={nomePacienteRef} style={styles.input} placeholder="Digite o nome do paciente" value={nomePaciente} onChangeText={setNomePaciente} editable={!isRecording} onFocus={() => scrollToInput(nomePacienteRef)} />
                  <Text style={styles.label}>CPF do Paciente</Text>
                  <TextInput ref={cpfPacienteRef} style={styles.input} placeholder="000.000.000-00" value={cpfPaciente} onChangeText={(text) => setCpfPaciente(formatCPF(text))} editable={!isRecording} keyboardType="numeric" onFocus={() => scrollToInput(cpfPacienteRef)} />
                </View>
                                
                {localizacao && (
                  <View style={styles.locationBox}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationTitle}>Localização capturada</Text>
                      {localizacao.endereco ? (
                        <Text style={styles.locationText}>{localizacao.endereco}</Text>
                      ) : (
                        <Text style={styles.locationText}>
                          Lat: {localizacao.latitude.toFixed(6)}, Lng: {localizacao.longitude.toFixed(6)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                
                <View style={styles.centerArea}>
                  <View style={styles.recordWrapper}>
                    <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={isRecording ? stopRecording : startRecording}>
                      {isRecording ? (
                        <View style={styles.stopSquare} />
                      ) : (
                        <Text style={styles.recordButtonLabel}>▸</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.actionColumn}>
                    <Text style={styles.recordingStatus}>{isRecording ? "Gravando..." : ""}</Text>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        (isRecording || saving) && styles.saveButtonDisabled
                      ]}
                      onPress={handleSave}
                      disabled={isRecording || saving}
                    >
                      {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        !recordedUri && styles.playButtonDisabled,
                        recordedUri && isPlaying && styles.playButtonActive
                      ]}
                      disabled={!recordedUri}
                      onPress={!recordedUri ? undefined : (isPlaying ? stopPlaying : playRecording)}
                    >
                      <Text style={styles.playButtonText}>
                        {!recordedUri ? "Reproduzir" : isPlaying ? "Parar" : "Reproduzir"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.transcriptionBox}>
                  <Text style={styles.transcriptionLabel}>📝 Transcrição:</Text>
                  {isTranscribing ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.transcriptionText}>Transcrevendo...</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.transcriptionInput}
                      placeholder="Aguardando gravação..."
                      value={transcricao || ""}
                      onChangeText={setTranscricao}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      editable={!isRecording && !isTranscribing}
                    />
                  )}
                </View>
                <View style={styles.declarationRow}>
                  <Switch value={accepted} onValueChange={setAccepted} />
                  <Text style={styles.declarationText}>Declaro que revisei as informações geradas pela plataforma MedAta e assumo total responsabilidade pelas condutas médicas descritas, observando rigorosamente os princípios da ética médica e as diretrizes da LGPD para proteção e tratamento de dados sensíveis.</Text>
                </View>
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
      bannerIconsContainer: {
        position: 'absolute',
        right: 24,
        flexDirection: 'row',
        gap: 12,
      },
      bannerIconButton: {
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
      container: { flex: 1, padding: 12, paddingTop: 24, paddingBottom: 4 },
      title: { fontSize: 19, fontWeight: "700", marginBottom: 18, textAlign: "center" },
      form: { marginBottom: 6 },
      label: { fontSize: 14, marginBottom: 4, marginTop: 8 },
      input: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: "#FFF", marginBottom: 5 },
      centerArea: { flexDirection: "row", alignItems: "center", marginBottom: 4, width: "100%" },
      recordWrapper: { flex: 1, alignItems: "center" },
      actionColumn: { flexShrink: 0, alignItems: "flex-end", gap: 12, marginRight: 8 },
      scrollContainer: { paddingBottom: 30 },
      recordButton: { 
        width: 90, 
        height: 90, 
        borderRadius: 45, 
        backgroundColor: colors.primary, 
        alignItems: "center", 
        justifyContent: "center", 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 5 }, 
        shadowOpacity: 0.38, 
        shadowRadius: 7, 
        elevation: 9,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.25)"
      },
      recordButtonActive: { 
        backgroundColor: colors.primary,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
        elevation: 6,
        borderColor: "rgba(255, 255, 255, 0.2)"
      },
      recordButtonLabel: { color: "#F5F5F5", fontSize: 62, fontWeight: "600", marginLeft: 5, marginTop: -9 },
      stopSquare: { width: 26, height: 26, backgroundColor: "#EF4444", borderRadius: 3 },
      buttonRow: { flexDirection: "row", gap: 12, marginTop: 12, justifyContent: "center" },
      saveButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.primary, minWidth: 85 },
      saveButtonText: { color: "#FFF", fontWeight: "600", textAlign: "center" },
      saveButtonDisabled: { backgroundColor: colors.border, opacity: 0.8 },
      declarationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
      declarationText: { flex: 1, fontSize: 12, color: colors.muted },
      recordingStatus: { marginTop: 8, color: "#EF4444", fontWeight: "700" },
      playButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#16a34a", minWidth: 100 },
      playButtonActive: { backgroundColor: "#ef4444" },
      playButtonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
      playButtonDisabled: { backgroundColor: "#cbd5e1" },
      transcriptionBox: { marginTop: 4, marginBottom: 4, padding: 10, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", minHeight: 125 },
      transcriptionLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#64748b" },
      transcriptionText: { fontSize: 14, lineHeight: 22, color: "#1e293b", fontStyle: "normal" },
      transcriptionInput: { 
        fontSize: 14, 
        lineHeight: 20, 
        color: "#1e293b", 
        minHeight: 110,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 10,
        backgroundColor: "#FFFFFF",
      },
      locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        padding: 12,
        borderRadius: 10,
        marginTop: 8,
        marginBottom: 4,
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
