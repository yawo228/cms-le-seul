import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Plus, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Patient, AssuranceType } from '../../types';

interface PatientSelectorProps {
  selectedPatientId?: string;
  onSelect: (patient: Patient | null) => void;
  label?: string;
  theme?: 'light' | 'dark';
}

const PatientSelector: React.FC<PatientSelectorProps> = ({ 
  selectedPatientId, 
  onSelect, 
  label = "Identité Patient",
  theme = 'dark'
}) => {
  const { patients, addPatient } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  // New Patient Form State
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    nom: '',
    prenom: '',
    age: 0,
    sexe: 'M',
    telephone: '',
    assuranceType: AssuranceType.PLEIN_TARIF
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patients.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.telephone && p.telephone.includes(searchTerm))
  );

  const handleCreatePatient = () => {
    if (!newPatient.nom || !newPatient.prenom) return;
    
    const patient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      nom: newPatient.nom.toUpperCase(),
      prenom: newPatient.prenom,
      age: newPatient.age || 0,
      sexe: newPatient.sexe as 'M' | 'F',
      telephone: newPatient.telephone || '',
      assuranceType: newPatient.assuranceType as AssuranceType,
      numeroAssurance: newPatient.numeroAssurance || '',
      historique: []
    };

    addPatient(patient);
    onSelect(patient);
    setIsOpen(false);
    setShowCreateForm(false);
    setSearchTerm('');
    setNewPatient({ nom: '', prenom: '', age: 0, sexe: 'M', telephone: '', assuranceType: AssuranceType.PLEIN_TARIF });
  };

  return (
    <div className="relative z-50" ref={wrapperRef}>
      <label className={`block text-[9px] font-black uppercase mb-1 ml-1 tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{label}</label>
      <div className="relative">
        <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/30'}`} size={14} />
        <input 
          type="text" 
          className={`w-full pl-10 pr-10 py-2.5 rounded-xl font-bold uppercase text-xs transition-all outline-none border ${
            isLight 
              ? 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white' 
              : 'bg-white/5 placeholder-white/30 text-white border-white/10 focus:border-indigo-500 focus:bg-white/10'
          } ${selectedPatient ? (isLight ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10') : ''}`}
          placeholder="RECHERCHER OU CRÉER..."
          value={selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (selectedPatient) onSelect(null);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedPatient ? (
          <button 
            onClick={() => { onSelect(null); setSearchTerm(''); }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isLight ? 'bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500' : 'bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400'}`}
          >
            <X size={12} />
          </button>
        ) : (
          searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setIsOpen(false); }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60'}`}
            >
              <X size={14} />
            </button>
          )
        )}
      </div>

      {isOpen && !selectedPatient && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden animate-fade-in max-h-[300px] flex flex-col border z-[60] shadow-2xl ${isLight ? 'bg-white border-slate-100' : 'glass-panel bg-[#0f172a]/95 border-white/10'}`}>
          {!showCreateForm ? (
            <>
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => { onSelect(patient); setIsOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between group border-b last:border-0 transition-colors ${isLight ? 'hover:bg-slate-50 border-slate-50' : 'hover:bg-white/5 border-white/5'}`}
                    >
                      <div>
                        <p className={`font-bold text-[11px] uppercase ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{patient.nom} {patient.prenom}</p>
                        <p className={`text-[9px] font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{patient.age} Ans • {patient.telephone || 'Non renseigné'}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity">
                        <Check size={14} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={`p-4 text-center text-[10px] font-bold uppercase ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    Aucun patient trouvé
                  </div>
                )}
              </div>
              <div className={`p-2 border-t ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-white/5'}`}>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-indigo-500"
                >
                  <Plus size={14} /> Créer "{searchTerm || 'Nouveau'}"
                </button>
              </div>
            </>
          ) : (
            <div className={`p-3 space-y-2 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-[10px] uppercase text-indigo-400">Nouveau Patient</h3>
                <button onClick={() => setShowCreateForm(false)} className={`${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'}`}><X size={14}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  className={`p-2 rounded-lg text-[10px] font-bold uppercase outline-none border ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500'}`} 
                  placeholder="NOM"
                  value={newPatient.nom}
                  onChange={e => setNewPatient({...newPatient, nom: e.target.value.toUpperCase()})}
                />
                <input 
                  className={`p-2 rounded-lg text-[10px] font-bold uppercase outline-none border ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500'}`} 
                  placeholder="PRÉNOM"
                  value={newPatient.prenom}
                  onChange={e => setNewPatient({...newPatient, prenom: e.target.value})}
                />
                <input 
                  type="number"
                  className={`p-2 rounded-lg text-[10px] font-bold uppercase outline-none border ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500'}`} 
                  placeholder="AGE"
                  value={newPatient.age || ''}
                  onChange={e => setNewPatient({...newPatient, age: Number(e.target.value)})}
                />
                <select 
                  className={`p-2 rounded-lg text-[10px] font-bold uppercase appearance-none outline-none border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500'}`}
                  value={newPatient.sexe}
                  onChange={e => setNewPatient({...newPatient, sexe: e.target.value as 'M' | 'F'})}
                >
                  <option value="M" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>HOMME</option>
                  <option value="F" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>FEMME</option>
                </select>
                <input 
                  className={`col-span-2 p-2 rounded-lg text-[10px] font-bold uppercase outline-none border ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500'}`} 
                  placeholder="TÉLÉPHONE"
                  value={newPatient.telephone}
                  onChange={e => setNewPatient({...newPatient, telephone: e.target.value})}
                />
              </div>
              <button 
                onClick={handleCreatePatient}
                disabled={!newPatient.nom || !newPatient.prenom}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400"
              >
                Enregistrer & Sélectionner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSelector;
