import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Lock, Unlock, AlertTriangle, DollarSign, LogOut, FileText, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

interface SessionManagerProps {
  children: React.ReactNode;
}

const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const { currentUser, cashSessions, openSession, closeSession, addDisbursement, tickets, clearCashSession, adjustCashSession } = useStore();
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [closingAmount, setClosingAmount] = useState<string>('');
  const [disbursementAmount, setDisbursementAmount] = useState<string>('');
  const [disbursementReason, setDisbursementReason] = useState<string>('');
  const [adminAction, setAdminAction] = useState<'NONE' | 'EMPTY' | 'ADJUST'>('NONE');
  const [adminAmount, setAdminAmount] = useState<string>('');
  const [adminReason, setAdminReason] = useState<string>('');
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(() => 
    cashSessions.find(s => s.status === 'OPEN'), 
    [cashSessions]
  );

  // Calculate current stats for the active session
  const currentSessionStats = useMemo(() => {
    if (!activeSession) return null;
    
    const totalDisbursements = (activeSession.disbursements || []).reduce((acc, d) => acc + d.amount, 0);
    
    const sessionSales = tickets
      .filter(t => 
        t.statut === 'PAID' && 
        t.caissierId === activeSession.cashierId && 
        new Date(t.date) >= new Date(activeSession.startTime)
      )
      .reduce((acc, t) => acc + (t.montantRecu || 0), 0);

    const theoretical = activeSession.openingAmount + sessionSales - totalDisbursements;

    return { sessionSales, totalDisbursements, theoretical };
  }, [activeSession, tickets]);

  const isMySession = activeSession?.cashierId === currentUser?.id;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // 1. ACCESS CONTROL
  if (activeSession && !isMySession && !isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Lock size={48} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase mb-4">Accès Refusé</h2>
        <p className="text-[var(--text-secondary)]/60 text-lg max-w-md">
          Une session de caisse est déjà en cours sur un autre support par <span className="text-[var(--text-primary)] font-bold">{activeSession.cashierName}</span>.
        </p>
        <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-secondary)]/40 uppercase tracking-widest">Début de session</p>
          <p className="text-[var(--text-primary)] font-mono font-bold">{new Date(activeSession.startTime).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  // 2. OPENING SESSION
  if (!activeSession && !isAdmin) {
    const handleOpen = () => {
      if (!openingAmount) return;
      const result = openSession(Number(openingAmount));
      if (!result.success) {
        setError(result.message || 'Erreur');
      }
    };

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-full max-w-md bg-[var(--bg-secondary)] p-8 rounded-[2.5rem] relative overflow-hidden border border-[var(--border-color)] shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-500" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Unlock size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase">Ouverture de Caisse</h2>
            <p className="text-[var(--text-secondary)]/60 text-xs font-bold uppercase tracking-wider mt-2">Veuillez déclarer votre fond de caisse</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]/60 uppercase tracking-wider mb-2 block">Montant Initial (Espèces)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={20} />
                <input 
                  type="number" 
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 text-[var(--text-primary)] font-black text-xl outline-none focus:border-[var(--accent-color)] transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-xs text-red-200 font-bold">{error}</p>
              </div>
            )}

            <button 
              onClick={handleOpen}
              disabled={!openingAmount}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ouvrir la Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ACTIVE SESSION DASHBOARD (Wrapper)
  
  const handleCloseSession = () => {
    if (!closingAmount) return;
    closeSession(Number(closingAmount));
    setShowCloseModal(false);
    setClosingAmount('');
  };

  const handleAddDisbursement = () => {
    if (!disbursementAmount || !disbursementReason) return;
    addDisbursement(Number(disbursementAmount), disbursementReason);
    setShowDisbursementModal(false);
    setDisbursementAmount('');
    setDisbursementReason('');
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Session Info Bar */}
      {activeSession && (
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-wider">Session Active: <span className="text-[var(--text-primary)]">{activeSession.cashierName}</span></span>
            </div>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <span className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase">Ouvert à: {new Date(activeSession.startTime).toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
               <div className="flex items-center gap-2 mr-2">
                 <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black uppercase border border-amber-500/30 flex items-center gap-2">
                   <ShieldAlert size={12} /> Mode Supervision
                 </div>
                 <button onClick={() => setAdminAction('EMPTY')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-bold uppercase border border-red-500/30 hover:bg-red-500/30 transition-colors">Vider</button>
                 <button onClick={() => setAdminAction('ADJUST')} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase border border-blue-500/30 hover:bg-blue-500/30 transition-colors">Ajuster</button>
               </div>
            )}
            <button 
              onClick={() => setShowDisbursementModal(true)}
              className="px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[10px] font-black text-[var(--text-primary)] uppercase transition-all flex items-center gap-2"
            >
              <FileText size={12} /> Sortie de Caisse
            </button>
            <button 
              onClick={() => setShowCloseModal(true)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2"
            >
              <LogOut size={12} /> Clôturer
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Modals */}
      
      {/* Admin Action Modal */}
      {adminAction !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase mb-6">
              {adminAction === 'EMPTY' ? 'Vider la Caisse' : 'Ajuster le Solde'}
            </h3>
            <div className="space-y-4">
              {adminAction === 'ADJUST' && (
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase mb-1 block">Nouveau Solde Théorique</label>
                  <input 
                    type="number" 
                    value={adminAmount}
                    onChange={(e) => setAdminAmount(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-color)]"
                    placeholder="0"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase mb-1 block">Motif (Obligatoire)</label>
                <textarea 
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-color)] h-24 resize-none"
                  placeholder="Justificatif de l'action administrative..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setAdminAction('NONE'); setAdminAmount(''); setAdminReason(''); }} className="flex-1 py-3 bg-[var(--bg-primary)] rounded-xl text-[var(--text-primary)] font-bold text-xs uppercase border border-[var(--border-color)]">Annuler</button>
                <button 
                  onClick={() => {
                    if (activeSession) {
                      if (adminAction === 'EMPTY') {
                        clearCashSession(activeSession.id, adminReason);
                      } else {
                        adjustCashSession(activeSession.id, Number(adminAmount), adminReason);
                      }
                    }
                    setAdminAction('NONE');
                    setAdminAmount('');
                    setAdminReason('');
                  }}
                  disabled={!adminReason || (adminAction === 'ADJUST' && !adminAmount)}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Modal */}
      {showDisbursementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase mb-6">Sortie de Caisse</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase mb-1 block">Montant</label>
                <input 
                  type="number" 
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-color)]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase mb-1 block">Motif (Obligatoire)</label>
                <textarea 
                  value={disbursementReason}
                  onChange={(e) => setDisbursementReason(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-color)] h-24 resize-none"
                  placeholder="Justificatif de la dépense..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowDisbursementModal(false)} className="flex-1 py-3 bg-[var(--bg-primary)] rounded-xl text-[var(--text-primary)] font-bold text-xs uppercase border border-[var(--border-color)]">Annuler</button>
                <button 
                  onClick={handleAddDisbursement}
                  disabled={!disbursementAmount || !disbursementReason}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blind Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 w-full max-w-md animate-scale-in text-center">
            <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-[var(--text-primary)]" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase mb-2">Clôture de Caisse</h3>
            <p className="text-[var(--text-secondary)]/40 text-xs font-bold uppercase tracking-wider mb-8">Saisie à l'aveugle (Blind Close)</p>
            
            <div className="space-y-6">
              <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-[var(--border-color)]">
                <label className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase mb-2 block">Montant Physique Constaté</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[var(--border-color)] py-2 text-center text-3xl font-black text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-colors"
                    placeholder="0"
                    autoFocus
                  />
                  <span className="absolute right-0 bottom-3 text-[var(--text-secondary)]/20 font-black">FCFA</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]/30 mt-4 italic">
                  Comptez l'argent dans le tiroir et saisissez le montant exact.
                  Le système calculera automatiquement les écarts.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-[var(--bg-primary)] rounded-xl text-[var(--text-primary)] font-bold text-xs uppercase hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]">Annuler</button>
                <button 
                  onClick={handleCloseSession}
                  disabled={!closingAmount}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  Confirmer & Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;
