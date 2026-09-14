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

---

## Tecnologias Utilizadas

* **Frontend:** React (Vite), TypeScript, Tailwind CSS, React Three Fiber + Three.js (visualização e manipulação 3D de modelos `.glb`), Lucide-React (ícones).

* **Backend:** Python + Django REST Framework (API RESTful), Django Allauth / dj-rest-auth (autenticação social via Google OAuth2) e Motor de Validação do Quiz 3D (cálculo de distância espacial).

* **Banco de Dados & Storage:** PostgreSQL 16 (armazenamento relacional de usuários, ossos, patologias e progresso) e Supabase Storage com CDN (distribuição otimizada de modelos 3D e imagens de exames).

* **Deploy & Hospedagem:** Vercel (Frontend SPA), Render (Backend Django API) e Supabase Cloud (Banco de dados gerenciado).

* **Testes & Qualidade:** PyTest / Django Test Framework (testes unitários e regras de negócio), ESLint e Prettier (padronização de código).

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

# Execute as migrações do banco de dados
python manage.py migrate

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
## Autor

Matheus Henrique Silva Oliveira  
Conceito, Arquitetura de Software, UI/UX e Desenvolvimento Fullstack.

GitHub: @Zipl1n