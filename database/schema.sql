CREATE DATABASE IF NOT EXISTS sistema_funil_vendas;
USE sistema_funil_vendas;

-- Tabela de etapas do funil
CREATE TABLE etapas_funil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    posicao INT NOT NULL UNIQUE,
    cor VARCHAR(7) DEFAULT '#007bff',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir etapas padrão do funil
INSERT INTO etapas_funil (nome, descricao, posicao, cor) VALUES
('Lead', 'Contato inicial captado', 1, '#28a745'),
('Qualificado', 'Lead com potencial identificado', 2, '#17a2b8'),
('Proposta', 'Proposta enviada ao cliente', 3, '#ffc107'),
('Negociacao', 'Em processo de negociacao', 4, '#fd7e14'),
('Cliente', 'Lead convertido em cliente', 5, '#dc3545');

-- Tabela de campanhas
CREATE TABLE campanhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    orcamento DECIMAL(15,2),
    plataforma ENUM('meta', 'google', 'linkedin', 'outros') DEFAULT 'meta',
    data_inicio DATE,
    data_fim DATE,
    publico_alvo TEXT,
    palavras_chave TEXT,
    total_leads INT DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de leads
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    origem VARCHAR(100),
    campanha_id INT,
    etapa_id INT,
    valor_proposta DECIMAL(15,2),
    observacoes TEXT,
    fonte_captacao VARCHAR(100),
    dados_meta JSON,
    data_contato DATETIME,
    data_ultima_movimentacao DATETIME,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE SET NULL,
    FOREIGN KEY (etapa_id) REFERENCES etapas_funil(id) ON DELETE SET NULL
);

-- Tabela de histórico de movimentação no funil
CREATE TABLE historico_movimentacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    etapa_origem_id INT,
    etapa_destino_id INT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (etapa_origem_id) REFERENCES etapas_funil(id),
    FOREIGN KEY (etapa_destino_id) REFERENCES etapas_funil(id)
);

-- Tabela para armazenar campanhas do Meta
CREATE TABLE campanhas_meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_meta VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    objetivo VARCHAR(100),
    status_efetivo VARCHAR(50),
    orcamento_diario DECIMAL(15,2),
    orcamento_total DECIMAL(15,2),
    data_inicio DATETIME,
    data_fim DATETIME,
    data_sincronizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de insights do Meta
CREATE TABLE insights_meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campanha_id_meta VARCHAR(100),
    data_insight DATE,
    impressoes INT,
    cliques INT,
    ctr DECIMAL(5,2),
    gasto DECIMAL(15,2),
    conversoes INT,
    taxa_conversao DECIMAL(5,2),
    data_sincronizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campanha_id_meta) REFERENCES campanhas_meta(id_meta)
);

-- Índices para melhor performance
CREATE INDEX idx_leads_etapa ON leads(etapa_id);
CREATE INDEX idx_leads_campanha ON leads(campanha_id);
CREATE INDEX idx_leads_data ON leads(data_criacao);
CREATE INDEX idx_historico_lead ON historico_movimentacao(lead_id);
CREATE INDEX idx_historico_data ON historico_movimentacao(data_movimentacao);
CREATE INDEX idx_campanhas_meta_id ON campanhas_meta(id_meta);
