# Manual do Usuário - Plataforma OsteoLearn
### Ambiente Virtual Interativo para o Estudo de Osteologia Humana 3D

---

## Sumário
1. [Apresentação e Requisitos de Acesso](#1-apresentação-e-requisitos-de-acesso)
2. [Cadastro, Autenticação em 2 Etapas (2FA) e Login com Google](#2-cadastro-autenticação-em-2-etapas-2fa-e-login-com-google)
3. [Painel Inicial (Dashboard) e Central de Notificações](#3-painel-inicial-dashboard-e-central-de-notificações)
4. [Exploração no Atlas 3D Interativo](#4-exploração-no-atlas-3d-interativo)
5. [Guia Clínico de Patologias Ósseas](#5-guia-clínico-de-patologias-ósseas)
6. [Avaliação Prática: Quiz 3D ("Prova da Alfinetada")](#6-avaliação-prática-quiz-3d-prova-da-alfinetada)
7. [Configurações da Conta e Direitos do Titular (LGPD)](#7-configurações-da-conta-e-direitos-do-titular-lgpd)
8. [Módulo do Administrador (Gestão de Acervo, Questões, Avisos e Auditoria)](#8-módulo-do-administrador-gestão-de-acervo-questões-avisos-e-auditoria)

---

## 1. Apresentação e Requisitos de Acesso

O **OsteoLearn** é uma plataforma educacional web voltada a estudantes e docentes da área da saúde para o estudo tridimensional do esqueleto humano, correlação clínica de patologias ósseas e realização de simulados práticos no formato da tradicional "Prova da Alfinetada".

* **Endereço de Acesso Online:** https://osteo-learn.vercel.app
* **Requisitos de Navegador:** Google Chrome, Microsoft Edge, Mozilla Firefox, Brave ou Safari atualizados, com aceleração gráfica **WebGL 2.0** habilitada.
* **Dispositivos Recomendados:** Computadores, notebooks ou tablets com acesso à internet.

---

## 2. Cadastro, Autenticação em 2 Etapas (2FA) e Login com Google

### 2.1. Criando uma Nova Conta de Estudante
1. Acesse a tela inicial do OsteoLearn e clique na aba **Criar Conta**.
2. Preencha seu **Nome Completo**, seu **E-mail** e crie uma **Senha Forte** que atenda aos 4 requisitos exibidos em tempo real na tela:
   * Mínimo de **8 caracteres**;
   * Pelo menos **1 letra** (maiúscula ou minúscula);
   * Pelo menos **1 número** (`0-9`);
   * Pelo menos **1 caractere especial** (ex.: `! @ # $ % & *`).
3. Leia os **Termos de Uso** e a **Política de Privacidade** (clicando nos respectivos links, se desejar) e marque a caixa de seleção de consentimento da **LGPD**.
4. Clique em **Criar Minha Conta**.

### 2.2. Acesso com E-mail, Senha e Verificação em 2 Etapas (2FA)
1. Na aba **Entrar**, informe seu e-mail e sua senha cadastrados e clique em **Entrar na Plataforma**.
2. O sistema enviará automaticamente um **código numérico de 6 dígitos (OTP)** para o seu e-mail (válido por 5 minutos).
3. Digite os 6 dígitos na tela de verificação e clique em **Confirmar Código**.
4. Caso não tenha recebido o e-mail após alguns instantes, verifique a caixa de *Spam/Lixo Eletrônico* ou clique em **Reenviar código**.

### 2.3. Acesso Rápido com Conta Google (OAuth 2.0)
1. Na tela de login, clique no botão **Continuar com o Google**.
2. Selecione sua conta Google na janela de autenticação segura.
3. No primeiro acesso via Google, confirme o aceite do Termo de Consentimento LGPD apresentado na tela para liberar o acesso imediato ao painel.

### 2.4. Recuperação de Senha Esquecida
1. Na tela de login, clique em **Esqueci minha senha**.
2. Informe o seu e-mail cadastrado e clique em **Enviar Código de Recuperação**.
3. Digite o código de 6 dígitos recebido no seu e-mail, defina uma nova senha forte e confirme a alteração.

---

## 3. Painel Inicial (Dashboard) e Central de Notificações

Ao entrar na plataforma, você é direcionado ao **Dashboard do Estudante**, que reúne:

* **Barra Superior de Busca Rápida:** Digite o nome de qualquer osso (ex.: *Fêmur*, *Clavícula*, *Temporal*) ou patologia para abrir diretamente a peça correspondente no visualizador 3D.
* **Indicador de Sequência de Estudos (Ofensiva):** Exibe quantos dias consecutivos você estudou ou realizou quizzes na plataforma.
* **Central de Notificações (Ícone de Sino):**
  * Localizada no canto superior direito ao lado do indicador de dias de estudo.
  * Toda nova conta recebe automaticamente uma notificação de boas-vindas com orientações iniciais de estudo.
  * Ao clicar no sino, você visualiza a lista de avisos, pode clicar em uma notificação para marcá-la como lida, clicar em **Marcar lidas** ou abrir a **Central de Notificações em Tela Cheia**.
* **Card "Continue de Onde Parou":** Mostra o progresso percentual da sua última atividade no Atlas 3D ou Quiz e oferece atalhos diretos para **Continuar Estudando no Atlas 3D** ou **Iniciar Quiz Rápido**.
* **Indicadores Gerais de Desempenho:**
  * **Quizzes Realizados:** Total de avaliações concluídas;
  * **Taxa Média de Acertos:** Média global de precisão (`%`) nas provas práticas;
  * **Sequência de Estudos:** Dias seguidos de atividade registrada;
  * **Ossos Estudados (`X/206`):** Cobertura proporcional das 206 estruturas ósseas do corpo humano a partir dos módulos estudados.
* **Desempenho Analítico por Região Anatômica:** Gráficos de progresso divididos nas 5 regiões principais (*Crânio*, *Coluna Vertebral*, *Caixa Torácica*, *Membros Superiores* e *Membros Inferiores*).
* **Recomendado para Você Revisar:** Lista automática dos ossos em que sua precisão no quiz ficou abaixo de 100%, ordenada dos pontos mais críticos para os mais fortes, com o botão **Revisar Agora**.

---

## 4. Exploração no Atlas 3D Interativo

### 4.1. Catálogo de Modelos 3D
1. No menu lateral esquerdo, clique em **Atlas 3D Interativo** (ou utilize os filtros rápidos de **Esqueleto Axial** e **Esqueleto Apendicular** na barra lateral).
2. Utilize os botões de filtro no topo para alternar entre *Todos*, *Crânio*, *Coluna Vertebral*, *Caixa Torácica*, *Membros Superiores* e *Membros Inferiores*, ou pesquise pelo nome comum ou científico (latim).
3. Clique em **Explorar Modelo 3D** no card do osso desejado.

### 4.2. Interação com o Modelo 3D e Acidentes Anatômicos
Dentro do visualizador 3D, você dispõe dos seguintes recursos:

| Ação / Controle | Como Executar |
| :--- | :--- |
| **Rotacionar em 360°** | Clique e arraste com o **botão esquerdo** do mouse (ou 1 dedo em telas touch). |
| **Aplicar Zoom (Aproximar/Afastar)** | Role o **scroll** do mouse ou clique nos botões **`+`** e **`-`** na barra inferior do canvas 3D. |
| **Mover Lateralmente (Pan)** | Clique e arraste com o **botão direito** do mouse (ou 2 dedos em telas touch). |
| **Resetar Posição da Câmera** | Clique no ícone de **seta circular (Resetar câmera)** na barra inferior. |
| **Ajustar Iluminação da Malha** | Clique no ícone de **Sol (Alternar iluminação)** na barra inferior. |
| **Modo Tela Cheia** | Clique no ícone de **Expandir (Tela cheia)** na barra inferior. |
| **Ouvir Pronúncia Científica** | No painel lateral direito, clique no ícone de **alto-falante** ao lado do nome do osso. |
| **Inspecionar Acidente Anatômico** | Clique sobre qualquer **pino esférico numerado** na superfície do osso 3D ou selecione o item na lista **Acidentes** à direita para ler sua descrição anatômica detalhada. |

---

## 5. Guia Clínico de Patologias Ósseas

1. Acesse **Guia de Patologias** no menu lateral esquerdo (ou clique na aba **Rel. Clínica** dentro do visualizador 3D de qualquer osso).
2. Filtre as condições clínicas por região anatômica ou utilize o campo de busca para localizar fraturas, lesões nervosas, desvios posturais ou doenças metabólicas.
3. Em cada card clínico, consulte a descrição detalhada da patologia e clique em **Ver Osso no Atlas 3D** para inspecionar imediatamente a estrutura óssea afetada em três dimensões.

---

## 6. Avaliação Prática: Quiz 3D ("Prova da Alfinetada")

1. No menu lateral esquerdo, clique em **Quiz 3D - Prova da Alfinetada**.
2. Escolha como deseja ser avaliado:
   * **Simulado Geral:** Sorteia questões de diferentes ossos e regiões anatômicas;
   * **Prova por Osso Específico:** Avalia exclusivamente os acidentes anatômicos da peça óssea escolhida.
3. Durante a prova, você encontrará dois formatos de questões:
   * **Identificação Espacial 3D (`Prova da Alfinetada`):** O enunciado solicita que você localize um acidente anatômico específico. Rotacione o modelo 3D, identifique o pino posicionado sobre a estrutura correta e clique nele para confirmar.
   * **Múltipla Escolha com Destaque 3D:** Um pino aparece destacado e piscando sobre uma região do osso 3D. Inspecione a peça em 360° e selecione qual das 4 alternativas (`A`, `B`, `C` ou `D`) corresponde ao acidente apontado.
4. A cada resposta confirmada, o sistema informa imediatamente se você acertou ou errou e destaca a resposta correta.
5. Ao finalizar todas as questões, o sistema consolida sua nota no banco de dados, atualiza sua sequência de estudos e exibe a tela de resultado final com sua precisão (`%`).

---

## 7. Configurações da Conta e Direitos do Titular (LGPD)

No canto inferior esquerdo da barra lateral, clique no **ícone de engrenagem (`Configurações da conta`)** ao lado do seu nome para acessar:

* **Exportar Dados (Art. 18 da LGPD):** Faz o download imediato de um arquivo `.json` estruturado contendo todos os seus dados cadastrais, métricas de estudo e histórico de acessos registrados.
* **Termos de Uso e Política de Privacidade:** Abre para leitura integral os documentos institucionais de uso e proteção de dados da plataforma.
* **Sair da Conta:** Encerra com segurança sua sessão atual e registra o logout na auditoria.
* **Excluir Minha Conta:** Abre a página dedicada de exclusão de conta. Caso deseje remover permanentemente seu cadastro e seu histórico de estudos, clique no botão vermelho **Excluir Minha Conta** (ou em **Cancelar** para retornar ao painel).

---

## 8. Módulo do Administrador (Gestão de Acervo, Questões, Avisos e Auditoria)

Usuários com perfil **Administrador (`ADMIN`)** visualizam a etiqueta `ADMIN` ao lado do nome e possuem ferramentas adicionais:

### 8.1. Calibração Direta de Pinos 3D no Visualizador
1. Abra qualquer osso no **Atlas 3D Interativo**.
2. Clique no botão superior direito **Calibrar Pinos 3D (Admin)**.
3. Selecione na lista lateral qual acidente anatômico (`#1`, `#2`, etc.) deseja ajustar e clique diretamente sobre o ponto exato na superfície do modelo 3D. As novas coordenadas `(X, Y, Z)` são salvas automaticamente no banco de dados.

### 8.2. Painel de Gestão Administrativa
Clique no ícone de engrenagem no canto inferior esquerdo e selecione **Gestão do Acervo e Auditoria (Admin)**:

1. **Aba "Modelos Anatômicos 3D":**
   * Cadastre novas peças ósseas ou edite modelos existentes informando nome, nome científico, região, divisão do esqueleto, resumo clínico, marcadores `(X, Y, Z)` e arquivo `.glb` (validado automaticamente contra arquivos corrompidos ou inválidos).
   * Ative, desative ou exclua modelos na tabela lateral.
2. **Aba "Cadastro de Questões":**
   * Crie novas questões vinculadas a um osso, escolhendo entre *Múltipla Escolha* ou *Identificação Espacial 3D*, ou preencha automaticamente as coordenadas a partir de um marcador 3D já mapeado.
   * Filtre questões por osso e utilize os botões **Editar**, **Desativar/Ativar** e **Excluir** para controlar quais questões entram nas provas dos alunos.
3. **Aba "Notificações e Avisos":**
   * Escreva comunicados, dicas de estudo ou avisos de manutenção para **Todos os Estudantes** ou para um **Estudante Específico (E-mail)**, com opção de enviar cópia automática por e-mail.
   * **Canal Externo de Contingência:** Caso o servidor principal esteja em manutenção, utilize o botão **Disparar E-mail Direto por Fora da API (HTTPS Relay)** ou copie o comando pronto do **PowerShell** exibido na tela para enviar comunicados diretamente aos alunos mesmo fora do sistema.
4. **Aba "Logs de Auditoria":**
   * Consulte em tempo real os eventos de segurança (logins, cadastros, validações 2FA, exportações LGPD e exclusões), com filtro por e-mail, endereço IP ou tipo de ação.
