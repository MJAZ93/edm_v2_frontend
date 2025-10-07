-- Seed: Ações de Instalações
-- Nota: ajustar o nome da tabela/colunas se diferirem no seu esquema.
-- Tabela alvo sugerida: instalacao_accoes
-- Colunas: id, pf, data_execucao, accao_tipo_id, marcacao_status, analise_status, comentario, tendencia_compras, valor_recuperado, created_at, updated_at

BEGIN;

-- Função utilitária (opcional): se o seu SGBD não suportar, remova e use NOW() diretamente
-- CREATE OR REPLACE FUNCTION now_pt() RETURNS timestamp AS $$ SELECT NOW() $$ LANGUAGE SQL;

-- Para cada instalação, criamos 4 ações (>=3) e incluímos valor_recuperado em várias
-- Tipos: Reinspeção (673b8385-...), Troca de contador (9d20662b-...)

INSERT INTO instalacao_accoes (id, pf, data_execucao, accao_tipo_id, marcacao_status, analise_status, comentario, tendencia_compras, valor_recuperado, created_at, updated_at) VALUES

-- 200000033
('a1e3b3c9-3b9e-4d2f-9a2e-8f6b40c3a101','200000033',DATE '2025-08-06','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','MARCADO','EM_ANALISE','Criada a partir da inspeção 175b81f8-01f0-44cd-b902-05ed1dbcfb71','SEM_COMPRAS',NULL,NOW(),NOW()),
('a1e3b3c9-3b9e-4d2f-9a2e-8f6b40c3a102','200000033',DATE '2025-08-16','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca preventiva do contador','SEM_COMPRAS',2500.00,NOW(),NOW()),
('a1e3b3c9-3b9e-4d2f-9a2e-8f6b40c3a103','200000033',DATE '2025-08-26','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção de verificação','SEM_COMPRAS',1800.00,NOW(),NOW()),
('a1e3b3c9-3b9e-4d2f-9a2e-8f6b40c3a104','200000033',DATE '2025-09-05','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','ANALISADO','Fecho de análise mensal','SEM_COMPRAS',3200.00,NOW(),NOW()),

-- 200000041
('b2c4d5e6-7f80-4a12-9b34-5c6d7e8f9a01','200000041',DATE '2025-08-08','9d20662b-d44f-4f58-9f9a-1e9869027a1d','MARCADO','EM_ANALISE','Criada a partir da inspeção 1a8fdadc-400e-4837-bc91-5dd6f3889dd0','MUITO_DECRESCENTE',NULL,NOW(),NOW()),
('b2c4d5e6-7f80-4a12-9b34-5c6d7e8f9a02','200000041',DATE '2025-08-18','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção a ligações internas','MUITO_DECRESCENTE',14500.00,NOW(),NOW()),
('b2c4d5e6-7f80-4a12-9b34-5c6d7e8f9a03','200000041',DATE '2025-08-28','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador concluída','MUITO_DECRESCENTE',12750.00,NOW(),NOW()),
('b2c4d5e6-7f80-4a12-9b34-5c6d7e8f9a04','200000041',DATE '2025-09-07','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','ANALISADO','Análise final do período','MUITO_DECRESCENTE',16800.00,NOW(),NOW()),

-- 200000062
('c3d5e6f7-1829-4b23-8c45-6d7e8f9a0b01','200000062',DATE '2025-08-01','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','MARCADO','EM_ANALISE','Criada a partir da inspeção 6dd47788-d5de-45d9-8e57-85d41562b4e1','MUITO_DECRESCENTE',NULL,NOW(),NOW()),
('c3d5e6f7-1829-4b23-8c45-6d7e8f9a0b02','200000062',DATE '2025-08-11','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','MUITO_DECRESCENTE',9800.00,NOW(),NOW()),
('c3d5e6f7-1829-4b23-8c45-6d7e8f9a0b03','200000062',DATE '2025-08-21','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','MUITO_DECRESCENTE',11500.00,NOW(),NOW()),
('c3d5e6f7-1829-4b23-8c45-6d7e8f9a0b04','200000062',DATE '2025-08-31','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','ANALISADO','Fecho de análise','MUITO_DECRESCENTE',13400.00,NOW(),NOW()),

-- 200000101
('d4e6f718-293a-4c34-8d56-7e8f9a0b1c01','200000101',DATE '2025-08-01','9d20662b-d44f-4f58-9f9a-1e9869027a1d','MARCADO','EM_ANALISE','Criada a partir da inspeção e925f824-e691-4d49-af34-6645084bd4ad','MUITO_DECRESCENTE',NULL,NOW(),NOW()),
('d4e6f718-293a-4c34-8d56-7e8f9a0b1c02','200000101',DATE '2025-08-11','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','MUITO_DECRESCENTE',7200.00,NOW(),NOW()),
('d4e6f718-293a-4c34-8d56-7e8f9a0b1c03','200000101',DATE '2025-08-21','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','MUITO_DECRESCENTE',9400.00,NOW(),NOW()),
('d4e6f718-293a-4c34-8d56-7e8f9a0b1c04','200000101',DATE '2025-08-31','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','ANALISADO','Fecho de análise','MUITO_DECRESCENTE',10300.00,NOW(),NOW()),

-- 200000105
('e5f71829-3a4b-4d45-9e67-8f9a0b1c2d01','200000105',DATE '2025-08-08','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','MARCADO','EM_ANALISE','Criada a partir da inspeção 8052ac85-86f8-4431-beaa-d9d44b006de4','MUITO_CRESCENTE',NULL,NOW(),NOW()),
('e5f71829-3a4b-4d45-9e67-8f9a0b1c2d02','200000105',DATE '2025-08-18','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','MUITO_CRESCENTE',6200.00,NOW(),NOW()),
('e5f71829-3a4b-4d45-9e67-8f9a0b1c2d03','200000105',DATE '2025-08-28','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','MUITO_CRESCENTE',7100.00,NOW(),NOW()),
('e5f71829-3a4b-4d45-9e67-8f9a0b1c2d04','200000105',DATE '2025-09-07','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','ANALISADO','Fecho de análise','MUITO_CRESCENTE',8600.00,NOW(),NOW()),

-- 200000138
('f6a8293a-4b5c-4e56-8f78-9a0b1c2d3e01','200000138',DATE '2025-08-01','9d20662b-d44f-4f58-9f9a-1e9869027a1d','MARCADO','EM_ANALISE','Criada a partir da inspeção e31a6cd5-189e-4152-acad-8d6e9b4a28d3','SEM_COMPRAS',NULL,NOW(),NOW()),
('f6a8293a-4b5c-4e56-8f78-9a0b1c2d3e02','200000138',DATE '2025-08-11','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','SEM_COMPRAS',1500.00,NOW(),NOW()),
('f6a8293a-4b5c-4e56-8f78-9a0b1c2d3e03','200000138',DATE '2025-08-21','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','SEM_COMPRAS',2100.00,NOW(),NOW()),
('f6a8293a-4b5c-4e56-8f78-9a0b1c2d3e04','200000138',DATE '2025-08-31','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','ANALISADO','Fecho de análise','SEM_COMPRAS',2400.00,NOW(),NOW()),

-- 200000139
('07b93a4b-5c6d-4f67-9a89-0b1c2d3e4f01','200000139',DATE '2025-08-04','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','MARCADO','EM_ANALISE','Criada a partir da inspeção 9790ae6f-f3d9-474a-9e17-623c9a14cb30','MUITO_CRESCENTE',NULL,NOW(),NOW()),
('07b93a4b-5c6d-4f67-9a89-0b1c2d3e4f02','200000139',DATE '2025-08-14','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','MUITO_CRESCENTE',22500.00,NOW(),NOW()),
('07b93a4b-5c6d-4f67-9a89-0b1c2d3e4f03','200000139',DATE '2025-08-24','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','MUITO_CRESCENTE',19400.00,NOW(),NOW()),
('07b93a4b-5c6d-4f67-9a89-0b1c2d3e4f04','200000139',DATE '2025-09-03','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','ANALISADO','Fecho de análise','MUITO_CRESCENTE',26800.00,NOW(),NOW()),

-- 200000192
('18ca4b5c-6d7e-4078-8b9a-1c2d3e4f5001','200000192',DATE '2025-08-01','9d20662b-d44f-4f58-9f9a-1e9869027a1d','MARCADO','EM_ANALISE','Criada a partir da inspeção dd60de52-6dc1-45fc-b7a5-9c10a6a4613b','MUITO_DECRESCENTE',NULL,NOW(),NOW()),
('18ca4b5c-6d7e-4078-8b9a-1c2d3e4f5002','200000192',DATE '2025-08-11','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','MUITO_DECRESCENTE',6800.00,NOW(),NOW()),
('18ca4b5c-6d7e-4078-8b9a-1c2d3e4f5003','200000192',DATE '2025-08-21','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','MUITO_DECRESCENTE',8200.00,NOW(),NOW()),
('18ca4b5c-6d7e-4078-8b9a-1c2d3e4f5004','200000192',DATE '2025-08-31','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','ANALISADO','Fecho de análise','MUITO_DECRESCENTE',9100.00,NOW(),NOW()),

-- 200000212
('29db5c6d-7e8f-4189-9cab-2d3e4f506101','200000212',DATE '2025-08-08','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','MARCADO','EM_ANALISE','Criada a partir da inspeção ea3caa7c-63f8-46b9-bd7d-a840527e1a8e','SEM_COMPRAS',NULL,NOW(),NOW()),
('29db5c6d-7e8f-4189-9cab-2d3e4f506102','200000212',DATE '2025-08-18','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','SEM_COMPRAS',1900.00,NOW(),NOW()),
('29db5c6d-7e8f-4189-9cab-2d3e4f506103','200000212',DATE '2025-08-28','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','SEM_COMPRAS',1400.00,NOW(),NOW()),
('29db5c6d-7e8f-4189-9cab-2d3e4f506104','200000212',DATE '2025-09-07','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','ANALISADO','Fecho de análise','SEM_COMPRAS',2100.00,NOW(),NOW()),

-- 200000273
('3aec6d7e-8f90-429a-8dbc-3e4f50617201','200000273',DATE '2025-08-08','9d20662b-d44f-4f58-9f9a-1e9869027a1d','MARCADO','EM_ANALISE','Criada a partir da inspeção b63c05d6-8cf5-43cc-811a-4d0cb421d145','NORMAL',NULL,NOW(),NOW()),
('3aec6d7e-8f90-429a-8dbc-3e4f50617202','200000273',DATE '2025-08-18','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','EM_ANALISE','Reinspeção','NORMAL',23500.00,NOW(),NOW()),
('3aec6d7e-8f90-429a-8dbc-3e4f50617203','200000273',DATE '2025-08-28','9d20662b-d44f-4f58-9f9a-1e9869027a1d','EXECUTADO','EM_ANALISE','Troca de contador','NORMAL',27600.00,NOW(),NOW()),
('3aec6d7e-8f90-429a-8dbc-3e4f50617204','200000273',DATE '2025-09-07','673b8385-bdcc-41b6-9bdd-70fe4eb3a12f','EXECUTADO','ANALISADO','Fecho de análise','NORMAL',31200.00,NOW(),NOW());

COMMIT;
