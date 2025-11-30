# Mediata Mobile

Aplicativo móvel para médicos realizarem transcrições de áudio de consultas médicas com geolocalização e gerenciamento de registros de pacientes.

## 📱 Sobre o Projeto

O Mediata é um aplicativo desenvolvido em React Native com Expo que permite aos médicos:

- Gravar áudios de consultas médicas
- Transcrever automaticamente os áudios
- Registrar informações dos pacientes (nome, CPF)
- Capturar localização onde o atendimento foi realizado
- Visualizar histórico de registros
- Gerar PDFs com as transcrições
- Compartilhar registros

## 🚀 Tecnologias Utilizadas

### Core
- **React Native** - Framework para desenvolvimento mobile
- **Expo SDK 54** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem de programação
- **React Navigation** - Navegação entre telas

### Funcionalidades Principais
- **expo-av** - Gravação de áudio (deprecated, será migrado para expo-audio)
- **expo-location** - Captura de geolocalização e geocoding
- **expo-print** - Geração de PDFs
- **expo-sharing** - Compartilhamento de arquivos
- **AsyncStorage** - Armazenamento local de dados

### Backend
- API REST em .NET
- Endpoint: `http://192.168.1.17:5231`
- Autenticação por GUID
- Upload de arquivos via FormData

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Expo Go instalado no dispositivo móvel
- Backend da API rodando

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/cristoffer21/mediata-mobile.git
cd mediata-mobile
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto:
```env
EXPO_PUBLIC_API_BASE=http://192.168.1.17:5231
EXPO_PUBLIC_TRANSCRIBE_URL=http://192.168.1.17:5231/api/registro/transcrever
```

4. Inicie o servidor de desenvolvimento:
```bash
npx expo start
```

5. Escaneie o QR code com o Expo Go (Android) ou Camera (iOS)

## 📱 Como Usar

### Primeiro Acesso

1. **Cadastro**
   - Preencha: Nome, Sobrenome, Email, CRM (formato: 123456/UF), Senha
   - Data de nascimento é formatada automaticamente (dd/mm/aaaa)
   - CRM é formatado automaticamente (123456/SP)

2. **Login**
   - Use email e senha cadastrados
   - O sistema salva suas credenciais localmente

### Gravando Registros

1. **Iniciar Gravação**
   - Toque no botão verde de gravação (90x90px)
   - Permita acesso ao microfone quando solicitado
   - Fale normalmente durante a consulta

2. **Parar Gravação**
   - Toque novamente no botão para parar
   - O áudio será transcrito automaticamente
   - Preencha nome do paciente e CPF
   - Escolha se deseja adicionar localização

3. **Adicionar Localização**
   - Após cada gravação, um alerta pergunta se deseja adicionar localização
   - Se escolher "Sim", permita acesso à localização
   - O endereço será capturado automaticamente via GPS + geocoding
   - A localização aparece em uma caixa verde com ícone 📍

4. **Salvar Registro**
   - Toque em "Salvar Registro"
   - O sistema envia: áudio, transcrição, dados do paciente e localização para o backend

### Visualizando Registros

1. **Histórico**
   - Acesse a aba "Histórico"
   - Veja todos os registros salvos
   - Use a barra de busca para filtrar por nome ou CPF
   - Toque em um registro para ver detalhes

2. **Detalhes do Registro**
   - Veja: Nome do paciente, CPF, Data, Localização
   - Reproduza o áudio (botão verde)
   - Copie a transcrição
   - Gere PDF com transcrição e localização
   - Compartilhe o PDF
   - Delete o registro se necessário

## 🎨 Design e Identidade Visual

- **Cor primária**: `#16a34a` (verde)
- **Cor de fundo clara**: `#dcfce7` (verde claro)
- **Ícone**: "M" verde da Mediata
- **Fonte padrão**: Arial, sans-serif

## 📂 Estrutura do Projeto

```
mediata-mobile/
├── app/                          # Rotas do Expo Router
│   ├── (tabs)/                   # Navegação em abas
│   │   ├── index.tsx            # Tela inicial
│   │   └── explore.tsx          # Tela de exploração
│   ├── _layout.tsx              # Layout principal
│   └── modal.tsx                # Modal genérico
├── assets/                       # Assets estáticos
│   └── images/                  # Ícones e imagens
│       ├── icon.png             # Ícone principal (1024x1024)
│       ├── android-icon-*.png   # Ícones adaptativos Android
│       └── medico(a).jpg        # Imagem placeholder
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── Header.tsx           # Cabeçalho das telas
│   │   ├── PrimaryButton.tsx    # Botão primário verde
│   │   ├── RecordCard.tsx       # Card de registro no histórico
│   │   └── TextInputField.tsx   # Campo de texto estilizado
│   ├── constants/
│   │   └── theme.js             # Cores e estilos do tema
│   ├── context/
│   │   └── AuthContext.tsx      # Contexto de autenticação
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navegação principal
│   ├── screens/                 # Telas do aplicativo
│   │   ├── HomeScreen.tsx       # Tela inicial/landing
│   │   ├── LoginScreen.tsx      # Tela de login
│   │   ├── RegisterScreen.tsx   # Tela de cadastro
│   │   ├── RecordScreen.tsx     # Tela de gravação
│   │   ├── HistoryScreen.tsx    # Tela de histórico
│   │   └── RecordDetailsScreen.tsx  # Detalhes do registro
│   └── services/                # Serviços e APIs
│       ├── api.ts               # Configuração do axios
│       └── auth.ts              # Funções de autenticação e registro
├── app.json                     # Configuração do Expo
├── package.json                 # Dependências do projeto
└── tsconfig.json               # Configuração do TypeScript
```

## 🔐 Permissões Necessárias

### Android
- `RECORD_AUDIO` - Gravação de áudio
- `ACCESS_FINE_LOCATION` - Localização precisa
- `ACCESS_COARSE_LOCATION` - Localização aproximada

### iOS
- `NSLocationWhenInUseUsageDescription` - Localização durante uso
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Localização sempre que em uso
- Permissões de microfone solicitadas automaticamente

## 🔄 Fluxo de Dados

### Cadastro
```
RegisterScreen → registerMedico() → Backend /api/medico
Payload: {Nome, Sobrenome, DataNascimento, Crm, Email, Senha, Registros: []}
```

### Login
```
LoginScreen → login() → Backend /api/medico/login
Response: {medicoId (GUID)} → Salvo em AsyncStorage
```

### Gravação de Registro
```
1. RecordScreen → Audio.Recording.createAsync()
2. stopRecording() → Transcrição automática
3. Alert "Deseja adicionar localização?" → Location.getCurrentPositionAsync()
4. Location.reverseGeocodeAsync() → Endereço formatado
5. gravarRegistroPaciente() → Backend /api/registro/gravar
   FormData: {
     MedicoId, NomePaciente, CPF, Transcricao,
     AudioArquivo (blob), Latitude, Longitude, Localizacao
   }
```

### Histórico
```
HistoryScreen → Backend /api/registro/historico/{medicoId}
Response: Array de registros com {cpf, localizacao, ...}
```

## 🛠️ Funcionalidades Extras Implementadas

### Auto-formatação de Campos
- **Data de Nascimento**: Formata automaticamente para dd/mm/aaaa durante digitação
- **CRM**: Formata automaticamente para 123456/UF com letras maiúsculas

### Geolocalização (0.3 pontos extras)
- Captura após gravação com consentimento do usuário
- Geocoding reverso para converter coordenadas em endereço
- Exibição em caixa verde com ícone 📍
- Incluído no PDF gerado

### Geração de PDF
- Template HTML estilizado com cores da marca
- Inclui: Nome do paciente, CPF, Data, Localização, Transcrição
- Localização em caixa verde destacada
- Compartilhamento direto do PDF

## 🐛 Debugging

O projeto possui logging extensivo para debug:

### RecordScreen
- `[AUDIO PERMISSION]` - Status de permissões de áudio
- `[LOCATION]` - Dados de geolocalização capturados
- `[UPLOAD]` - Processo de envio para backend

### RegisterScreen  
- `[CADASTRO]` - Todo fluxo de registro com payloads

### auth.ts
- `[API]` - Todas as chamadas de API com payloads e respostas

### HistoryScreen
- `Item completo:` - JSON completo de cada registro
- Mapeamento de variações de nomes de campos

## 📝 Notas de Desenvolvimento

### Questões Resolvidas
- ✅ Backend usa PascalCase para campos (Nome, Sobrenome, etc.)
- ✅ Campo "Localizacao" (não "Endereco")
- ✅ Campo "CPF" (não "CpfPaciente")
- ✅ Data em formato ISO com timezone (yyyy-mm-ddT00:00:00.000Z)
- ✅ Permissão de áudio verificada antes de cada gravação
- ✅ Permissão de localização solicitada apenas quando usuário aceita

### Melhorias Futuras
- [ ] Migrar de expo-av para expo-audio (SDK 54+)
- [ ] Backend retornar latitude/longitude na API de histórico
- [ ] Modo offline com sincronização posterior
- [ ] Edição de registros existentes
- [ ] Filtros avançados no histórico (por data, localização)

## 📄 Licença

Este projeto é privado e de uso acadêmico.

## 👨‍💻 Autor

Eunice Correia
Vitória Viana
Cristoffer

Repositório React Native [@cristoffer21](https://github.com/cristoffer21)
Repositório Backend [@EuniceCorreia](https://github.com/EuniceCorreia/mediAta-Backend.git)

---

**Mediata Mobile** - Transcrições médicas com geolocalização 📍🎙️
