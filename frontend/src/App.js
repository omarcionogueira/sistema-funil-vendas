import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Funil from './pages/Funil';
import Campanhas from './pages/Campanhas';
import MetaIntegracao from './pages/MetaIntegracao';
import Relatorios from './pages/Relatorios';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container-fluid">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/funil" element={<Funil />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/meta" element={<MetaIntegracao />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
