import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import MainApp from './components/MainApp';
import AdminPanel from './components/admin/AdminPanel';
import ProfilePage from './components/profile/ProfilePage';

type View = 'app' | 'admin' | 'profile';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState<View>('app');

    const renderContent = () => {
        switch(currentView) {
            case 'admin':
                return user?.role === 'admin' ? <AdminPanel /> : <MainApp onNavigateToBilling={() => setCurrentView('profile')} />;
            case 'profile':
                return <ProfilePage />;
            case 'app':
            default:
                return <MainApp onNavigateToBilling={() => setCurrentView('profile')} />;
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <Header currentView={currentView} onNavigate={setCurrentView} />
            {renderContent()}
            {currentView === 'app' && (
                 <footer className="text-center py-6 text-slate-500 text-sm">
                    <p>Desenvolvido com a API Gemini. Projetado para aprimoramento acadêmico.</p>
                </footer>
            )}
        </div>
    );
};

export default Dashboard;