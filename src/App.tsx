import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ClientView from './pages/ClientView';
import StaffView from './pages/StaffView';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ClientView />} />
        <Route path="/lista" element={<StaffView />} />
      </Routes>
    </HashRouter>
  );
}

