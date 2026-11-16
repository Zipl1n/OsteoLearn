# OsteoLearn
### Plataforma Interativa de Aprendizado em Osteologia Humana 3D

Um portal web interativo desenvolvido para auxiliar estudantes da área da saúde, integrando recursos visuais tridimensionais, correlação clínica de doenças e avaliações práticas gamificadas para o estudo da anatomia óssea humana.

---

## Ambientes em Produção (Deploy Ativo)

| Camada | Serviço | URL Pública |
| :--- | :--- | :--- |
| **Aplicação Web (Frontend SPA)** | Vercel | https://osteo-learn.vercel.app |
| **API RESTful (Backend Django)** | Render | https://osteolearn.onrender.com |
| **Catálogo Público de Ossos 3D (JSON)** | Render + Supabase | https://osteolearn.onrender.com/api/bones/ |
| **Pipeline CI/CD (GitHub Actions)** | GitHub Actions | https://github.com/Zipl1n/OsteoLearn/actions |
| **Manual do Usuário Completo** | Documentação | [MANUAL_DO_USUARIO.md](./MANUAL_DO_USUARIO.md) |

---

## Visão Geral

O **OsteoLearn** é um ambiente virtual educativo focado no estudo aprofundado do sistema esquelético humano.

A plataforma oferece:
* **Visualizador 3D Interativo:** Exploração de 30 modelos anatômicos reais (`.glb`) com rotação 360°, zoom, isolamento de ossos e destaque de acidentes anatômicos (forames, fossas, processos, tubérculos).
* **Guia Clínico de Patologias Ósseas:** Catálogo de doenças correlacionadas às estruturas ósseas com vínculo direto ao modelo 3D correspondente.
* **Quiz "Prova da Alfinetada" 3D:** Desafios práticos de identificação espacial 3D (`SPATIAL_CLICK`) e múltipla escolha (`MULTIPLE_CHOICE`) com validação e consolidação de nota no servidor, feedback imediato e persistência de histórico no PostgreSQL.

A proposta é proporcionar um ambiente de **aprendizagem ativa**, reduzindo a dependência de atlas impressos em 2D e superando as limitações de horário e desgaste de peças nos laboratórios físicos universitários.

---

## Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| **Atlas 3D Interativo** | Renderização WebGL/Three.js de 30 peças anatômicas (Esqueleto Axial e Apendicular) com marcação espacial `(X, Y, Z)` de acidentes ósseos. |
| **Guia de Patologias** | Catálogo clínico (fraturas, osteoporose, escoliose, lesões articulares) correlacionado diretamente aos modelos 3D. |
| **Quiz "Alfinetada" 3D** | Avaliação prática por osso ou geral com validação no backend (`POST /api/quiz/submit/`), feedback visual imediato e pontuação persistida. |
| **Dashboard do Estudante** | Acompanhamento de ofensiva de estudo (`streak_days`), taxa de precisão global e mapeamento automático dos ossos com maior índice de erro para revisão. |
| **Gestão Administrativa (RF22 / RF23)** | Painel exclusivo para perfil `ADMIN`/`ADM` para cadastro, edição e exclusão de ossos 3D, acidentes anatômicos, patologias e questões do quiz, além de visualização de logs de auditoria. |
| **Autenticação em 2 Etapas (2FA)** | Segurança reforçada com envio de código OTP de 6 dígitos por e-mail real e política de senha forte. |
| **Integração Google OAuth 2.0** | Login social federado e seguro utilizando a conta Google do estudante. |
| **Privacidade e LGPD** | Termos de uso e política de privacidade independentes, registro de consentimento versionado, exportação de dados (Art. 18) e exclusão/anonimização de conta. |

---

## Tecnologias Utilizadas

* **Frontend:** React 19 (Vite), TypeScript, Tailwind CSS, React Three Fiber + Three.js (`@react-three/drei`), Axios, Lucide-React.
* **Backend:** Python + Django REST Framework (API RESTful), SimpleJWT (autenticação stateless), Django Allauth / dj-rest-auth (Google OAuth 2.0).
* **Banco de Dados:** PostgreSQL 16 gerenciado no Supabase Cloud com Row Level Security (RLS) ativo em todas as tabelas do esquema `public`.
* **Deploy & Infraestrutura:** Vercel (Frontend SPA), Render (Backend Gunicorn + WhiteNoise) e Google Apps Script HTTPS Relay + Gmail SMTP (entrega de e-mails transacionais de 2FA e recuperação de senha).
* **Testes & Qualidade:** PyTest + pytest-django (testes unitários e de integração isolados por markers), Ruff (linter Python) e GitHub Actions (pipeline de integração contínua).

---

## Modelagem do Sistema (Diagramas UML e BPMN 2.0)

### 1. Diagrama de Classes UML

O diagrama abaixo representa a estrutura completa de classes de domínio da plataforma, contemplando controle de acesso por papéis (`User.role`), segurança (`TwoFactorCode`, `PasswordResetCode`, `AuditLog`), acervo osteológico 3D (`Bone`, `AnatomicalLandmark`, `BonePathology`, `QuizQuestion`) e histórico pedagógico (`BoneStudyRecord`, `QuizAttempt`):

```mermaid
classDiagram
    direction LR

    class User {
        +BigAutoField id
        +EmailField email
        +CharField password
        +CharField name
        +CharField role
        +BooleanField is_staff
        +BooleanField is_active
        +BooleanField lgpd_consent
        +CharField lgpd_consent_version
        +DateTimeField lgpd_consent_at
        +GenericIPAddressField lgpd_consent_ip
        +PositiveIntegerField streak_days
        +DateField last_study_date
        +CharField last_quiz_name
        +PositiveIntegerField last_quiz_progress
        +is_admin() bool
    }

    class TwoFactorCode {
        +BigAutoField id
        +ForeignKey user_id
        +CharField code_hash
        +DateTimeField created_at
        +DateTimeField expires_at
        +BooleanField is_used
        +PositiveIntegerField failed_attempts
        +is_valid(code_string) bool
    }

    class PasswordResetCode {
        +BigAutoField id
        +ForeignKey user_id
        +CharField code_hash
        +DateTimeField created_at
        +DateTimeField expires_at
        +BooleanField is_used
        +PositiveIntegerField failed_attempts
        +is_valid(code_string) bool
    }

    class AuditLog {
        +BigAutoField id
        +ForeignKey user_id
        +CharField action
        +GenericIPAddressField ip_address
        +TextField user_agent
        +DateTimeField timestamp
        +JSONField details
    }

    class Bone {
        +BigAutoField id
        +CharField name
        +CharField scientific_name
        +CharField region
        +CharField skeleton_division
        +CharField model_url
        +TextField description
        +TextField clinical_summary
        +BooleanField is_active
    }

    class AnatomicalLandmark {
        +BigAutoField id
        +ForeignKey bone_id
        +PositiveIntegerField order
        +CharField name
        +TextField description
        +FloatField pos_x
        +FloatField pos_y
        +FloatField pos_z
    }

    class BonePathology {
        +BigAutoField id
        +ForeignKey bone_id
        +CharField title
        +TextField description
    }

    class QuizQuestion {
        +BigAutoField id
        +ForeignKey bone_id
        +CharField statement
        +CharField question_type
        +CharField correct_answer
        +CharField option_a
        +CharField option_b
        +CharField option_c
        +CharField option_d
        +FloatField pos_x
        +FloatField pos_y
        +FloatField pos_z
        +BooleanField is_active
        +DateTimeField created_at
    }

    class BoneStudyRecord {
        +BigAutoField id
        +ForeignKey user_id
        +ForeignKey bone_id
        +BooleanField studied_in_atlas
        +PositiveIntegerField last_accuracy
        +PositiveIntegerField best_accuracy
        +PositiveIntegerField attempts_count
        +DateTimeField updated_at
    }

    class QuizAttempt {
        +BigAutoField id
        +ForeignKey user_id
        +ForeignKey bone_id
        +PositiveIntegerField correct_count
        +PositiveIntegerField total_questions
        +PositiveIntegerField accuracy
        +DateTimeField created_at
    }

    User "1" *-- "0..*" TwoFactorCode : possui
    User "1" *-- "0..*" PasswordResetCode : solicita
    User "0..1" o-- "0..*" AuditLog : gera
    User "1" *-- "0..*" BoneStudyRecord : registra
    User "1" *-- "0..*" QuizAttempt : realiza
    Bone "1" *-- "1..*" AnatomicalLandmark : contem
    Bone "1" *-- "0..*" BonePathology : apresenta
    Bone "1" *-- "1..*" QuizQuestion : avalia
    Bone "1" *-- "0..*" BoneStudyRecord : compoe
    Bone "1" *-- "0..*" QuizAttempt : referencia
```

### 2. Processo BPMN 2.0 - Autenticação Híbrida (2FA e Google OAuth 2.0)

```mermaid
flowchart LR
    subgraph Estudante["Raia: Estudante"]
        S((Início)) --> G1{Método de Login?}
        G1 -->|E-mail e Senha| A1["Informar Credenciais e Consentimento LGPD"]
        G1 -->|Google OAuth| A2["Selecionar Entrar com Google"]
        A5["Inserir Código OTP de 6 Dígitos"]
        A6["Acessar Dashboard e Atlas 3D"] --> E1(((Sessão Iniciada)))
    end

    subgraph Sistema["Raia: Sistema OsteoLearn"]
        B1["Validar Credenciais e Limite de Tentativas"]
        B2{Credenciais Válidas?}
        B3["Notificar Falha ou Bloqueio Temporário"] --> E2(((Acesso Negado)))
        B4["Gerar Desafio OTP de 6 Dígitos (Expira 5m)"]
        B5["Verificar Código 2FA e Prazo de Validade"]
        B6{Código 2FA Válido?}
        B7["Emitir Sessão JWT e Carregar Perfil"]
    end

    subgraph Externos["Raia: Provedores Externos (Google Identity / Serviço de E-mail)"]
        C1["Autenticar Identidade no Google OAuth 2.0"]
        C2["Despachar E-mail com Código de Verificação"]
    end

    A1 --> B1 --> B2
    B2 -->|Não| B3
    B2 -->|Sim| B4 --> C2 --> A5 --> B5 --> B6
    B6 -->|Não / Expirado| B3
    B6 -->|Sim| B7
    A2 --> C1 --> B7 --> A6
```

### 3. Processo BPMN 2.0 - Avaliação Prática ("Prova da Alfinetada" 3D)

```mermaid
flowchart LR
    subgraph Estudante["Raia: Estudante"]
        QS((Início)) --> QA1["Selecionar Modalidade da Prova (Por Osso ou Geral)"]
        QA2["Rotacionar Peça 3D e Clicar no Pino Espacial (X,Y,Z)"]
        QA3["Inspecionar Marcador 3D e Escolher Alternativa (A, B, C, D)"]
        QA4["Visualizar Feedback Imediato de Acerto ou Erro"]
        QA5["Analisar Relatório Final de Precisão (%) e Desempenho"] --> QE(((Prova Concluída)))
    end

    subgraph SistemaQuiz["Raia: Sistema OsteoLearn (Motor 3D e API de Avaliação)"]
        QB1["Carregar Malha 3D (.glb) e Sortear Questões Ativas"]
        QG1{Tipo da Questão?}
        QB2["Validar Resposta e Destacar Acidente Correto no Modelo 3D"]
        QG2{Restam Questões?}
        QB3["Consolidar Nota no Servidor, Atualizar Ofensiva (Streak) e Mapear Ossos para Revisão"]
    end

    QA1 --> QB1 --> QG1
    QG1 -->|SPATIAL_CLICK| QA2 --> QB2
    QG1 -->|MULTIPLE_CHOICE| QA3 --> QB2
    QB2 --> QA4 --> QG2
    QG2 -->|Sim| QG1
    QG2 -->|Não| QB3 --> QA5
```

---

## Segurança, Autenticação e Conformidade LGPD

* **Autenticação Híbrida:** Login tradicional (e-mail e senha com 2FA) e autenticação social via **Google OAuth 2.0** (`email` e `profile`).
* **Proteção contra Força Bruta e Enumeração:** Bloqueio automático após 5 tentativas falhas no login, 2FA ou recuperação de senha (`429 Too Many Requests`), com respostas genéricas para não expor e-mails cadastrados.
* **Criptografia Zero-Knowledge:** Senhas protegidas com PBKDF2 SHA-256 e códigos de 2FA/recuperação armazenados exclusivamente como hash SHA-256 no banco de dados.
* **Validação Estrita de Upload 3D e RLS:** Upload administrativo restrito exclusivamente a modelos `.glb` autênticos (inspeção da assinatura binária glTF 2.0 `0x46546c67`, versão 2 e estrutura de chunks no frontend e no backend) e Row Level Security (RLS) habilitado em todas as 24 tabelas do PostgreSQL/Supabase.
* **Conformidade LGPD (Art. 18):** Termos de Uso e Política de Privacidade dedicados, registro de aceite com IP e timestamp, exportação instantânea de todos os dados pessoais em JSON e exclusão de conta.

---

## Roteiro de Verificação das Funcionalidades e Integrações

As funcionalidades podem ser verificadas diretamente no ambiente de produção (https://osteo-learn.vercel.app) ou em execução local, sem necessidade de expor credenciais sensíveis:

1. **Cadastro, Consentimento LGPD e Autenticação 2FA por E-mail:**
   * Na tela inicial, clique em **Criar Conta**, informe nome, um endereço de e-mail válido sob seu controle, uma senha forte (mínimo de 8 caracteres com letra, número e símbolo) e marque o aceite dos Termos de Uso e Política de Privacidade.
   * Em seguida, faça login com o e-mail e senha criados: o backend enviará o código OTP de 6 dígitos para a caixa de entrada informada. Insira o código para liberar a sessão JWT.
2. **Integração Externa - Login Social com Google OAuth 2.0:**
   * Na tela de login, clique em **Continuar com o Google**, selecione sua conta Google e verifique o redirecionamento autenticado direto para o Dashboard do estudante.
3. **Exploração no Atlas 3D e Guia de Patologias:**
   * Acesse **Catálogo 3D**, filtre por Esqueleto Axial ou Apendicular e selecione qualquer um dos 30 ossos (ex.: *Crânio*, *Fêmur*, *Úmero*, *Escápula*).
   * Rotacione e aplique zoom na malha 3D interativa, clique nas etiquetas numeradas dos acidentes anatômicos e alterne para o **Guia de Patologias** para consultar as correlações clínicas vinculadas ao osso.
4. **Prova da Alfinetada 3D e Persistência no Banco de Dados:**
   * Acesse **Prova 3D (Quiz)**, inicie uma avaliação por osso ou geral e responda às questões de clique espacial no pino 3D e múltipla escolha.
   * Ao concluir, retorne ao **Dashboard** e recarregue a página (`F5`) para confirmar que a pontuação, a taxa de precisão, o histórico de tentativas e os ossos recomendados para revisão permanecem gravados no PostgreSQL.
5. **Direitos do Titular LGPD (Exportação de Dados):**
   * No menu do perfil do usuário (canto superior direito), clique em **Exportar Meus Dados (LGPD)** para baixar o arquivo `.json` contendo seus registros cadastrais, histórico de estudo e trilha de auditoria.

---

## Instalação e Execução Local

### Pré-requisitos
* **Node.js** >= 18.x e **npm**
* **Python** >= 3.10.x, **pip** e **venv**
* **Git** e navegador com suporte a **WebGL 2.0**

### 1. Clonar o Repositório
```bash
git clone https://github.com/Zipl1n/OsteoLearn.git
cd OsteoLearn
```

### 2. Configurar e Executar o Backend
```bash
cd backend
python -m venv venv
# No Windows:
venv\Scripts\activate
# No Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Crie um arquivo `backend/.env` com valores próprios de desenvolvimento (nunca versione senhas ou chaves reais):
```env
SECRET_KEY=sua_chave_secreta_de_desenvolvimento
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
LOGIN_REDIRECT_URL=http://localhost:5173/
EMAIL_HOST_USER=seu_email_smtp@exemplo.com
EMAIL_HOST_PASSWORD=sua_senha_de_app_smtp
GOOGLE_CLIENT_ID=seu_client_id_oauth_google
GOOGLE_CLIENT_SECRET=seu_client_secret_oauth_google
```

Execute as migrações, popule o acervo anatômico e inicie o servidor:
```bash
python manage.py migrate
python manage.py seed_atlas
python manage.py runserver
```

### 3. Configurar e Executar o Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse em: `http://localhost:5173`

### 4. Executar Testes Automatizados e Linter
```bash
cd backend

# Testes unitários isolados (validação de senha, LGPD, expiração 2FA, mocks de envio de e-mail)
pytest -m "not integration" -v

# Testes de integração (fluxo completo de API, persistência no banco e confirmação 2FA)
pytest -m integration -v

# Verificação de qualidade e estilo de código Python
ruff check .
```

---

## Autor

**Matheus Henrique Silva Oliveira**  
Conceito, Arquitetura de Software, UI/UX e Desenvolvimento Fullstack.  
GitHub: [@Zipl1n](https://github.com/Zipl1n)
