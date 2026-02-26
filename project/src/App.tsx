import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase, Company } from './lib/supabase';
import TopPage from './components/TopPage';
import CompanyPage from './components/CompanyPage';
import CompanyAnalysisPage from './components/CompanyAnalysisPage';
import ESPage from './components/ESPage';
import ESListPage from './components/ESListPage';
import InterviewPage from './components/InterviewPage';
import InterviewListPage from './components/InterviewListPage';
import AccountSettingsPage from './components/AccountSettingsPage';
import HowToUsePage from './components/HowToUsePage';
import AddCompanyModal from './components/AddCompanyModal';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import { User, Home, FileText, MessageSquare, Settings, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function App() {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/');
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const initializeApp = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setIsLoading(false);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleAddCompanySuccess = () => {
    navigate('/');
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    { path: '/', label: 'ホーム', icon: Home },
    { path: '/es-list', label: 'ES一覧', icon: FileText },
    { path: '/interview-list', label: '面接一覧', icon: MessageSquare },
    { path: '/how-to-use', label: '使い方', icon: BookOpen },
    { path: '/account-settings', label: 'アカウント設定', icon: Settings },
  ];

  return (
    <div className="relative">
      <Sidebar>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Sidebar>

      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-50">
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-white hover:bg-slate-100 text-slate-700 px-3 sm:px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">ログアウト</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">ログイン</span>
          </button>
        )}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <TopPage
              onAddCompany={() => {
                if (!user) {
                  setShowAuth(true);
                } else {
                  setShowAddCompany(true);
                }
              }}
              onLoginRequired={() => setShowAuth(true)}
            />
          }
        />
        <Route
          path="/es-list"
          element={<ESListPage />}
        />
        <Route
          path="/interview-list"
          element={<InterviewListPage />}
        />
        <Route
          path="/companies/:companyId"
          element={<CompanyPage onLoginRequired={() => setShowAuth(true)} />}
        />
        <Route
          path="/companies/:companyId/analysis"
          element={<CompanyAnalysisPage onLoginRequired={() => setShowAuth(true)} />}
        />
        <Route
          path="/companies/:companyId/es"
          element={<ESPage onLoginRequired={() => setShowAuth(true)} />}
        />
        <Route
          path="/companies/:companyId/interview"
          element={<InterviewPage onLoginRequired={() => setShowAuth(true)} />}
        />
        <Route
          path="/how-to-use"
          element={<HowToUsePage />}
        />
        <Route
          path="/account-settings"
          element={<AccountSettingsPage />}
        />
      </Routes>

      {showAddCompany && user && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSuccess={handleAddCompanySuccess}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            checkUser();
            navigate('/');
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default App;
