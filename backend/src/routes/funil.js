const express = require('express');
const router = express.Router();
const connection = require('../config/database');

// GET - Obter dados do funil
router.get('/dados', (req, res) => {
  const { data_inicio, data_fim, campanha_id } = req.query;
  
  let query = `
    SELECT 
      e.id as etapa_id,
      e.nome as etapa_nome,
      e.posicao,
      COUNT(l.id) as total_leads,
      AVG(l.valor_proposta) as valor_medio_etapa
    FROM etapas_funil e
    LEFT JOIN leads l ON e.id = l.etapa_id
  `;
  
  const params = [];
  
  if (data_inicio && data_fim) {
    query += ' AND DATE(l.data_criacao) BETWEEN ? AND ?';
    params.push(data_inicio, data_fim);
  }
  
  if (campanha_id) {
    query += ' AND l.campanha_id = ?';
    params.push(campanha_id);
  }
  
  query += `
    GROUP BY e.id, e.nome, e.posicao
    ORDER BY e.posicao ASC
  `;
  
  connection.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar dados do funil' });
    }
    res.json(results);
  });
});

// GET - Taxa de conversão entre etapas
router.get('/taxa-conversao', (req, res) => {
  const query = `
    SELECT 
      e1.nome as etapa_origem,
      e2.nome as etapa_destino,
      COUNT(*) as total_movimentacoes,
      DATE_FORMAT(hm.data_movimentacao, '%m/%Y') as mes_ano
    FROM historico_movimentacao hm
    JOIN etapas_funil e1 ON hm.etapa_origem_id = e1.id
    JOIN etapas_funil e2 ON hm.etapa_destino_id = e2.id
    WHERE hm.data_movimentacao >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    GROUP BY e1.nome, e2.nome, DATE_FORMAT(hm.data_movimentacao, '%m/%Y')
    ORDER BY mes_ano DESC, e1.posicao ASC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar taxa de conversão' });
    }
    res.json(results);
  });
});

// GET - Tempo médio por etapa
router.get('/tempo-medio', (req, res) => {
  const query = `
    SELECT 
      e.nome as etapa_nome,
      AVG(TIMESTAMPDIFF(HOUR, hm.data_movimentacao, 
        (SELECT data_movimentacao 
         FROM historico_movimentacao hm2 
         WHERE hm2.lead_id = hm.lead_id 
         AND hm2.etapa_origem_id = hm.etapa_destino_id
         LIMIT 1)
      )) as tempo_medio_horas
    FROM historico_movimentacao hm
    JOIN etapas_funil e ON hm.etapa_origem_id = e.id
    GROUP BY e.nome, e.posicao
    ORDER BY e.posicao ASC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar tempo médio' });
    }
    res.json(results);
  });
});

module.exports = router;
