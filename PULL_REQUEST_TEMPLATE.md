## 1. Identificação
- **Aluno(s):** Matheus Henrique da Silva Oliveira - [Inserir RA]
- **Projeto (PFC):** OsteoLearn (Plataforma Educacional 3D de Osteologia Humana)
- **Branch:** feat/testes-automatizados

## 2. Resumo da entrega
Implementação da suíte de testes automatizados (unitários e de integração) cobrindo o núcleo de autenticação, segurança em dois fatores (2FA) e conformidade LGPD do OsteoLearn. Foram testadas regras de validação de senhas fortes, geração e expiração de hashes OTP SHA-256, isolamento de chamadas SMTP com mocks e fluxos completos de API REST com persistência em banco descartável.

## 3. Cenários de testes unitários implementados
| # | Classe testada | Método / regra | Cenário | Tipo | Arquivo de teste | Método de teste |
|---|----------------|----------------|---------|------|------------------|-----------------|
| 1 | PasswordValidator | validate_password_strength | Senha forte com todos os requisitos | Feliz | test_unit_password.py | test_deve_aceitar_senha_forte_com_todos_os_requisitos |
| 2 | PasswordValidator | validate_password_strength | Senha sem caractere especial | Violação | test_unit_password.py | test_deve_lancar_excecao_quando_senha_nao_conter_caractere_especial |
| 3 | PasswordValidator | validate_password_strength | Senha sem letras | Violação | test_unit_password.py | test_deve_lancar_excecao_quando_senha_nao_conter_letras |
| 4 | RegisterSerializer | validate_lgpd_consent | Aceite LGPD obrigatório desmarcado | Violação | test_unit_password.py | test_deve_lancar_excecao_quando_consentimento_lgpd_nao_for_marcado |
| 5 | PasswordValidator | validate_password_strength | Fronteira mínima de tamanho (7 vs 8 vs 9 caracteres) | Limite | test_unit_password.py | test_deve_validar_fronteira_de_tamanho_minimo_de_senha |
| 6 | TwoFactorCode | is_valid() | Código correto dentro da janela de 5 min | Feliz | test_unit_two_factor.py | test_deve_validar_codigo_correto_dentro_do_tempo_de_expiracao |
| 7 | TwoFactorCode | is_valid() | Código incorreto digitado | Violação | test_unit_two_factor.py | test_deve_rejeitar_codigo_quando_invalido |
| 8 | TwoFactorCode | is_valid() | Código já utilizado anteriormente (is_used=True) | Violação | test_unit_two_factor.py | test_deve_rejeitar_codigo_quando_ja_tiver_sido_utilizado |
| 9 | TwoFactorCode | is_valid() | Código expirado após janela de 5 min | Limite | test_unit_two_factor.py | test_deve_rejeitar_codigo_expirado_por_tempo_limite |
| 10 | EmailService | send_2fa_email() | Despacho de e-mail com parâmetros e destinatário válidos | Feliz | test_unit_services.py | test_deve_chamar_send_mail_com_parametros_corretos_ao_enviar_codigo_2fa |
| 11 | LoginView | post() | Tentativa de login incorreta não despacha e-mail | Violação | test_unit_services.py | test_nao_deve_disparar_email_quando_login_falhar |
| 12 | EmailService | send_2fa_email() | Tratamento de usuário com nome não preenchido | Limite | test_unit_services.py | test_deve_usar_saudacao_padrao_quando_usuario_nao_possuir_nome |

Tipo: Feliz | Violação | Limite
**Total de cenários unitários:** 12

## 4. Cenários de testes de integração implementados
| # | Camadas envolvidas | Cenário | Arquivo de teste | Método de teste | Recurso usado |
|---|--------------------|---------|------------------|-----------------|---------------|
| 1 | Controller+BD | POST /api/auth/register/ retorna 201 com requires_2fa | test_integration_auth.py | test_deve_retornar_201_e_payload_ao_cadastrar_novo_usuario_com_sucesso | APITestClient+SQLite |
| 2 | Controller+BD | POST /api/auth/login/ com senha errada retorna 401 e erro | test_integration_auth.py | test_deve_retornar_401_e_corpo_de_erro_quando_credenciais_forem_invalidas | APITestClient+SQLite |
| 3 | Model+BD | Persistência e busca de usuário com trilha de AuditLog | test_integration_auth.py | test_deve_persistir_e_recuperar_usuario_com_trilha_de_auditoria_no_banco | ORM+SQLite |
| 4 | Controller+Service+BD | Fluxo completo: Login -> Geração 2FA -> Verificação 2FA -> Emissão JWT -> Auditoria | test_integration_auth.py | test_fluxo_completo_cruzando_api_service_e_banco_login_e_confirmacao_2fa | APITestClient+MockEmail+SQLite |

**Total de cenários de integração:** 4

## 5. Arquivos de teste criados ou alterados
| Arquivo (caminho completo) | Criado / Alterado | Qtd. de testes |
|----------------------------|-------------------|----------------|
| backend/accounts/tests/test_unit_password.py | Criado | 5 |
| backend/accounts/tests/test_unit_two_factor.py | Criado | 4 |
| backend/accounts/tests/test_unit_services.py | Criado | 3 |
| backend/accounts/tests/test_integration_auth.py | Criado | 4 |

**Total de arquivos de teste:** 4 | **Total de testes:** 16

## 6. Como executar os testes
```
python backend/manage.py test accounts
```

## 7. Evidências
- **Resultado da execução:**
```
Creating test database for alias 'default'...
................
----------------------------------------------------------------------
Ran 16 tests in 1.790s

OK
Destroying test database for alias 'default'...
Found 16 test(s).
System check identified no issues (0 silenced).
```
- **Link do CI (se houver):** não se aplica

## 8. Decisões e dificuldades
- **O que foi mockado e por quê:** O serviço transacional de e-mails (`django.core.mail.send_mail` e `send_2fa_email`) foi mockado para garantir que os testes unitários e de integração fossem rápidos, determinísticos e não dependessem de conexão com os servidores SMTP externos do Google.
- **Bugs encontrados pelos testes (se houver):** No teste unitário de simulação de login, identificou-se a necessidade de invocar a view via `LoginView.as_view()` para que o Django REST Framework fizesse o parse correto do `request.data`.
- **Dificuldades:** Nenhuma. A configuração de um banco de dados em memória SQLite (`:memory:`) descartável durante os testes garantiu isolamento completo e execução em menos de 2 segundos.

## 9. Checklist de entrega
- [x] Todos os testes passam localmente com o comando da seção 6
- [x] Cada cenário listado nas seções 3 e 4 existe no código
- [x] Cada arquivo de teste alterado ou criado está listado na seção 5
- [x] Mínimos do exercício atendidos (10 unitários em 3 classes; 4 de integração)
- [x] Nenhum teste com @Disabled, sem asserção ou com Thread.sleep
- [x] Professor adicionado como reviewer
