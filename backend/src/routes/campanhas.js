const express = require('express');
const router = express.Router();
const connection = require('../config/database');

// GET - Listar todas as campanhas
router.get('/', (req, res) => {
  const query = `
    SELECT c.*,
           COUNT(l.id) as total_leads,
           COUNT(CASE WHEN l.etapa_id = (SELECT id FROM etapas_funil WHERE nome = 'Cliente') THEN 1 END) as total_conversoes,
           COALESCE(SUM(l.valor_proposta), 0) as valor_total_gerado
    FROM campanhas c
    LEFT JOIN leads l ON c.id = l.campanha_id
    GROUP BY c.id
    ORDER BY c.data_criacao DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar campanhas' });
    }
    res.json(results);
  });
});

// POST - Criar nova campanha
router.post('/', (req, res) => {
  const {
    nome,
    descricao,
    orcamento,
    plataforma,
    data_inicio,
    data_fim,
    publico_alvo,
    palavras_chave
  } = req.body;
  
  const query = `
    INSERT INTO campanhas (nome, descricao, orcamento, plataforma, data_inicio, data_fim, publico_alvo, palavras_chave) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [
    nome, descricao, orcamento, plataforma, data_inicio, data_fim, publico_alvo, palavras_chave
  ], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao criar campanha' });
    }
    res.status(201).json({ 
      id: results.insertId, 
      mensagem: 'Campanha criada com sucesso' 
    });
  });
});

// GET - ROI das campanhas
router.get('/roi', (req, res) => {
  const query = `
    SELECT 
      c.nome,
      c.orcamento,
      COUNT(l.id) as total_leads,
      COUNT(CASE WHEN l.etapa_id = (SELECT id FROM etapas_funil WHERE nome = 'Cliente') THEN 1 END) as clientes_fechados,
      COALESCE(SUM(l.valor_proposta), 0) as receita_gerada,
      CASE 
        WHEN c.orcamento > 0 THEN (COALESCE(SUM(l.valor_proposta), 0) - c.orcamento) / c.orcamento * 100
        ELSE 0 
      END as roi_percentual,
      COALESCE(SUM(l.valor_proposta), 0) - c.orcamento as lucro_prejuizo
    FROM campanhas c
    LEFT JOIN leads l ON c.id = l.campanha_id
    GROUP BY c.id, c.nome, c.orcamento
    ORDER BY roi_percentual DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao calcular ROI' });
    }
    res.json(results);
  });
});

module.exports = router;
