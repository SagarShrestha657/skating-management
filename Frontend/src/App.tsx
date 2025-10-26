import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SkatingManagement from './pages/SkatingManagement';
import Analysis from './pages/Analysis';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <LoginModal />;
    }

    return (
        <Routes>
            <Route path="/" element={<SkatingManagement />} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/analysis" element={<Analysis />} />
            </Route>
        </Routes>
    );
};


const App: React.FC = () => {
    return (
        <AuthProvider>
        <Router>
            <AppContent />
        </Router>
    </AuthProvider>
    );
};

export default App;