
import React, { useState } from 'react';
import { Users, UserPlus, Shield, ToggleLeft as Toggle, Edit2, Trash2, X, Check, Stethoscope } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { User, UserRole, Practitioner } from '../../types';

const UserManagement: React.FC = () => {
  const { users, practitioners, addUser, updateUser, deleteUser, addPractitioner, updatePractitioner, deletePractitioner } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'practs'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleOpenModal = (item: any = null) => {
    if (item) setEditingItem({ ...item });
    else setEditingItem(activeSubTab === 'users' 
      ? { id: `u-${Date.now()}`, username: '', role: UserRole.CAISSIER, code: '', fullName: '', isActive: true } 
      : { id: `pr-${Date.now()}`, nom: '', role: UserRole.MEDECIN, specialite: '' }
    );
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubTab === 'users') {
      users.some(u => u.id === editingItem.id) ? updateUser(editingItem.id, editingItem) : addUser({ ...editingItem, createdAt: new Date().toISOString() });
    } else {
      practitioners.some(p => p.id === editingItem.id) ? updatePractitioner(editingItem.id, editingItem) : addPractitioner(editingItem);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tighter text-[var(--text-primary)]">Gestion des Agents</h1>
          <p className="text-[var(--text-secondary)] font-semibold uppercase tracking-widest text-[9px] mt-1">Administration des accès et rôles</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[var(--accent-color)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center space-x-2 text-xs uppercase tracking-tighter active:scale-95">
          <UserPlus size={18} />
          <span>AJOUTER</span>
        </button>
      </div>

      <div className="flex space-x-4 p-1 glass-panel rounded-2xl w-fit">
        <button onClick={() => setActiveSubTab('users')} className={`px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-[var(--bg-secondary)] text-[var(--accent-color)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Utilisateurs</button>
        <button onClick={() => setActiveSubTab('practs')} className={`px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeSubTab === 'practs' ? 'bg-[var(--bg-secondary)] text-[var(--accent-color)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Praticiens</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {activeSubTab === 'users' ? users.map(user => (
          <div key={user.id} className="bg-[var(--bg-secondary)] rounded-xl md:rounded-[2.5rem] p-4 md:p-8 border border-[var(--border-color)] flex items-center md:flex-col text-left md:text-center group hover:shadow-xl transition-all duration-500 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-[var(--accent-color)]/5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-110 transition-transform" />
            
            <div className="w-12 h-12 md:w-24 md:h-24 rounded-lg md:rounded-[2rem] bg-[var(--bg-primary)] border-2 md:border-4 border-[var(--border-color)] shadow-inner flex items-center justify-center text-[var(--text-secondary)] shrink-0 relative group-hover:rotate-6 transition-transform">
              <Users size={20} className="md:hidden" />
              <Users size={40} className="hidden md:block" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-6 md:h-6 rounded-full border-2 md:border-4 border-[var(--bg-secondary)] ${user.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
            </div>
            
            <div className="flex-1 min-w-0 md:w-full">
              <h3 className="font-black text-sm md:text-xl text-[var(--text-primary)] uppercase tracking-tighter leading-none truncate">{user.fullName}</h3>
              <p className="text-[var(--accent-color)] font-black text-[8px] md:text-[10px] mt-1 md:mt-2 uppercase tracking-widest truncate">@{user.username}</p>
              
              <div className="mt-2 md:mt-6 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl bg-[var(--bg-primary)] text-[7px] md:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest border border-[var(--border-color)] inline-block">
                {user.role}
              </div>
            </div>

            <div className="flex md:w-full md:border-t md:border-[var(--border-color)] md:pt-6 gap-2">
              <button onClick={() => handleOpenModal(user)} className="p-2 md:flex-1 bg-[var(--bg-primary)] md:p-4 rounded-lg md:rounded-2xl text-[var(--text-secondary)] hover:bg-[var(--accent-color)] hover:text-white transition-all border border-[var(--border-color)]"><Edit2 size={14} className="md:hidden" /><Edit2 size={18} className="hidden md:block mx-auto" /></button>
              <button onClick={() => deleteUser(user.id)} className="p-2 md:flex-1 bg-[var(--bg-primary)] md:p-4 rounded-lg md:rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-[var(--border-color)]"><Trash2 size={14} className="md:hidden" /><Trash2 size={18} className="hidden md:block mx-auto" /></button>
            </div>
          </div>
        )) : practitioners.map(p => (
          <div key={p.id} className="bg-[var(--bg-secondary)] rounded-xl md:rounded-[2.5rem] p-4 md:p-8 border border-[var(--border-color)] flex items-center md:flex-col text-left md:text-center group hover:shadow-xl transition-all duration-500 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-500/5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-110 transition-transform" />
            
            <div className="w-12 h-12 md:w-24 md:h-24 rounded-lg md:rounded-[2rem] bg-blue-500/10 border-2 md:border-4 border-blue-500/20 shadow-inner flex items-center justify-center text-blue-400 shrink-0 relative group-hover:-rotate-6 transition-transform">
              <Stethoscope size={20} className="md:hidden" />
              <Stethoscope size={40} className="hidden md:block" />
            </div>
            
            <div className="flex-1 min-w-0 md:w-full">
              <h3 className="font-black text-sm md:text-xl text-[var(--text-primary)] uppercase tracking-tighter leading-none truncate">{p.nom}</h3>
              <p className="text-blue-400 font-black text-[8px] md:text-[10px] mt-1 md:mt-2 uppercase tracking-widest truncate">{p.role}</p>
              {p.specialite && <p className="text-[var(--text-secondary)]/60 font-bold text-[7px] md:text-[9px] mt-0.5 md:mt-1 uppercase tracking-widest truncate">{p.specialite}</p>}
            </div>
            
            <div className="flex md:w-full md:border-t md:border-[var(--border-color)] md:pt-6 gap-2">
              <button onClick={() => handleOpenModal(p)} className="p-2 md:flex-1 bg-[var(--bg-primary)] md:p-4 rounded-lg md:rounded-2xl text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-[var(--border-color)]"><Edit2 size={14} className="md:hidden" /><Edit2 size={18} className="hidden md:block mx-auto" /></button>
              <button onClick={() => deletePractitioner(p.id)} className="p-2 md:flex-1 bg-[var(--bg-primary)] md:p-4 rounded-lg md:rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-[var(--border-color)]"><Trash2 size={14} className="md:hidden" /><Trash2 size={18} className="hidden md:block mx-auto" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-secondary)] rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300 border border-[var(--border-color)] my-auto">
            <div className="p-6 md:p-10 bg-[var(--bg-primary)]/50 text-[var(--text-primary)] flex justify-between items-center border-b border-[var(--border-color)]">
              <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Édition Profil</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors text-[var(--text-secondary)]"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-12 space-y-6 md:space-y-8">
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Nom Complet / Raison Sociale</label>
                   <input 
                    className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black uppercase text-base md:text-xl focus:border-[var(--accent-color)] outline-none transition-all text-[var(--text-primary)] shadow-sm" 
                    value={activeSubTab === 'users' ? editingItem.fullName : editingItem.nom} 
                    onChange={(e) => activeSubTab === 'users' ? setEditingItem({...editingItem, fullName: e.target.value}) : setEditingItem({...editingItem, nom: e.target.value})} 
                    required 
                   />
                </div>
                {activeSubTab === 'users' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Identifiant</label>
                          <input 
                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-bold text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all shadow-sm" 
                            value={editingItem.username} 
                            onChange={(e) => setEditingItem({...editingItem, username: e.target.value})} 
                            required 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Code PIN (4 Chiffres)</label>
                          <input 
                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-mono font-medium text-center tracking-[0.5em] text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all shadow-sm" 
                            maxLength={4} 
                            value={editingItem.code} 
                            onChange={(e) => setEditingItem({...editingItem, code: e.target.value})} 
                            required 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Rôle Système</label>
                       <div className="relative">
                         <select 
                          className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black uppercase text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all appearance-none shadow-sm" 
                          value={editingItem.role} 
                          onChange={(e) => setEditingItem({...editingItem, role: e.target.value as any})}
                         >
                            {Object.values(UserRole).map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                         </div>
                       </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                       <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Spécialité / Fonction</label>
                       <input 
                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-bold uppercase text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all shadow-sm" 
                        value={editingItem.specialite} 
                        onChange={(e) => setEditingItem({...editingItem, specialite: e.target.value})} 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Type de Praticien</label>
                       <div className="relative">
                         <select 
                          className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black uppercase text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all appearance-none shadow-sm" 
                          value={editingItem.role} 
                          onChange={(e) => setEditingItem({...editingItem, role: e.target.value as any})}
                         >
                            <option value={UserRole.MEDECIN} className="text-black">MÉDECIN / DOCTEUR</option>
                            <option value={UserRole.INFIRMIER} className="text-black">INFIRMIER / AGENT</option>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                         </div>
                       </div>
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className="w-full bg-[var(--accent-color)] text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl shadow-xl shadow-[var(--accent-color)]/20 hover:opacity-90 transition-all active:scale-95 uppercase tracking-tighter">Enregistrer le Profil</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
