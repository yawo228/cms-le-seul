import React, { useState, useEffect } from 'react';
import { 
  Home, Pill, Stethoscope, FlaskConical, Syringe, Package, LogOut, Menu, Users, BarChart3, ClipboardList, User as UserIcon, Lock, LayoutDashboard, ChevronRight, ChevronLeft, CreditCard, Sun, Moon, ScanLine, Activity, Settings, Wallet, Archive, FileText, ShieldAlert
} from 'lucide-react';
import { useStore } from './store/useStore';
import { UserRole } from './types';

import HomeModule from './components/Home/HomeModule';
import PharmacyModule from './components/Pharmacy/PharmacyModule';
import ConsultationModule from './components/Consultation/ConsultationModule';
import LaboratoryModule from './components/Laboratory/LaboratoryModule';
import NursingModule from './components/Nursing/NursingModule';
import CatalogModule from './components/Admin/CatalogModule';
import StockModule from './components/Admin/StockModule';
import ReportsModule from './components/Admin/ReportsModule';
import BillingModule from './components/Billing/BillingModule';
import PatientModule from './components/Patients/PatientModule';
import UserManagement from './components/Admin/UserManagement';
import SettingsModule from './components/Settings/SettingsModule';
import CaisseDashboard from './components/Caisse/CaisseDashboard';
import ConsumablesModule from './components/Consumables/ConsumablesModule';
import AuditModule from './components/Admin/AuditModule';

const App: React.FC = () => {
  const { currentUser, login, logout, initializeDemoData, users, settings, updateUser, medicaments, hasLoadedFromFirebase } = useStore();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial state if not already set
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab }, '', '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleNavigate = (tab: string) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '', '');
      setActiveTab(tab);
    }
  };
  const [isDesktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showCameraSelection, setShowCameraSelection] = useState(false);

  useEffect(() => {
    // ONLY initialize if Firebase has loaded AND it's truly empty
    if (hasLoadedFromFirebase && users.length === 0 && medicaments.length < 5) {
      console.log("Initializing demo data because Firebase is empty...");
      initializeDemoData();
    }
  }, [hasLoadedFromFirebase, users.length, medicaments.length, initializeDemoData]);

  useEffect(() => {
    if (currentUser && !currentUser.hasConfiguredCamera) {
      setShowCameraSelection(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(username, pin);
    if (result.success) {
      setError('');
      handleNavigate('home');
      setPin('');
      setUsername('');
    } else {
      setError(result.message || 'IDENTIFIANTS INCORRECTS');
    }
  };

  const handleCameraSelection = (preference: 'user' | 'environment') => {
    if (currentUser) {
      updateUser(currentUser.id, { 
        cameraPreference: preference, 
        hasConfiguredCamera: true 
      });
      setShowCameraSelection(false);
    }
  };

  const LogoIcon = ({ size = "w-10 h-10" }: { size?: string }) => (
    <svg viewBox="0 0 200 200" className={size}>
      <circle cx="65" cy="55" r="14" fill="#0056b3" />
      <circle cx="135" cy="55" r="14" fill="#0056b3" />
      <path d="M40 45 L70 90 L70 140" stroke="#ff4d6d" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M160 45 L130 90 L130 140" stroke="#ff4d6d" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M70 90 L100 55 L130 90" stroke="#ff4d6d" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M85 140 L85 100 L100 85 L115 100 L115 140 Z" fill="#0056b3" />
    </svg>
  );

  const renderContent = () => {
    const props = { onNavigate: handleNavigate };
    let content;
    switch (activeTab) {
      case 'home': content = <HomeModule {...props} />; break;
      case 'caisse': content = <CaisseDashboard {...props} />; break;
      case 'pharmacy': content = <PharmacyModule />; break;
      case 'consultation': content = <ConsultationModule />; break;
      case 'laboratory': content = <LaboratoryModule />; break;
      case 'nursing': content = <NursingModule />; break;
      case 'stock': content = <StockModule />; break;
      case 'consumables': content = <ConsumablesModule />; break;
      case 'billing': content = <BillingModule />; break;
      case 'inventory': content = <CatalogModule />; break;
      case 'reports': content = <ReportsModule />; break;
      case 'patients': content = <PatientModule />; break;
      case 'users': content = <UserManagement />; break;
      case 'settings': content = <SettingsModule />; break;
      case 'audit': content = <AuditModule />; break;
      default: content = <HomeModule {...props} />; break;
    }
    
    return (
      <div key={activeTab} className="animate-slide-up w-full h-full">
        {content}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 overflow-hidden relative font-sans">
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--accent-color)]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-magenta/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="noise-overlay" />

        <div className="bg-[var(--bg-secondary)] p-6 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-[var(--border-color)] animate-scale-in relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-[var(--border-color)] shadow-lg animate-bounce-subtle">
               <LogoIcon size="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">CMS LE SEUL</h1>
            <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em] text-[9px] mt-2">Bâtisseurs Réunis • Gestion</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Identifiant</label>
              <input 
                type="text" 
                className="w-full px-6 py-3.5 bg-[var(--bg-primary)] rounded-xl font-bold text-[var(--text-primary)] outline-none transition-all uppercase text-xs border border-[var(--border-color)] focus:border-[var(--accent-color)] placeholder-[var(--text-secondary)]/30"
                placeholder="NOM D'UTILISATEUR"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Code PIN</label>
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-[var(--bg-primary)] rounded-xl text-center text-3xl tracking-[0.4em] outline-none transition-all font-black text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] placeholder-[var(--text-secondary)]/20"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 p-2.5 rounded-xl animate-shake">
                <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{error}</p>
              </div>
            )}

            {/* Firebase Status Indicator */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                {import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Cloud Sync Actif' : 'Mode Local (Hors-ligne)'}
              </span>
            </div>

            <button 
              type="submit" 
              style={{ backgroundColor: settings.loginButtonColor || 'var(--accent-color)' }}
              className="w-full text-white py-4 rounded-2xl font-black text-base uppercase active:scale-95 hover:opacity-90 transition-all shadow-xl shadow-[var(--accent-color)]/20 border border-white/10 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10">Accéder au Système</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
            <p className="text-[var(--text-secondary)]/40 text-[8px] font-black uppercase tracking-[0.3em]">© 2024 CMS LE SEUL • Tous droits réservés</p>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'home', label: 'ACCUEIL', icon: Home, admin: false },
    { id: 'caisse', label: 'CAISSE', icon: Wallet, admin: false },
    { id: 'billing', label: 'FACTURE', icon: FileText, admin: false },
    { id: 'patients', label: 'PATIENTS', icon: Users, admin: false },
    { id: 'stock', label: 'STOCK', icon: ClipboardList, admin: false },
    { id: 'inventory', label: 'CATALOGUE', icon: Package, admin: true },
    { id: 'reports', label: 'BILAN', icon: BarChart3, admin: false },
    { id: 'audit', label: 'AUDIT', icon: ShieldAlert, admin: true },
    { id: 'users', label: 'AGENTS', icon: UserIcon, admin: true },
    { id: 'settings', label: 'PARAMÈTRES', icon: Settings, admin: true },
  ].filter(item => !item.admin || currentUser.role === UserRole.ADMIN || item.id === 'settings');

  const isCaisseActive = ['caisse', 'consultation', 'pharmacy', 'laboratory', 'nursing'].includes(activeTab);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans selection:bg-magenta/30 selection:text-white">
      {/* Noise Overlay for Texture */}
      <div className="noise-overlay" />

      {/* Background Ambience - Liquid & Dynamic */}
      <div className="fixed inset-0 pointer-events-none z-0 dark:block hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-royal/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-magenta/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Floating Glass Sidebar */}
      <aside className={`fixed inset-y-4 left-4 z-50 liquid-glass rounded-2xl md:rounded-[2rem] transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} lg:translate-x-0 ${isDesktopSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} flex flex-col overflow-hidden border-[var(--border-color)]`}>
        <div className="flex flex-col h-full relative z-10">
          <div className={`p-4 md:p-6 flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'space-x-4'} cursor-pointer group transition-all duration-300`} onClick={() => { handleNavigate('home'); setSidebarOpen(false); }}>
             <div className={`w-8 h-8 md:w-10 md:h-10 bg-[var(--accent-color)]/10 rounded-lg md:rounded-xl flex items-center justify-center border border-[var(--accent-color)]/20 shadow-lg shadow-[var(--accent-color)]/20 shrink-0 group-hover:scale-110 transition-transform duration-300 ${isDesktopSidebarCollapsed ? 'w-12 h-12' : 'w-8 h-8 md:w-10 md:h-10'}`}>
               <LogoIcon size={isDesktopSidebarCollapsed ? "w-8 h-8" : "w-5 h-5 md:w-6 md:h-6"} />
             </div>
             {!isDesktopSidebarCollapsed && (
               <div className="overflow-hidden animate-fade-in">
                 <h2 className="text-sm md:text-lg font-bold text-[var(--text-primary)] uppercase tracking-tighter leading-none whitespace-nowrap group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--text-primary)] group-hover:to-[var(--text-primary)]/50 transition-all">CMS LE SEUL</h2>
                 <p className="text-[7px] md:text-[8px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Bâtisseurs Réunis</p>
               </div>
             )}
          </div>
          
          <nav className="flex-1 px-3 md:px-4 space-y-2 md:space-y-3 overflow-y-auto scrollbar-hide py-2 md:py-4">
            {menuItems.map((item) => {
              const isActive = item.id === 'caisse' ? isCaisseActive : activeTab === item.id;
              return (
              <button
                key={item.id}
                onClick={() => { handleNavigate(item.id); setSidebarOpen(false); }}
                title={isDesktopSidebarCollapsed ? item.label : ''}
                className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 md:space-x-4 px-4 md:px-6'} py-3 md:py-5 rounded-xl md:rounded-[1.5rem] transition-all duration-500 squishy-button group relative overflow-hidden ${isActive ? 'bg-[var(--accent-color)] text-white shadow-xl shadow-[var(--accent-color)]/40 border border-white/20 scale-[1.02]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-color)]/5 hover:text-[var(--text-primary)] border border-transparent'}`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-50" />}
                <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <item.icon size={18} md:size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!isDesktopSidebarCollapsed && <span className="relative z-10 font-bold text-[10px] md:text-[11px] uppercase tracking-widest truncate">{item.label}</span>}
                {isActive && !isDesktopSidebarCollapsed && (
                  <div className="absolute right-4 flex items-center gap-1">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                    <div className="w-0.5 h-3 md:w-1 md:h-4 rounded-full bg-white/30" />
                  </div>
                )}
              </button>
            )})}
          </nav>

          <div className="p-4 md:p-6 space-y-2 md:space-y-3">
            <button 
              onClick={() => setDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="hidden lg:flex w-full items-center justify-center p-3 md:p-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-color)]/5 rounded-xl md:rounded-2xl transition-all duration-300"
            >
              {isDesktopSidebarCollapsed ? <ChevronRight size={18} md:size={20} /> : <ChevronLeft size={18} md:size={20} />}
            </button>
            <button onClick={logout} className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-center space-x-2 md:space-x-3'} py-3 md:py-5 bg-[var(--accent-color)]/5 text-[var(--text-secondary)] rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase border border-[var(--border-color)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all squishy-button`}>
              <LogOut size={16} md:size={18} />
              {!isDesktopSidebarCollapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen w-full relative z-10 transition-all duration-500 ${isDesktopSidebarCollapsed ? 'lg:ml-28' : 'lg:ml-80'} md:pr-4 md:py-4`}>
        {/* Spatial Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 mb-2 md:mb-4 liquid-glass rounded-2xl md:rounded-[2rem] sticky top-2 md:top-4 z-40 border-[var(--border-color)]">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 text-[var(--text-primary)] hover:bg-[var(--accent-color)]/5 rounded-xl transition-colors active:scale-90 border border-[var(--border-color)]"><Menu size={18}/></button>
            
            {/* Retour Button */}
            {activeTab !== 'home' && (
              <button 
                onClick={() => {
                  if (['consultation', 'pharmacy', 'laboratory', 'nursing'].includes(activeTab)) {
                    handleNavigate('caisse');
                  } else {
                    handleNavigate('home');
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--accent-color)]/5 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-all active:scale-95 group"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Retour</span>
              </button>
            )}

            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-bold text-[var(--accent-color)] uppercase tracking-tight flex items-center gap-2">
                <span>{activeTab === 'home' ? 'Tableau de Bord' : (activeTab === 'caisse' || isCaisseActive ? 'Caisse Centralisée' : menuItems.find(m => m.id === activeTab)?.label)}</span>
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
              </h1>
              <p className="text-[8px] md:text-[9px] font-semibold text-[var(--accent-secondary)] uppercase tracking-[0.2em] pl-0.5">Session {currentUser.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] md:text-[11px] font-bold uppercase text-[var(--text-primary)] tracking-wider">{currentUser.fullName}</span>
                <span className="text-[7px] md:text-[8px] font-semibold text-emerald-500 uppercase tracking-widest">En ligne</span>
             </div>
             <button className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/5 text-[var(--text-primary)] flex items-center justify-center font-bold text-[10px] md:text-xs uppercase shadow-md border border-[var(--border-color)] hover:scale-105 transition-transform relative overflow-hidden group">
               <div className="absolute inset-0 bg-[var(--accent-color)]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
               <span className="relative z-10">{currentUser.fullName.charAt(0)}</span>
             </button>
          </div>
        </header>

        {/* Content Container with 3D feel */}
        <div className="flex-1 rounded-2xl md:rounded-[2.5rem] relative perspective-1000 px-2 md:px-0 mt-4 md:mt-8">
            {renderContent()}
        </div>

        {/* Camera Selection Modal */}
        {showCameraSelection && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-[3rem] p-10 space-y-8 border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-20 h-20 bg-royal/20 rounded-full flex items-center justify-center mx-auto border border-royal/30">
                <ScanLine size={40} className="text-royal" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Configuration Caméra</h2>
                <p className="text-[var(--text-secondary)]/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Choisissez votre caméra par défaut</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleCameraSelection('user')}
                  className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-royal hover:border-royal transition-all group flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center group-hover:bg-white/20">
                    <UserIcon size={24} className="text-[var(--text-primary)] group-hover:text-white" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-[var(--text-primary)] group-hover:text-white">Frontale</span>
                </button>
                <button 
                  onClick={() => handleCameraSelection('environment')}
                  className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-magenta hover:border-magenta transition-all group flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center group-hover:bg-white/20">
                    <Archive size={24} className="text-[var(--text-primary)] group-hover:text-white" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-[var(--text-primary)] group-hover:text-white">Arrière</span>
                </button>
              </div>
              <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">Vous pourrez modifier ce choix dans les paramètres</p>
            </div>
          </div>
        )}
      </main>
      
      {/* AI Assistant Floating Button (Zero UI) - Removed */}
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default App;
