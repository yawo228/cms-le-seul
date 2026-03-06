import React, { useState } from 'react';
import { Settings, Save, Moon, Sun, Bell, Shield, Database, Wifi, Printer, Globe, RefreshCcw, LayoutGrid, Lock, User, Palette, Camera } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { UserRole } from '../../types';

const SettingsModule: React.FC = () => {
  const { currentUser, settings, updateSettings, resetSettings, updateUser, initializeDemoData, syncToCloud } = useStore();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [activeSection, setActiveSection] = useState(isAdmin ? 'general' : 'appearance');
  const [notifications, setNotifications] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleInitializeData = () => {
    if (window.confirm('Voulez-vous charger les nouveaux produits et réinitialiser le stock ? Cette action écrasera vos données actuelles.')) {
      initializeDemoData();
      alert('Données réinitialisées avec succès !');
    }
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    const result = await syncToCloud();
    setIsSyncing(false);
    alert(result.message);
  };

  // Toggle theme
  const toggleTheme = (theme: 'light' | 'dark') => {
    updateSettings({ theme });
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      resetSettings();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sections = [
    { id: 'general', label: 'Général', icon: Settings, desc: 'Infos établissement', admin: true },
    { id: 'appearance', label: 'Apparence', icon: Palette, desc: 'Thèmes & UI', admin: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alertes', admin: false },
    { id: 'security', label: 'Sécurité', icon: Shield, desc: 'Accès & Logs', admin: true },
    { id: 'data', label: 'Données', icon: Database, desc: 'Sauvegardes', admin: true },
    { id: 'devices', label: 'Matériel', icon: Printer, desc: 'Imprimantes', admin: false },
  ].filter(s => !s.admin || isAdmin);

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xxl font-black text-[var(--text-primary)] text-gradient-liquid uppercase tracking-tighter leading-none">Paramètres</h1>
          <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-[0.2em] mt-2">Configuration Système</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Navigation - Bento Style */}
        <div className="lg:col-span-3 space-y-3">
           <div className="liquid-glass rounded-[2rem] p-4">
            <nav className="space-y-2">
                {sections.map(section => (
                <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 squishy-button group relative overflow-hidden ${activeSection === section.id ? 'bg-royal text-white shadow-lg shadow-royal/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    <div className={`p-2 rounded-xl transition-colors ${activeSection === section.id ? 'bg-white/20' : 'bg-[var(--accent-color)]/5 group-hover:bg-[var(--accent-color)]/10'}`}>
                        <section.icon size={18} />
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-xs uppercase tracking-wider">{section.label}</span>
                        <span className="block text-[9px] font-bold opacity-60">{section.desc}</span>
                    </div>
                    {activeSection === section.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />}
                </button>
                ))}
            </nav>
           </div>
        </div>

        {/* Content Area - Bento Grid Layout */}
        <div className="lg:col-span-9">
          {activeSection === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {/* Establishment Info Card */}
              <div className="liquid-glass rounded-[2.5rem] p-8 md:col-span-2 space-y-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <Settings size={120} />
                 </div>
                 <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3 relative z-10">
                    <LayoutGrid size={20} className="text-royal" />
                    Identité de l'établissement
                 </h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]/60 tracking-widest pl-2">Nom de la structure</label>
                        <input 
                            type="text" 
                            value={settings.establishmentName || ''} 
                            onChange={(e) => updateSettings({ establishmentName: e.target.value })}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 font-bold text-[var(--text-primary)] uppercase outline-none focus:border-royal/50 focus:bg-[var(--bg-secondary)] transition-all text-sm" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]/60 tracking-widest pl-2">Email de contact</label>
                        <input 
                            type="email" 
                            value={settings.email || ''} 
                            onChange={(e) => updateSettings({ email: e.target.value })}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 font-semibold text-[var(--text-primary)] text-sm outline-none focus:border-royal/50 focus:bg-[var(--bg-secondary)] transition-all" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]/60 tracking-widest pl-2">Adresse Physique</label>
                        <input 
                            type="text" 
                            value={settings.address || ''} 
                            onChange={(e) => updateSettings({ address: e.target.value })}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 font-semibold text-[var(--text-primary)] text-sm outline-none focus:border-royal/50 focus:bg-[var(--bg-secondary)] transition-all" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]/60 tracking-widest pl-2">Téléphone</label>
                        <input 
                            type="text" 
                            value={settings.phone || ''} 
                            onChange={(e) => updateSettings({ phone: e.target.value })}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 font-semibold text-[var(--text-primary)] text-sm outline-none focus:border-royal/50 focus:bg-[var(--bg-secondary)] transition-all" 
                        />
                    </div>
                 </div>
              </div>

              {/* Logo Upload */}
              <div className="liquid-glass rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-[var(--border-color)] transition-colors">
                 <div className="w-24 h-24 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border-2 border-dashed border-[var(--border-color)] group-hover:border-royal/50 transition-colors">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                        <Settings className="text-[var(--text-secondary)]/20" size={32} />
                    )}
                 </div>
                 <div>
                    <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">Logo Officiel</h3>
                    <p className="text-[10px] text-[var(--text-secondary)]/40 mt-1 mb-3">Format PNG/JPG • Max 2MB</p>
                    <label className="cursor-pointer bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-primary)] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 inline-block border border-[var(--border-color)]">
                      Changer le logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                 </div>
              </div>

              {/* Localization */}
              <div className="liquid-glass rounded-[2.5rem] p-6 space-y-4">
                 <h3 className="font-black text-[var(--text-primary)] uppercase text-sm flex items-center gap-2">
                    <Globe size={16} className="text-emerald-400" />
                    Localisation
                 </h3>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">Langue</span>
                        <span className="text-xs font-black text-[var(--text-primary)] uppercase">Français (TG)</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">Devise</span>
                        <span className="text-xs font-black text-[var(--text-primary)] uppercase">FCFA (XOF)</span>
                    </div>
                 </div>
              </div>

              {/* Danger Zone */}
              <div className="md:col-span-2 mt-4">
                 <button 
                    onClick={handleReset}
                    className="w-full liquid-glass bg-red-500/5 border-red-500/20 hover:bg-red-500/10 p-6 rounded-[2rem] flex items-center justify-center gap-3 group transition-all squishy-button"
                 >
                    <RefreshCcw size={20} className="text-red-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-black text-red-400 uppercase text-xs tracking-widest">Réinitialiser la configuration d'usine</span>
                 </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
               <div className="md:col-span-2 liquid-glass rounded-[2.5rem] p-8 relative overflow-hidden">
                  <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-6 flex items-center gap-3">
                    <Palette size={24} className="text-magenta" />
                    Thème de l'interface
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                     <button 
                        onClick={() => toggleTheme('light')}
                        className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 group overflow-hidden ${settings.theme === 'light' ? 'border-royal bg-white shadow-xl shadow-royal/10' : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'}`}
                     >
                        <div className="absolute top-4 right-4">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.theme === 'light' ? 'border-royal' : 'border-[var(--border-color)]'}`}>
                              {settings.theme === 'light' && <div className="w-3 h-3 bg-royal rounded-full" />}
                           </div>
                        </div>
                        <Sun size={32} className={`mb-4 ${settings.theme === 'light' ? 'text-royal' : 'text-[var(--text-secondary)]'}`} />
                        <h3 className={`text-lg font-black uppercase ${settings.theme === 'light' ? 'text-slate-900' : 'text-[var(--text-primary)]'}`}>Mode Clair</h3>
                        <p className={`text-xs font-bold mt-1 ${settings.theme === 'light' ? 'text-slate-500' : 'text-[var(--text-secondary)]'}`}>Optimisé pour la journée</p>
                     </button>

                     <button 
                        onClick={() => toggleTheme('dark')}
                        className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 group overflow-hidden ${settings.theme === 'dark' ? 'border-royal bg-[#050505] shadow-xl shadow-royal/10' : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'}`}
                     >
                        <div className="absolute top-4 right-4">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.theme === 'dark' ? 'border-royal' : 'border-[var(--border-color)]'}`}>
                              {settings.theme === 'dark' && <div className="w-3 h-3 bg-royal rounded-full" />}
                           </div>
                        </div>
                        <Moon size={32} className={`mb-4 ${settings.theme === 'dark' ? 'text-royal' : 'text-[var(--text-secondary)]'}`} />
                        <h3 className={`text-lg font-black uppercase text-[var(--text-primary)]`}>Mode Sombre</h3>
                        <p className={`text-xs font-bold mt-1 text-[var(--text-secondary)]`}>Confort visuel nocturne</p>
                     </button>
                  </div>
               </div>

               <div className="liquid-glass rounded-[2.5rem] p-6 flex items-center justify-between border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-royal/20 flex items-center justify-center text-royal">
                        <Palette size={24} />
                     </div>
                     <div>
                        <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">Bouton de Connexion</h3>
                        <p className="text-[10px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-wider mt-0.5">Couleur personnalisée</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <input 
                       type="color" 
                       value={settings.loginButtonColor || '#0056b3'} 
                       onChange={(e) => updateSettings({ loginButtonColor: e.target.value })}
                       className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                     />
                     <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">{settings.loginButtonColor || '#0056b3'}</span>
                  </div>
               </div>

               <div className="liquid-glass rounded-[2.5rem] p-6 flex items-center justify-between border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Wifi size={24} />
                     </div>
                     <div>
                        <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">Animations</h3>
                        <p className="text-[10px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-wider mt-0.5">Effets Tactiles & Fluides</p>
                     </div>
                  </div>
                  <div className="w-14 h-8 bg-royal rounded-full p-1 cursor-pointer">
                     <div className="w-6 h-6 bg-white rounded-full shadow-md translate-x-6 transition-transform" />
                  </div>
               </div>
            </div>
          )}

          {/* Other sections placeholders with Bento style */}
          {activeSection === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight border-b border-[var(--border-color)] pb-4">Notifications</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Alertes Stock</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Notifier quand un produit est bas</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-royal' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Rapports Journaliers</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Résumé des ventes par email</p>
                  </div>
                  <button className="w-12 h-6 rounded-full p-1 bg-[var(--bg-primary)] border border-[var(--border-color)] transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-0" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Nouveaux Patients</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Alerte création dossier</p>
                  </div>
                  <button className="w-12 h-6 rounded-full p-1 bg-royal transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight border-b border-[var(--border-color)] pb-4">Sécurité</h2>
              <div className="space-y-6">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                   <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm mb-4">Utilisateurs Connectés</h3>
                   <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-xl mb-2 border border-[var(--border-color)]">
                      <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-black">
                        {currentUser?.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] uppercase">{currentUser?.fullName}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Session actuelle • {currentUser?.role}</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">En ligne</span>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-xl opacity-50 border border-[var(--border-color)]">
                      <div className="w-8 h-8 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full flex items-center justify-center font-black">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] uppercase">Admin Système</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Dernière connexion: Hier 14:30</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Déconnecté</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Double Authentification</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Sécuriser l'accès au compte</p>
                  </div>
                  <button className="w-12 h-6 rounded-full p-1 bg-[var(--bg-primary)] border border-[var(--border-color)] transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-0" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Changer Code PIN</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Modifier le code d'accès rapide</p>
                  </div>
                  <button className="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] rounded-xl text-[10px] font-black uppercase transition-colors border border-[var(--border-color)]">
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight border-b border-[var(--border-color)] pb-4">Données & Synchronisation</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Mode Hors-Ligne</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Continuer à travailler sans internet</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className={offlineMode ? 'text-red-400' : 'text-emerald-400'} />
                    <span className={`text-xs font-black uppercase ${offlineMode ? 'text-red-400' : 'text-emerald-400'}`}>
                      {offlineMode ? 'Déconnecté' : 'Connecté'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-royal/10 rounded-2xl border border-royal/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Database size={80} />
                  </div>
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <Database className="text-royal" size={20} />
                    <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">État de la Base de Données</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed relative z-10 mb-4">
                    La synchronisation Firebase est active. Les données sont répliquées en temps réel.
                    Dernière synchronisation : <span className="text-[var(--text-primary)] font-bold">{new Date().toLocaleTimeString()}</span>
                  </p>
                  <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={handleInitializeData}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={14} />
                        Charger les nouveaux produits
                    </button>
                    <button 
                      onClick={handleCloudSync}
                      disabled={isSyncing}
                      className="flex-1 py-3 bg-royal text-white rounded-xl font-black text-[10px] uppercase hover:bg-royal/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'En cours...' : 'Forcer Synchro'}
                    </button>
                    <button className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl font-black text-[10px] uppercase hover:bg-[var(--bg-secondary)]/80 transition-colors border border-[var(--border-color)]">
                        Exporter JSON
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <h3 className="font-black text-red-400 uppercase text-sm mb-2">Zone de Danger</h3>
                    <p className="text-[10px] text-red-400/60 mb-4">Attention, ces actions sont irréversibles.</p>
                    <button className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl font-black text-[10px] uppercase hover:bg-red-500/10 transition-colors">
                        Supprimer toutes les données locales
                    </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'devices' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight border-b border-[var(--border-color)] pb-4">Périphériques</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Impression Automatique</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Imprimer le ticket après encaissement</p>
                  </div>
                  <button 
                    onClick={() => setAutoPrint(!autoPrint)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${autoPrint ? 'bg-royal' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoPrint ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                   <div>
                     <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Imprimante Ticket (POS)</h3>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Sélectionner l'imprimante thermique</p>
                   </div>
                   <select className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold uppercase p-3 rounded-xl border border-[var(--border-color)] outline-none w-48">
                     <option>Système (Par défaut)</option>
                     <option>POS-80 (USB)</option>
                     <option>XP-58 (USB)</option>
                   </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                   <div>
                     <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Imprimante A4</h3>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Pour les rapports et factures</p>
                   </div>
                   <select className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold uppercase p-3 rounded-xl border border-[var(--border-color)] outline-none w-48">
                     <option>HP LaserJet Pro</option>
                     <option>Canon Pixma</option>
                     <option>PDF Virtuel</option>
                   </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                   <div>
                     <h3 className="font-bold text-[var(--text-primary)] uppercase text-sm">Caméra par défaut</h3>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Utilisée pour le scan des produits</p>
                   </div>
                   <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                     <button 
                        onClick={() => currentUser && updateUser(currentUser.id, { cameraPreference: 'user' })}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${currentUser?.cameraPreference === 'user' ? 'bg-royal text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                     >
                        Frontale
                     </button>
                     <button 
                        onClick={() => currentUser && updateUser(currentUser.id, { cameraPreference: 'environment' })}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${currentUser?.cameraPreference === 'environment' ? 'bg-royal text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                     >
                        Arrière
                     </button>
                   </div>
                </div>

                <div className="pt-4">
                    <button className="w-full py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] rounded-2xl font-black text-[var(--text-primary)] text-xs uppercase transition-all flex items-center justify-center gap-2">
                        <Printer size={16} />
                        Lancer une impression de test
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
