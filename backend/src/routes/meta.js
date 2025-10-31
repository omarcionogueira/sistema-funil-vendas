const express = require('express');
const router = express.Router();
const axios = require('axios');
const connection = require('../config/database');

// POST - Sincronizar campanhas do Meta
router.post('/sincronizar-campanhas', async (req, res) => {
  const { access_token, account_id } = req.body;
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${account_id}/campaigns`,
      {
        params: {
          access_token: access_token,
          fields: 'id,name,status,objective,effective_status,daily_budget,lifetime_budget,start_time,stop_time'
        }
      }
    );
    
    const campanhas = response.data.data;
    
    // Salvar campanhas no banco
    const insertQuery = `
      INSERT INTO campanhas_meta (id_meta, nome, status, objetivo, status_efetivo, orcamento_diario, orcamento_total, data_inicio, data_fim)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nome = VALUES(nome),
        status = VALUES(status),
        objetivo = VALUES(objetivo),
        status_efetivo = VALUES(status_efetivo),
        orcamento_diario = VALUES(orcamento_diario),
        orcamento_total = VALUES(orcamento_total),
        data_inicio = VALUES(data_inicio),
        data_fim = VALUES(data_fim)
    `;
    
    for (const campanha of campanhas) {
      await connection.promise().execute(insertQuery, [
        campanha.id,
        campanha.name,
        campanha.status,
        campanha.objective,
        campanha.effective_status,
        campanha.daily_budget,
        campanha.lifetime_budget,
        campanha.start_time,
        campanha.stop_time
      ]);
    }
    
    res.json({ 
      mensagem: `${campanhas.length} campanhas sincronizadas com sucesso`,
      campanhas: campanhas 
    });
    
  } catch (error) {
    console.error('Erro ao sincronizar campanhas:', error.response?.data || error.message);
    res.status(500).json({ 
      erro: 'Erro ao sincronizar campanhas do Meta',
      detalhes: error.response?.data || error.message 
    });
  }
});

// GET - Obter insights das campanhas
router.get('/insights-campanhas', async (req, res) => {
  const { access_token, account_id, data_inicio, data_fim } = req.body;
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${account_id}/insights`,
      {
        params: {
          access_token: access_token,
          fields: 'campaign_id,campaign_name,impressions,clicks,ctr,spend,conversions,conversion_rate',
          time_range: JSON.stringify({
            since: data_inicio || '2024-01-01',
            until: data_fim || '2024-12-31'
          }),
          level: 'campaign'
        }
      }
    );
    
    res.json({ insights: response.data.data });
    
  } catch (error) {
    console.error('Erro ao buscar insights:', error.response?.data || error.message);
    res.status(500).json({ 
      erro: 'Erro ao buscar insights do Meta',
      detalhes: error.response?.data || error.message 
    });
  }
});

// POST - Configurar webhook para leads do Meta
router.post('/configurar-webhook', async (req, res) => {
  const { access_token, page_id, webhook_url } = req.body;
  
  try {
    // Configurar webhook para a página
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${page_id}/subscribed_apps`,
      {
        subscribed_fields: ['leadgen'],
        access_token: access_token
      }
    );
    
    res.json({ 
      mensagem: 'Webhook configurado com sucesso',
      resposta: response.data 
    });
    
  } catch (error) {
    console.error('Erro ao configurar webhook:', error.response?.data || error.message);
    res.status(500).json({ 
      erro: 'Erro ao configurar webhook',
      detalhes: error.response?.data || error.message 
    });
  }
});

// POST - Endpoint para receber webhooks do Meta
router.post('/webhook-leads', async (req, res) => {
  const { entry } = req.body;
  
  try {
    for (const pageEntry of entry) {
      for (const change of pageEntry.changes) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;
          
          // Buscar dados completos do lead
          const leadResponse = await axios.get(
            `https://graph.facebook.com/v17.0/${leadId}`,
            {
              params: {
                access_token: process.env.META_ACCESS_TOKEN
              }
            }
          );
          
          const leadData = leadResponse.data;
          const fieldData = leadData.field_data || [];
          
          // Extrair dados do lead
          const leadInfo = {};
          fieldData.forEach(field => {
            leadInfo[field.name] = field.values[0];
          });
          
          // Salvar lead no banco
          const insertQuery = `
            INSERT INTO leads (nome, telefone, email, origem, campanha_id, fonte_captacao, dados_meta)
            VALUES (?, ?, ?, 'meta', NULL, 'facebook_ads', ?)
          `;
          
          await connection.promise().execute(insertQuery, [
            leadInfo.full_name || '',
            leadInfo.phone_number || '',
            leadInfo.email || '',
            JSON.stringify(leadData)
          ]);
          
          console.log('Lead do Meta salvo com sucesso:', leadInfo);
        }
      }
    }
    
    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('ERROR');
  }
});

module.exports = router;
