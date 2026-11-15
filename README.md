# OsteoLearn
### Plataforma Interativa de Aprendizado em Osteologia Humana 3D

Um portal web interativo desenvolvido para auxiliar estudantes da área da saúde, integrando recursos visuais tridimensionais, correlação clínica de doenças e avaliações práticas gamificadas para o estudo da anatomia óssea humana.

---

## Visão Geral

O **OsteoLearn** é um ambiente virtual educativo focado no estudo aprofundado do sistema esquelético humano. 

A plataforma oferece:
* **Visualizador 3D Interativo:** Exploração de modelos anatômicos com rotação 360°, zoom, isolamento de ossos e destaque de acidentes anatômicos (forames, fossas, processos).

* **Guia Clínico de Patologias Ósseas:** Catálogo de doenças com descrições clínicas, exames de imagem (Raio-X) e vínculo direto ao modelo 3D do osso correspondente.

* **Quiz "Prova da Alfinetada" 3D:** Desafios de identificação e clique direto na superfície 3D com validação espacial e feedback imediato de acerto/erro.

A proposta é proporcionar um ambiente de **aprendizagem ativa**, reduzindo a dependência de atlas impressos em 2D e superando as limitações de horário e desgaste de peças nos laboratórios físicos universitários.

---

## Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| **Atlas 3D Interativo** | Renderização WebGL/Three.js de modelos anatômicos com isolamento de peças e marcação de acidentes ósseos. |
| **Guia de Patologias** | Catálogo clínico (fraturas, osteoporose, escoliose) correlacionado a exames de imagem e aos modelos 3D. |
| **Quiz "Alfinetada" 3D** | Perguntas práticas com cálculo de tolerância de clique no modelo 3D, feedback na hora e pontuação cumulativa. |
| **Dashboard do Estudante** | Acompanhamento do progresso, taxa de acertos e mapeamento dos ossos com maior índice de erros para revisão. |
| **Design Responsivo** | Interface moderna e fluida, adaptada para telas de computadores, notebooks e tablets. |
| **Autenticação em 2 Etapas (2FA)** | Segurança reforçada com envio de código OTP de 6 dígitos via e-mail real e filtro de senha forte. |
| **Integração Google OAuth** | Acesso rápido e seguro utilizando a conta Google do estudante. |
| **Privacidade e LGPD** | Termos de uso, política de privacidade independentes e exportação dos dados do titular (Art. 18). |

---

## Tecnologias Utilizadas

* **Frontend:** React (Vite), TypeScript, Tailwind CSS, React Three Fiber + Three.js (visualização e manipulação 3D de modelos `.glb`), Lucide-React (ícones).

* **Backend:** Python + Django REST Framework (API RESTful), Django Allauth / dj-rest-auth (autenticação social via Google OAuth2) e Motor de Validação do Quiz 3D (cálculo de distância espacial).

* **Banco de Dados & Storage:** PostgreSQL 16 (armazenamento relacional de usuários, ossos, patologias e progresso) e Supabase Storage com CDN (distribuição otimizada de modelos 3D e imagens de exames).

* **Deploy & Hospedagem:** Vercel (Frontend SPA), Render (Backend Django API) e Supabase Cloud (Banco de dados gerenciado).

* **Testes & Qualidade:** PyTest + pytest-django (testes unitários e de integração isolados por markers), Ruff (linter Python) e GitHub Actions (pipeline de CI automatizada).

## Segurança, Autenticação e 2FA

* **Autenticação Híbrida:** Login tradicional (e-mail e senha) e autenticação social via **Google OAuth 2.0**.
* **Autenticação em Dois Fatores (2FA):** Envio de código OTP de 6 dígitos via SMTP para validação de acesso e recuperação de conta.
* **Proteção contra Força Bruta e Enumeração:** Bloqueio automático após 5 tentativas falhas no login, 2FA ou recuperação de senha (`429 Too Many Requests`), com respostas genéricas que não expõem se o e-mail existe.
* **Criptografia Zero-Knowledge:** Senhas protegidas com PBKDF2 SHA-256 e códigos de 2FA armazenados exclusivamente como hash SHA-256 no banco de dados.
* **Política de Senha Forte:** Validação em tempo real exigindo no mínimo 8 caracteres, pelo menos 1 letra, 1 número e 1 caractere especial.
* **Validação Estrita de Upload 3D e RLS:** Upload administrativo restrito exclusivamente a modelos `.glb` autênticos (inspeção de assinatura binária glTF 2.0 no frontend e backend) e Row Level Security (RLS) habilitado nas tabelas do PostgreSQL/Supabase.

---

## Integração com API Externa (Google OAuth 2.0)

A plataforma consome a API do **Google Identity Services (OAuth 2.0)** para login seguro:
* **Escopos utilizados:** `email` e `profile`.
* **Fluxo:** O estudante autentica com sua conta Google, a API valida a identidade e o backend emite os tokens JWT de sessão vinculando os dados institucionais do aluno.

---

## Conformidade LGPD e Logs de Auditoria

* **Termos de Uso e Política de Privacidade:** Documentos separados e específicos para o OsteoLearn (regras do Atlas 3D da UMC e tratamento de dados), acessíveis a qualquer momento na plataforma.
* **Consentimento Registrado:** Aceite formal versionado (v1.0) registrado no banco com IP e data/hora.
* **Exportação de Dados (Art. 18):** Botão no perfil que permite ao estudante baixar um arquivo JSON com todos os seus dados e histórico.
* **Logs de Auditoria:** Tabela `AuditLog` que registra IP, navegador, data/hora e eventos de segurança (cadastros, logins, falhas, 2FA e alterações de senha).

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

* **Node.js** ≥ 18.x (para build e execução do frontend)

* **npm** ou **yarn** (gerenciador de pacotes)

* **Python** ≥ 3.10.x (para execução do backend Django)

* **pip** e **venv** (para gerenciamento de ambiente virtual Python)

* **Git** (para controle de versão)

* **Navegador Web Moderno** com suporte a WebGL 2.0 (Google Chrome, Microsoft Edge, Firefox, Brave)

---

## Instalação e Execução

### 1. Clonar o Repositório

```bash
# Clone o repositório oficial
git clone https://github.com/Zipl1n/OsteoLearn.git

# Acesse a pasta do projeto
cd OsteoLearn
```
### 2. Instalação do Backend
```bash
# Acesse a pasta do backend
cd backend

# Crie e ative o ambiente virtual
# No Windows:
python -m venv venv
venv\Scripts\activate

# No Linux/Mac:
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Configure o arquivo backend/.env com suas credenciais:
# SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL,
# FRONTEND_URL, CORS_ALLOWED_ORIGINS, LOGIN_REDIRECT_URL,
# EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# Execute as migrações do banco de dados
python manage.py migrate

# Popule o acervo inicial de ossos, acidentes, patologias e questões no banco
python manage.py seed_atlas

# Inicie o servidor da API
python manage.py runserver
```
### 3. Instalação do Frontend
```bash
# Acesse a pasta do frontend
cd frontend

# Instale os pacotes necessários
npm install

# Inicie a aplicação React
npm run dev
```
A aplicação estará acessível em: http://localhost:5173

### 4. Testes Automatizados e Linter (Backend)
```bash
cd backend

# Testes unitários isolados
pytest -m "not integration" -v

# Testes de integração (API + banco de teste em memória)
pytest -m integration -v

# Verificação de estilo e qualidade de código
ruff check .
```
## Autor

Matheus Henrique Silva Oliveira  
Conceito, Arquitetura de Software, UI/UX e Desenvolvimento Fullstack.

GitHub: @Zipl1n