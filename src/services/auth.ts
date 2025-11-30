import axios from "axios";
import { Platform } from "react-native";
import api, { TRANSCRIBE_URL } from "./api";

export type AudioFile = { uri: string; name: string; type: string };

export async function login(email: string, senha: string) {
  try {
    console.log("[LOGIN] POST", api.defaults.baseURL + "/api/medico/login");
    console.log("[LOGIN] Payload:", JSON.stringify({ email, senha: "***" }, null, 2));
    
    const response = await api.post("/api/medico/login", { email, senha });
    
    console.log("[LOGIN] ✓ Status:", response.status);
    console.log("[LOGIN] Response completo:", JSON.stringify(response.data, null, 2));
    
    const data = response.data ?? {};

    function findGuid(obj: any, depth = 0): string | null {
      if (!obj || typeof obj !== "object" || depth > 3) return null;
      for (const [, v] of Object.entries(obj)) {
        if (typeof v === "string") {
          const s = v.trim();
          if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) return s;
        } else if (v && typeof v === "object") {
          const inner = findGuid(v, depth + 1);
          if (inner) return inner;
        }
      }
      return null;
    }

    const direct = String(
      data?.id ?? data?.medicoId ?? data?.guid ?? data?.Id ?? data?.MedicoId ?? ""
    ).trim();
    const fromTree = findGuid(data);
    const medicoGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(direct)
      ? direct
      : (fromTree || "");

    console.log("[LOGIN] medicoGuid encontrado:", medicoGuid);

    if (!medicoGuid) {
      console.log("[LOGIN] ❌ ID de médico não encontrado no payload");
      throw new Error("ID de médico inválido no retorno do servidor.");
    }
    return { ...data, medicoId: medicoGuid };
  } catch (error: any) {
    console.log("[LOGIN] ❌ Erro no login");
    console.log("[LOGIN] Status:", error?.response?.status);
    console.log("[LOGIN] Data:", JSON.stringify(error?.response?.data, null, 2));
    console.log("[LOGIN] Message:", error?.message);
        
    const msgText = error?.message || "";
    const isNetwork = msgText.includes("Network Error");
    if (isNetwork && Platform.OS === "android") {
      try {
        const prev = api.defaults.baseURL || "";
        let fallbackBase: string | null = null;
        try {
          const u = new URL(prev);
          if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || /^192\./.test(u.hostname) || /^10\./.test(u.hostname)) {
            u.hostname = "10.0.2.2";
            fallbackBase = u.toString().replace(/\/$/, "");
          }
        } catch {
         
        }
        if (fallbackBase) {
          const alt = axios.create({ baseURL: fallbackBase, timeout: 30000 });
          console.log("[LOGIN][fallback] POST", fallbackBase + "/api/medico/login");
          const response = await alt.post("/api/medico/login", { email, senha });
          console.log("[LOGIN][fallback] status:", response.status);
          const data = response.data ?? {};

          function findGuid2(obj: any, depth = 0): string | null {
            if (!obj || typeof obj !== "object" || depth > 3) return null;
            for (const [, v] of Object.entries(obj)) {
              if (typeof v === "string") {
                const s = v.trim();
                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) return s;
              } else if (v && typeof v === "object") {
                const inner = findGuid2(v, depth + 1);
                if (inner) return inner;
              }
            }
            return null;
          }

          const direct = String(
            data?.id ?? data?.medicoId ?? data?.guid ?? data?.Id ?? data?.MedicoId ?? ""
          ).trim();
          const fromTree = findGuid2(data);
          const medicoGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(direct)
            ? direct
            : (fromTree || "");
          if (!medicoGuid) {
            console.log("[LOGIN][fallback] payload recebido:", JSON.stringify(data, null, 2));
            throw new Error("ID de médico inválido no retorno do servidor (fallback).");
          }
          return { ...data, medicoId: medicoGuid };
        }
      } catch (innerErr: any) {
        console.log("[LOGIN][fallback][erro]", innerErr?.message);
        
      }
    }
    
    const status = error?.response?.status;
    const backendMsg = error?.response?.data?.message || error?.response?.data;
    console.log("[LOGIN][erro] status:", status, "mensagem:", backendMsg || error?.message);
    const msg = backendMsg
      ? `Falha no login: ${typeof backendMsg === "string" ? backendMsg : JSON.stringify(backendMsg)}`
      : (error?.message || "Falha no login");
    throw new Error(msg);
  }
}

export async function gravarRegistroPaciente(params: { 
  medicoId: string; 
  nomePaciente?: string; 
  cpfPaciente?: string; 
  transcricao?: string; 
  audioFile?: AudioFile;
  latitude?: number;
  longitude?: number;
  endereco?: string;
}) {
  const { medicoId, nomePaciente, cpfPaciente, transcricao, audioFile, latitude, longitude, endereco } = params;
  
  console.log("[GRAVAR] Construindo FormData...");
  console.log("[GRAVAR] MedicoId:", medicoId);
  console.log("[GRAVAR] NomePaciente:", nomePaciente || "Paciente Anônimo");
  console.log("[GRAVAR] CPF:", cpfPaciente || "Não informado");
  console.log("[GRAVAR] Localização:", latitude && longitude ? `${latitude}, ${longitude}` : "Não informado");
  console.log("[GRAVAR] Endereço:", endereco || "Não informado");
  console.log("[GRAVAR] AudioFile:", audioFile ? `${audioFile.name} (${audioFile.type})` : "NENHUM");
  
  const formData = new FormData();
  formData.append("MedicoId", medicoId);
  formData.append("NomePaciente", nomePaciente || "Paciente Anônimo");
  if (cpfPaciente) {
    console.log("[GRAVAR] ⚠️ ATENÇÃO: Enviando CPF =", cpfPaciente);
    formData.append("CPF", cpfPaciente);
  } else {
    console.log("[GRAVAR] ⚠️ ATENÇÃO: CPF NÃO será enviado (vazio)");
  }
  formData.append("Transcricao", transcricao || "");
  
  if (latitude !== undefined && longitude !== undefined) {
    formData.append("Latitude", String(latitude));
    formData.append("Longitude", String(longitude));
  }
  if (endereco) {
    formData.append("Localizacao", endereco);
  }
  
  console.log("[GRAVAR] ===== FORMDATA COMPLETO =====");
  // @ts-ignore - FormData entries() exists
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      console.log(`[GRAVAR]   ${key}: "${value}"`);
    } else if (value && typeof value === 'object' && 'name' in value) {
      console.log(`[GRAVAR]   ${key}: [FILE] ${value.name}`);
    } else {
      console.log(`[GRAVAR]   ${key}:`, value);
    }
  }
  console.log("[GRAVAR] ================================");
  
  if (audioFile) {
    const isM4a = /\.m4a$/i.test(audioFile.name) || audioFile.type === "audio/m4a" || audioFile.type === "audio/mp4";
    const isOpus = /\.opus$/i.test(audioFile.name) || audioFile.type === "audio/ogg";
    const fileType = isM4a ? "audio/mp4" : isOpus ? "audio/ogg" : audioFile.type;
    
    const fileObj = {
      uri: audioFile.uri,
      name: audioFile.name,
      type: fileType
    };
    
    console.log("[GRAVAR] Anexando AudioArquivo:", JSON.stringify(fileObj, null, 2));
    formData.append("AudioArquivo", fileObj as any);
  }

  const url = `${api.defaults.baseURL}/api/registro/gravar`;
  console.log("[GRAVAR] Enviando fetch POST para", url);
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",        
      },
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`[GRAVAR] ✅ Status ${response.status} (${elapsed}ms)`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log("[GRAVAR] ❌ Erro body:", text.substring(0, 200));
      throw new Error(`[${response.status}] ${text}`);
    }
    
    const data = await response.json();
    console.log("[GRAVAR] Resposta:", JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    
    if (error.message?.includes("[")) {
     
      throw error;
    }
    
    console.log(`[GRAVAR] ❌ ERRO DE REDE (${elapsed}ms):`, error.message);
    console.log("[GRAVAR] Stack:", error.stack?.substring(0, 300));
    throw new Error("Não foi possível conectar ao servidor. Verifique se backend está acessível em http://192.168.1.17:5231");
  }
}

export async function registerMedico(dados: { nome: string; sobrenome: string; dataNascimento: string; crm: string; email: string; senha: string }) {
  try {
    console.log("[REGISTER] POST /api/medico/cadastrar");
    
    const payload = { 
      Nome: dados.nome,
      Sobrenome: dados.sobrenome,
      DataNascimento: dados.dataNascimento + "T00:00:00.000Z",
      Crm: dados.crm,
      Email: dados.email,
      Senha: dados.senha,
      Registros: []
    };
    
    console.log("[REGISTER] Payload:", JSON.stringify(payload, null, 2));
    
    const response = await api.post("/api/medico/cadastrar", payload);
    
    console.log("[REGISTER] ✓ Status:", response.status);
    console.log("[REGISTER] Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.log("[REGISTER] ❌ Erro");
    console.log("[REGISTER] Status:", error.response?.status);
    console.log("[REGISTER] Data:", JSON.stringify(error.response?.data, null, 2));
    console.log("[REGISTER] Message:", error.message);
    throw error;
  }
}

export async function transcreverAudio(audioFile: AudioFile) {
  const formData = new FormData();
  formData.append("file", { uri: audioFile.uri, name: audioFile.name, type: audioFile.type } as any);
  const controller = new AbortController();
  const timeoutMs = 60000; 
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log("[TRANSCRICAO][auth.ts] Enviando para:", TRANSCRIBE_URL);
    const response = await fetch(TRANSCRIBE_URL, { method: "POST", body: formData, signal: controller.signal });
    console.log("[TRANSCRICAO][auth.ts] Response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("[TRANSCRICAO][auth.ts] Erro:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    console.log("[TRANSCRICAO][auth.ts] Data recebida:", JSON.stringify(data, null, 2));
    return data;
  } catch (e: any) {
    console.log("[TRANSCRICAO][auth.ts] Exception:", e.name, e.message);
    if (e.name === "AbortError") throw new Error("Timeout transcrição (60s)");
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteRegistro(id: string) {
  try {
   
    const response = await api.delete(`/api/registro/excluir/${id}`);
    return response.status >= 200 && response.status < 300;
  } catch (e: any) {
    console.log('[DELETE][registro] Erro:', e?.message);
    throw new Error('Falha ao excluir registro.');
  }
}

