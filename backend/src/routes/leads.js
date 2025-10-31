const express = require('express');
const router = express.Router();
const connection = require('../config/database');

// GET - Listar todos os leads
router.get('/', (req, res) => {
  const { etapa, campanha, data_inicio, data_fim } = req.query;
  
  let query = `
    SELECT l.*, 
           c.nome as campanha_nome,
           e.nome as etapa_nome,
           DATE_FORMAT(l.data_criacao, '%d/%m/%Y %H:%i') as data_criacao_formatada,
           DATE_FORMAT(l.data_contato, '%d/%m/%Y %H:%i') as data_contato_formatada
    FROM leads l
    LEFT JOIN campanhas c ON l.campanha_id = c.id
    LEFT JOIN etapas_funil e ON l.etapa_id = e.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (etapa) {
    query += ' AND l.etapa_id = ?';
    params.push(etapa);
  }
  
  if (campanha) {
    query += ' AND l.campanha_id = ?';
    params.push(campanha);
  }
  
  if (data_inicio && data_fim) {
    query += ' AND DATE(l.data_criacao) BETWEEN ? AND ?';
    params.push(data_inicio, data_fim);
  }
  
  query += ' ORDER BY l.data_criacao DESC';
  
  connection.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar leads' });
    }
    res.json(results);
  });
});

// POST - Criar novo lead
router.post('/', (req, res) => {
  const {
    nome,
    telefone,
    email,
    origem,
    campanha_id,
    observacoes,
    fonte_captacao
  } = req.body;
  
  // Buscar etapa inicial do funil
  const etapaQuery = 'SELECT id FROM etapas_funil WHERE posicao = 1';
  
  connection.query(etapaQuery, (err, etapaResults) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar etapa inicial' });
    }
    
    if (etapaResults.length === 0) {
      return res.status(400).json({ erro: 'Etapa inicial não configurada' });
    }
    
    const etapa_id = etapaResults[0].id;
    
    const insertQuery = `
      INSERT INTO leads (nome, telefone, email, origem, campanha_id, etapa_id, observacoes, fonte_captacao) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    connection.query(insertQuery, [
      nome, telefone, email, origem, campanha_id, etapa_id, observacoes, fonte_captacao
    ], (err, results) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao criar lead' });
      }
      
      // Atualizar contador da campanha
      if (campanha_id) {
        const updateCampanhaQuery = `
          UPDATE campanhas 
          SET total_leads = total_leads + 1 
          WHERE id = ?
        `;
        connection.query(updateCampanhaQuery, [campanha_id]);
      }
      
      res.status(201).json({ 
        id: results.insertId, 
        mensagem: 'Lead criado com sucesso' 
      });
    });
  });
});

// PUT - Atualizar lead
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    nome,
    telefone,
    email,
    observacoes,
    valor_proposta,
    data_contato
  } = req.body;
  
  const query = `
    UPDATE leads 
    SET nome = ?, telefone = ?, email = ?, observacoes = ?, valor_proposta = ?, data_contato = ?
    WHERE id = ?
  `;
  
  connection.query(query, [
    nome, telefone, email, observacoes, valor_proposta, data_contato, id
  ], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao atualizar lead' });
    }
    res.json({ mensagem: 'Lead atualizado com sucesso' });
  });
});

// PUT - Mover lead para próxima etapa
router.put('/:id/mover-etapa', (req, res) => {
  const { id } = req.params;
  const { proxima_etapa_id } = req.body;
  
  const query = `
    UPDATE leads 
    SET etapa_id = ?, data_ultima_movimentacao = NOW()
    WHERE id = ?
  `;
  
  connection.query(query, [proxima_etapa_id, id], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao mover lead' });
    }
    res.json({ mensagem: 'Lead movido para próxima etapa' });
  });
});

// GET - Estatísticas de leads
router.get('/estatisticas/geral', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_leads,
      COUNT(CASE WHEN etapa_id = (SELECT id FROM etapas_funil WHERE nome = 'Cliente') THEN 1 END) as total_clientes,
      COUNT(CASE WHEN DATE(data_criacao) = CURDATE() THEN 1 END) as leads_hoje,
      AVG(valor_proposta) as valor_medio_proposta,
      SUM(valor_proposta) as valor_total_propostas
    FROM leads
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
    }
    res.json(results[0]);
  });
});

module.exports = router;
