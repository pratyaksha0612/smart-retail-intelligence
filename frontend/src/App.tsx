import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { 
  Dashboard, 
  FaceRecognition, 
  ProductClassification, 
  SentimentAnalysis, 
  Chatbot, 
  CustomerIntelligence, 
  Analytics, 
  ApiDocs, 
  Settings,
  Auth
} from './pages';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<CustomerIntelligence />} />
            <Route path="vision" element={<FaceRecognition />} />
            <Route path="sentiment" element={<SentimentAnalysis />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="api-docs" element={<ApiDocs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
