import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Funil = () => {
  const [dadosFunil, setDadosFunil] = useState([]);
  const [taxaConversao, setTaxaConversao] = useState([]);
  const [filtroData, setFiltroData] = useState({
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    carregarDadosFunil();
    carregarTaxaConversao();
  }, []);

  const carregarDadosFunil = async () => {
    try {
      const params = {};
      if (filtroData.data_inicio) params.data_inicio = filtroData.data_inicio;
      if (filtroData.data_fim) params.data_fim = filtroData.data_fim;
      
      const response = await api.get('/funil/dados', { params });
      setDadosFunil(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do funil:', error);
    }
  };

  const carregarTaxaConversao = async () => {
    try {
      const response = await api.get('/funil/taxa-conversao');
      setTaxaConversao(response.data);
    } catch (error) {
      console.error('Erro ao carregar taxa de conversao:', error);
    }
  };

  const calcularTaxaConversao = (etapaAtual, proximaEtapa) => {
    const etapa = dadosFunil.find(e => e.etapa_nome === etapaAtual);
    const proxima = dadosFunil.find(e => e.etapa_nome === proximaEtapa);
    
    if (!etapa || !proxima || etapa.total_leads === 0) return '0%';
    
    const taxa = (proxima.total_leads / etapa.total_leads) * 100;
    return `${taxa.toFixed(1)}%`;
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltroData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = () => {
    carregarDadosFunil();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Funil de Vendas</h1>
        <div className="d-flex gap-2">
          <input
            type="date"
            className="form-control"
            name="data_inicio"
            value={filtroData.data_inicio}
            onChange={handleFiltroChange}
          />
          <input
            type="date"
            className="form-control"
            name="data_fim"
            value={filtroData.data_fim}
            onChange={handleFiltroChange}
          />
          <button className="btn btn-primary" onClick={aplicarFiltros}>
            Filtrar
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5>Visualizacao do Funil</h5>
        </div>
        <div className="card-body">
          <div className="row text-center">
            {dadosFunil.map((etapa, index) => (
              <div key={etapa.etapa_id} className="col">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">{etapa.etapa_nome}</h6>
                    <h3 className="text-primary">{etapa.total_leads}</h3>
                    <small className="text-muted">
                      Valor Medio: {etapa.valor_medio_etapa ? 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(etapa.valor_medio_etapa) : 'R$ 0,00'
                      }
                    </small>
                  </div>
                </div>
                {index < dadosFunil.length - 1 && (
                  <div className="text-center my-2">
                    <small className="text-muted">
                      {calcularTaxaConversao(etapa.etapa_nome, dadosFunil[index + 1].etapa_nome)}
                    </small>
                    <div className="arrow-down"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5>Taxa de Conversao Detalhada</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Etapa Origem</th>
                  <th>Etapa Destino</th>
                  <th>Total Movimentacoes</th>
                  <th>Periodo</th>
                </tr>
              </thead>
              <tbody>
                {taxaConversao.map((item, index) => (
                  <tr key={index}>
                    <td>{item.etapa_origem}</td>
                    <td>{item.etapa_destino}</td>
                    <td>{item.total_movimentacoes}</td>
                    <td>{item.mes_ano}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Funil;
