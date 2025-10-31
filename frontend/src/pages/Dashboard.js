import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [estatisticas, setEstatisticas] = useState({});
  const [dadosFunil, setDadosFunil] = useState([]);
  const [dadosCampanhas, setDadosCampanhas] = useState([]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const [estatisticasRes, funilRes, campanhasRes] = await Promise.all([
        api.get('/leads/estatisticas/geral'),
        api.get('/funil/dados'),
        api.get('/campanhas/roi')
      ]);
      
      setEstatisticas(estatisticasRes.data);
      setDadosFunil(funilRes.data);
      setDadosCampanhas(campanhasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const chartDataFunil = {
    labels: dadosFunil.map(item => item.etapa_nome),
    datasets: [
      {
        label: 'Leads por Etapa',
        data: dadosFunil.map(item => item.total_leads),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  const chartDataCampanhas = {
    labels: dadosCampanhas.map(item => item.nome),
    datasets: [
      {
        label: 'ROI (%)',
        data: dadosCampanhas.map(item => item.roi_percentual),
        backgroundColor: '#36A2EB'
      }
    ]
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Dashboard de Vendas</h1>
      
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total de Leads
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {estatisticas.total_leads || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Clientes Fechados
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {estatisticas.total_clientes || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Valor Medio Proposta
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatarMoeda(estatisticas.valor_medio_proposta)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Leads Hoje
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {estatisticas.leads_hoje || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-calendar fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header">
              <h6 className="m-0 font-weight-bold text-primary">Distribuicao do Funil</h6>
            </div>
            <div className="card-body">
              <Doughnut data={chartDataFunil} />
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header">
              <h6 className="m-0 font-weight-bold text-primary">ROI por Campanha</h6>
            </div>
            <div className="card-body">
              <Bar data={chartDataCampanhas} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header">
              <h6 className="m-0 font-weight-bold text-primary">Acoes Rapidas</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <Link to="/leads" className="btn btn-primary btn-block">
                    Gerenciar Leads
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link to="/funil" className="btn btn-success btn-block">
                    Visualizar Funil
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link to="/campanhas" className="btn btn-info btn-block">
                    Campanhas
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link to="/meta" className="btn btn-warning btn-block">
                    Integracao Meta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
