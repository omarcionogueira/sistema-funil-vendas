const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/leads', require('./src/routes/leads'));
app.use('/api/campanhas', require('./src/routes/campanhas'));
app.use('/api/funil', require('./src/routes/funil'));
app.use('/api/meta', require('./src/routes/meta'));
app.use('/api/relatorios', require('./src/routes/relatorios'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    sistema: 'Sistema de Funil de Vendas',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
