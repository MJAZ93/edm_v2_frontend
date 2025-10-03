# Sistema de Gestão de Vandalizações — EDM
**Documento de Requisitos Funcionais e Modelo de Dados (Backend)**  
Versão: 1.0 • Data: 30/09/2025 • Linguagem: pt‑PT

---

## 1. Visão Geral
Este documento descreve os requisitos funcionais de alto nível, entidades de dados e especificações de APIs para um backend que suporta a gestão de vandalizações na rede da EDM. O objetivo é centralizar registos de ocorrências, infrações, infractores, sucatas (scrapyards), materiais e entidades territoriais (Regiões/ASC/PT), bem como produzir métricas e dashboards de apoio à decisão.

> **Nota:** O foco é descritivo (funcional e de dados). A implementação técnica (stack, deployment, etc.) não é detalhada neste documento.

Base de dados postgres.

---

## 2. Objetivos
- Padronizar o registo de ocorrências de vandalização e os elementos envolvidos (materiais, locais, infractores).
- Manter catálogo de sucatas e caracterização de risco (níveis de confiança por correlação com ocorrências próximas).
- Suportar perfis de utilizador e permissões finas por URL/funcionalidade.
- Oferecer APIs consistentes com paginação, filtros e ordenação.
- Disponibilizar dashboards e métricas de suporte operacional.
- Incluir mecanismo de envio de resumos por e‑mail aos utilizadores.
- Prover módulos de análise: zonas perigosas e sucatas perigosas (sinais de risco).

---

## 3. Escopo
- Gestão de utilizadores, permissões e autenticação/autorização.
- Registo de ocorrências e suas infrações, com suporte geoespacial (lat/long e ponto geográfico).
- Catálogo de sucatas (scrapyards) e materiais.
- Domínios de referência: Região, ASC, PT (posto de transformação).
- Dashboards e métricas derivadas (sem novas tabelas).
- Envio de resumos por e‑mail (diários/semanais) configuráveis por utilizador.
- Módulos de análise de risco (AI/light analytics).

---

## 4. Modelo de Dados (Entidades)

### 4.1 Utilizador
| Campo      | Tipo / Domínio | Regras / Observações |
|------------|-----------------|----------------------|
| ID         | UUID/ID         | Chave primária. |
| Name       | string(128)     | Obrigatório. |
| Username   | string(128)     | Obrigatório e único. |
| Password   | string(100)     | Hash seguro; política de senha/rotação conforme normas EDM. |
| Email      | string(100)     | Formato válido; único opcional. |
| Type       | enum            | SUPER_ADMIN, PAIS, REGIAO, ASC, PT. |
| TypeId     | string/ID       | Ligação ao objeto do tipo (RegiaoID/AscID/PTID). |
| Permissões | m2m             | Tabela intermédia `user_permissions`, ligada a `Permissao.URL`. |

### 4.2 Permissão
| Campo      | Tipo / Domínio | Regras / Observações |
|------------|-----------------|----------------------|
| ID         | UUID/ID         | Chave primária. |
| Name       | string(128)     | Obrigatório e único. |
| Description| string(255)     | Opcional. |
| URL        | string(255)     | Rota/ação controlada por autorização; única por permissão. |

### 4.3 Scrapyard (Sucata)
| Campo          | Tipo / Domínio      | Regras / Observações |
|----------------|----------------------|----------------------|
| ID             | UUID/ID              | Chave primária. |
| AscID          | ID                   | ASC a que a sucata está associada. |
| Nome           | string               | Obrigatório. |
| Lat / Long     | float64              | Coordenadas WGS84. |
| GeoPoint       | geography(Point)     | Índice geoespacial para queries por proximidade. |
| Materiais      | 1:N Material         | Materiais transacionados pela sucata. |
| NivelConfianca | float \[0..1]        | Score derivado de correlação com ocorrências próximas. |

### 4.4 Material
| Campo            | Tipo / Domínio | Regras / Observações |
|------------------|----------------|----------------------|
| ID               | UUID/ID        | Chave primária. |
| ScrapyardID      | ID             | Origem (sucata). |
| Name             | string         | Obrigatório; indexado. |
| Unidade          | string         | Ex.: kg, unid., m. |
| SectorInfracaoID | ID             | Setor ligado ao material (energia, telecom, etc.). |

### 4.5 SectorInfracao
| Campo | Tipo / Domínio | Regras / Observações |
|------|------------------|----------------------|
| ID   | UUID/ID          | Chave primária. |
| Name | string           | Obrigatório; indexado. |

### 4.6 TipoInfracao
| Campo | Tipo / Domínio | Regras / Observações |
|------|------------------|----------------------|
| ID   | UUID/ID          | Chave primária. |
| Name | string           | Obrigatório; indexado. |

### 4.7 Regiao
| Campo | Tipo / Domínio | Regras / Observações |
|------|------------------|----------------------|
| ID   | UUID/ID          | Chave primária. |
| Name | string           | Obrigatório; indexado. |

### 4.8 ASC
| Campo   | Tipo / Domínio | Regras / Observações |
|---------|------------------|----------------------|
| ID      | UUID/ID          | Chave primária. |
| Name    | string           | Obrigatório; indexado. |
| RegiaoID| ID               | Relação com região. |

### 4.9 Ocorrência (Occurrence)
| Campo                            | Tipo / Domínio     | Regras / Observações |
|----------------------------------|--------------------|----------------------|
| ID                               | UUID/ID            | Chave primária. |
| DataFacto                        | datetime           | Data/hora do facto. |
| AppUserId                        | string/ID          | Utilizador app que registou; indexado. |
| RegiaoId                         | ID                 | Referência a região. |
| AscId                            | ID                 | Referência a ASC. |
| Distrito                         | string             | Opcional. |
| Local                            | string             | Endereço/descrição do local. |
| Descricao                        | string             | Texto livre. |
| Auto                             | string             | Número do auto. |
| AutoImage                        | string             | Nome do ficheiro; repositório de uploads. |
| FormaConhecimentoID| ID             | Obrigatório; FK -> FormaConhecimento. |
| CaracteristicaLocalVandalizacao  | string             | Ex.: zona isolada, iluminação deficiente. |
| Lat / Long / Precision           | float              | Coordenadas e precisão do GPS. |
| LaterUpdate                      | bool               | Indica se haverá atualização posterior. |
| NrDetidos                        | int8               | Número de detidos. |
| ProcessoCriminalAberto           | bool               | Flag de processo. |
| Infractions                      | 1:N                | Cascata on update/delete. |

### 4.10 Infraction
| Campo            | Tipo / Domínio | Regras / Observações |
|------------------|----------------|----------------------|
| ID               | UUID/ID        | Chave primária. |
| OccurrenceID     | ID             | Obrigatório; indexado. |
| TipoInfracaoID   | ID             | Obrigatório. |
| SectorInfracaoID | ID             | Obrigatório. |
| TipoMaterial     | string         | Descrição/enum do material. |
| Quantidade       | float          | Quantidade na unidade do material. |
| Valor            | float          | Valor estimado (MT). |
| Fotografias      | string[]       | Lista de nomes de ficheiro. |
| Lat / Long       | float          | Coordenadas. |
| GeoPoint         | geography(Point)| Índice geoespacial. |

### 4.11 Infractor
| Campo             | Tipo / Domínio | Regras / Observações |
|-------------------|----------------|----------------------|
| ID                | UUID/ID        | Chave primária. |
| InfractionID      | ID             | Obrigatório; indexado. |
| TipoIdentificacao | string         | BI, Carta, Passaporte, etc. |
| NrIdentificacao   | string         | Número do documento. |
| Nome              | string         | Nome do infractor. |

### 4.12 Ações (Accoes)
| Campo              | Tipo / Domínio | Regras / Observações |
|--------------------|----------------|----------------------|
| ID                 | UUID/ID        | Chave primária. |
| AscID              | ID             | ASC responsável. |
| MateriasAfectados  | Material[]     | Materiais alvo da ação. |
| PercentagemReducao | float          | Objetivo de redução de ocorrências (%). |
| Objectivos         | AccoesObjectivo[] | Metas e marcos por data. |

### 4.13 AccoesObjectivo
| Campo             | Tipo / Domínio | Regras / Observações |
|-------------------|----------------|----------------------|
| ID                | UUID/ID        | Chave primária. |
| DataImplementacao | date           | Data alvo. |
| Melhoria          | string/float   | Meta qualitativa/quantitativa. |

---

## 4.14 FormaConhecimento
Tabela de configuração para padronizar os canais/meios através dos quais a EDM toma conhecimento de uma ocorrência.

| Campo        | Tipo / Domínio | Regras / Observações |
|--------------|----------------|----------------------|
| ID           | UUID/ID        | Chave primária. |
| Name         | string(128)    | Obrigatório; ex.: "Denúncia", "Ronda", "Inspeção". |
| Description  | string(255)    | Opcional; descrição detalhada. |
| Ativo        | bool           | Permite ativar/desativar opções sem apagar histórico. |


---

## 5. Regras de Negócio e Processos
- Ao criar uma **Ocorrência**, recalcular o **NivelConfianca** de sucatas num raio de **10 km** para os **materiais** presentes nas **Infrações** associadas.
- Eliminação em **cascata**: apagar uma Ocorrência remove as Infrações e respetivos Infractores.
- Permissões por **URL/ação**; utilizador herda **escopo** (PAÍS, REGIÃO, ASC, PT) via `Type`/`TypeId`.
- **Listagens** respeitam o escopo do utilizador (ex.: utilizador ASC vê apenas dados da sua ASC).
- Uploads de fotos armazenados em **estrutura** de pastas por **ano/mês** e referenciados pelo **nome do ficheiro**.
- `GeoPoint` obrigatório quando `Lat/Long` informados; validação **WGS84**.

---

## 6. APIs (Descrição Funcional)
**Todas as listagens incluem paginação, pelo menos 5 filtros e 2 parâmetros de ordenação (`order_by`, `order_direction`).**

### 6.1 Convenções de Listagem
- **Paginação:** `page` (>=1), `page_size` (<=100, default 20).
- **Ordenação:** `order_by` = campo válido; `order_direction` = `asc` \| `desc`.
- **Formato de datas:** ISO‑8601 (UTC recomendado).
- **Resposta comum:** `{ items: [], page, page_size, total }`.

### 6.2 Endpoints CRUD (resumo)
- **Utilizador:** CRUD + gestão de permissões (m2m).
- **Permissão:** CRUD.
- **Scrapyard:** CRUD.
- **Material:** CRUD.
- **SectorInfracao:** CRUD.
- **TipoInfracao:** CRUD.
- **Regiao:** CRUD + Métricas.
- **ASC:** CRUD + Métricas.
- **Ocorrência:** CRUD + pós‑processamento (recalcular sucatas num raio de 10 km por material).
- **Infraction:** CRUD + Métricas.
- **Infractor:** CRUD + Métricas.
- **Accoes:** CRUD.

### 6.3 Filtros Recomendados por Recurso (exemplos)

**Ocorrências — Filtros**
- `data_inicio`, `data_fim` (date) — intervalo de ocorrência
- `regiao_id` (ID) — por região
- `asc_id` (ID) — por ASC
- `tipo_infracao_id` (ID) — por tipo
- `material` (string/ID) — por material (nome/ID)
- `texto` (string) — full‑text em descrição/local/auto

**Scrapyards — Filtros**
- `asc_id` (ID) — ASC da sucata
- `nome` (string) — busca textual
- `material_id` (ID) — sucatas que transacionam o material
- `nivel_confianca_min` (float) — score mínimo
- `raio_km`, `lat`, `long` (float) — busca por proximidade (raio)

**Infrações — Filtros**
- `tipo_infracao_id` (ID) — por tipo
- `sector_infracao_id` (ID) — por sector
- `valor_min`, `valor_max` (float) — faixa de valor
- `quantidade_min` (float) — quantidade mínima
- `data_inicio`, `data_fim` (date) — data da ocorrência associada

---

## 7. Dashboards e Métricas (sem novas tabelas)
**Entrada:** `Regiao`, `ASC`, `Data_Inicio`, `Data_Fim` • **Saída:** valores agregados calculados on‑the‑fly
- **ASC com mais infrações** (top N no período).
- **ASC com mais scrapyards** (top N).
- **Materiais mais visados** por valor e por quantidade.
- **Zonas com maior densidade de ocorrências** (hotspots).
- **Correlação sucatas ↔ ocorrências** no raio (indicadores de risco).
- **Taxa de reincidência** por ASC e por tipo de infração.
- **Evolução temporal** (semana/mês) de ocorrências e valor estimado.
- **Tempo médio** entre ocorrência e criação de ação (**Accoes**).
- *(Acrescente outros conforme necessidade operacional.)*

---

## 8. Análises e AI (Zonas e Scrapyards Perigosos)
- Cálculo de **NivelConfianca** da sucata: função dos **materiais** das infrações nas proximidades (**10 km** ajustável), **frequência** e **recência** dos eventos, e **valor** associado.
- **Zonas perigosas**: clusters geoespaciais (ex.: **DBSCAN**) de ocorrências por tipo/material, ponderadas por valor e recência.
- **Alertas simples (regra)**: quando o score de uma sucata/área ultrapassa limiar definido, notificar perfis relevantes.
- **Explicabilidade**: indicadores que compõem o score (nº de ocorrências próximas, materiais coincidentes, última ocorrência, etc.).

---

## 9. Segurança e Autorização
- Autenticação por token (ex.: **JWT**) e gestão segura de passwords (hash, sal).
- Autorização por **permissões** ligadas a URLs/rotas.
- **Escopos hierárquicos** por `Type`/`TypeId` (PAIS, REGIAO, ASC, PT).
- Registo de **auditoria** para operações críticas (criação, atualização, eliminação).
- Política de **retenção e privacidade** de dados (inclui dados pessoais de infractores).

---

## 10. Resumos por E‑mail
- **Configuração por Utilizador**: periodicidade (diário/semanal), escopo (PAIS/REGIAO/ASC/PT), tópicos (novas ocorrências, top materiais, hotspots, sucatas em alta).
- **Template** com indicadores principais e links para a aplicação.
- **Histórico de envios** e opção de cancelamento (**opt‑out**).

---

## 11. Requisitos Não Funcionais
- Disponibilidade e performance alinhadas ao horário operacional da EDM.
- Paginação **obrigatória** em todas as listagens para eficiência.
- **Indexação** por campos críticos (datas, IDs relacionais, geoespacial).
- Internacionalização mínima (**pt‑PT**) e consistência terminológica.
- **Backup e recuperação**; controlo de versões do esquema.

---

## 12. Convenções de Erros e Respostas
- Formato de erro: `{ code, message, details }`.
- Validações com mensagens claras (ex.: campos obrigatórios, domínios enum).
- **Rate limiting** e resposta padrão para abuso (**HTTP 429**).

---

## 13. Anexos — Enumerações e Domínios

### 13.1 User.Type (escopo)
| Valor        | Observação    |
|--------------|---------------|
| SUPER_ADMIN  | Acesso global |
| PAIS         | Escopo país   |
| REGIAO       | Escopo região |
| ASC          | Escopo ASC    |
| PT           | Escopo PT     |

### 13.2 Exemplos de “FormaConhecimento”
| Valor      | Observação             |
|------------|------------------------|
| Denúncia   | Terceiros reportam     |
| Ronda      | Equipa em patrulha     |
| Inspeção   | Atividade programada   |
| Outra      | Especificar            |

---

## 14. Autenticação e Gestão de Sessões

### 14.1 Login
- **Endpoint:** `POST /auth/login`
- **Entrada:** `{ username/email, password }`
- **Saída:** `{ access_token (JWT), refresh_token, expires_in }`
- **Validações:**
    - Verificação de hash da password.
    - Bloqueio após X tentativas falhadas (ex.: 5).
    - Registo de logs de segurança (IP, dispositivo).

### 14.2 Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Entrada:** `{ refresh_token }`
- **Saída:** `{ access_token (novo), refresh_token (opcional), expires_in }`
- **Notas:**
    - Tokens de refresh com validade mais longa (ex.: 7 dias).
    - Devem poder ser revogados no logout.
    - Tabela `user_tokens`: user_id, token, created_at, revoked.

### 14.3 Reset Password (via E-mail)
- **Endpoint 1:** `POST /auth/request-reset`
    - **Entrada:** `{ email }`
    - **Ação:** envia e-mail com link/OTP válido 15 minutos.
- **Endpoint 2:** `POST /auth/reset`
    - **Entrada:** `{ token, new_password }`
    - **Validações:** password forte, expiração do token.
- **Tabela extra:** `password_resets`: user_id, token, expires_at, used.

### 14.4 Logout
- **Endpoint:** `POST /auth/logout`
- **Entrada:** `{ refresh_token }`
- **Ação:** invalida refresh token.

### 14.5 Gestão de Sessões
- Suporte a múltiplas sessões (multi-device).
- Possibilidade de administrador revogar sessões ativas de utilizadores suspeitos.





---

### 6.4 Novos Endpoints — FormaConhecimento
- **FormaConhecimento:** CRUD completo (criar, listar, atualizar, eliminar).
    - Usado para configurar dinamicamente as opções de "Forma de Conhecimento".
    - Apenas administradores podem criar/alterar.

**Filtros suportados (listagem):**
- `name` (string) — busca textual
- `ativo` (bool) — filtrar por estado ativo/inativo

### 6.5 Atualização — Ocorrências (Filtros)
Adicionar filtro por `forma_conhecimento_id` para permitir consultas de ocorrências por forma de conhecimento.

**Ocorrências — Filtros (atualizados)**
- `data_inicio`, `data_fim` (date) — intervalo de ocorrência
- `regiao_id` (ID) — por região
- `asc_id` (ID) — por ASC
- `tipo_infracao_id` (ID) — por tipo
- `material` (string/ID) — por material (nome/ID)
- `forma_conhecimento_id` (ID) — por forma de conhecimento
- `texto` (string) — full-text em descrição/local/auto



### 4.9 Ocorrência (Occurrence) — Atualizado
| Campo                            | Tipo / Domínio     | Regras / Observações |
|----------------------------------|--------------------|----------------------|
| ID                               | UUID/ID            | Chave primária. |
| DataFacto                        | datetime           | Data/hora do facto. |
| AppUserId                        | string/ID          | Utilizador app que registou; indexado. |
| RegiaoId                         | ID                 | Referência a região. |
| AscId                            | ID                 | Referência a ASC. |
| Distrito                         | string             | Opcional. |
| Local                            | string             | Endereço/descrição do local. |
| Descricao                        | string             | Texto livre. |
| Auto                             | string             | Número do auto. |
| AutoImage                        | string             | Nome do ficheiro; repositório de uploads. |
| FormaConhecimentoID              | ID                 | FK -> FormaConhecimento (obrigatório). |
| CaracteristicaLocalVandalizacao  | string             | Ex.: zona isolada, iluminação deficiente. |
| Lat / Long / Precision           | float              | Coordenadas e precisão do GPS. |
| LaterUpdate                      | bool               | Indica se haverá atualização posterior. |
| NrDetidos                        | int8               | Número de detidos. |
| ProcessoCriminalAberto           | bool               | Flag de processo. |
| Infractions                      | 1:N                | Cascata on update/delete. |

### 4.14 FormaConhecimento (Novo)
Tabela de configuração para padronizar os canais/meios através dos quais a EDM toma conhecimento de uma ocorrência.

| Campo        | Tipo / Domínio | Regras / Observações |
|--------------|----------------|----------------------|
| ID           | UUID/ID        | Chave primária. |
| Name         | string(128)    | Obrigatório; ex.: "Denúncia", "Ronda", "Inspeção". |
| Description  | string(255)    | Opcional; descrição detalhada. |
| Ativo        | bool           | Permite ativar/desativar opções sem apagar histórico. |
