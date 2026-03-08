import React, { useState, useMemo } from 'react';
import { Syringe, User, Clipboard, Check, Printer, Bookmark, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { CareAct, AssuranceType, UserRole, Patient } from '../../types';
import TicketModal from '../Common/TicketModal';
import PatientSelector from '../Common/PatientSelector';

const NursingModule: React.FC = () => {
  const { careActs, practitioners, createTicket, currentUser, settings } = useStore();
  const [selectedAct, setSelectedAct] = useState<CareAct | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [practitioner, setPractitioner] = useState('');
  const [assurance, setAssurance] = useState<AssuranceType>(AssuranceType.PLEIN_TARIF);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'TMONEY' | 'FLOOZ' | 'CHEQUE' | 'VIREMENT' | 'ASSURANCE'>('ESPECES');

  const nurses = practitioners.filter(p => p.role === UserRole.INFIRMIER || p.role === UserRole.MEDECIN);

  const groupedActs = useMemo(() => {
    const grouped: Record<string, CareAct[]> = {};
    careActs.forEach(act => {
      if (!grouped[act.categorie]) grouped[act.categorie] = [];
      grouped[act.categorie].push(act);
    });
    return grouped;
  }, [careActs]);

  const handleCreate = () => {
    if (!selectedAct || !selectedPatient || !practitioner) return;

    const gross = selectedAct.prix;
    const net = assurance === AssuranceType.INAM ? gross * 0.2 : 
                assurance === AssuranceType.AMU ? gross * 0.1 : gross;
    
    const pract = practitioners.find(p => p.id === practitioner);

    const ticket = createTicket({
      type: 'NURSING',
      patientNom: `${selectedPatient.nom} ${selectedPatient.prenom}`.toUpperCase(),
      patientId: selectedPatient.id,
      items: [{
        id: selectedAct.id,
        label: selectedAct.nom,
        quantity: 1,
        pricePerUnit: net,
        total: net,
        partAssurance: gross - net,
        partPatient: net
      }],
      assurance,
      totalBrut: gross,
      partAssurance: gross - net,
      netAPayer: net,
      montantRecu: paymentStatus === 'PAID' ? montantRecu : 0,
      reliquat: paymentStatus === 'PAID' ? (montantRecu - net) : 0,
      caissierId: currentUser?.id || 'sys',
      caissierNom: currentUser?.fullName || 'System',
      praticienId: pract?.id,
      praticienNom: pract?.nom,
      statut: paymentStatus,
      paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined
    });

    setLastTicket(ticket);
    setShowTicket(true);
    setSelectedAct(null);
    setSelectedPatient(null);
    setPractitioner('');
    setMontantRecu(0);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 pb-20">
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-base md:text-xl font-bold flex items-center space-x-2">
          <Syringe className="text-orange-500" size={18} md:size={22} />
          <span className="text-[var(--text-primary)]">Actes de Soins</span>
        </h2>
        
        <div className="space-y-6 md:space-y-8">
          {(Object.entries(groupedActs) as [string, CareAct[]][]).map(([category, acts]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center space-x-2 px-1">
                <Bookmark className="text-orange-400" size={12} md:size={14} />
                <h3 className="text-[11px] md:text-[12px] font-semibold text-[var(--text-secondary)]/60 uppercase tracking-widest">{category}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {acts.map(act => {
                  const isSelected = selectedAct?.id === act.id;
                  return (
                    <button 
                      key={act.id}
                      onClick={() => setSelectedAct(act)}
                      className={`aspect-square p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border-2 text-center transition-all duration-500 group flex flex-col items-center justify-center gap-2 md:gap-4 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500/5 shadow-xl shadow-orange-500/10 scale-[1.05]' 
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-orange-200 hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-3xl flex items-center justify-center transition-all duration-500 ${
                        isSelected 
                          ? 'bg-orange-500 text-white rotate-6 shadow-lg shadow-orange-500/30' 
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]/30 group-hover:bg-orange-500/10 group-hover:text-orange-500 group-hover:-rotate-3'
                      }`}>
                        <Syringe size={isSelected ? 32 : 24} md:size={isSelected ? 48 : 32} strokeWidth={1.5} />
                      </div>
                      <div className="w-full">
                        <p className={`font-black uppercase text-[var(--text-primary)] leading-tight mb-1 line-clamp-2 tracking-tighter transition-colors ${isSelected ? 'text-orange-600' : ''} ${isSelected ? 'text-[10px] md:text-sm' : 'text-[9px] md:text-xs'}`}>{act.nom}</p>
                        <p className="text-[10px] md:text-base font-black text-orange-600/80 tracking-tighter">{(act.prix || 0).toLocaleString()} F</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 lg:p-8 rounded-3xl shadow-xl border border-[var(--border-color)] space-y-6 h-fit sticky top-24 text-[var(--text-primary)]">
        <h3 className="text-xl font-bold border-b border-[var(--border-color)] pb-4 uppercase tracking-tighter text-[var(--text-primary)]">Validation du Soin</h3>
        
        <div className="space-y-4">
          <PatientSelector 
            selectedPatientId={selectedPatient?.id} 
            onSelect={setSelectedPatient} 
            theme={settings.theme}
          />

          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)]/40 uppercase mb-1 ml-1 tracking-widest">Infirmier / Agent Prestataire</label>
            <div className="relative">
              <Clipboard className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={18} />
              <select 
                className="w-full pl-10 pr-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-black uppercase text-xs text-[var(--text-primary)]"
                value={practitioner}
                onChange={(e) => setPractitioner(e.target.value)}
              >
                <option value="">CHOISIR L'AGENT...</option>
                {nurses.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)]/40 uppercase mb-1 ml-1 tracking-widest">Assurance</label>
            <select 
              className="w-full px-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none font-black uppercase text-xs text-[var(--text-primary)]"
              value={assurance}
              onChange={(e) => setAssurance(e.target.value as AssuranceType)}
            >
              {Object.values(AssuranceType).map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        {selectedAct && (
          <div className="p-6 bg-orange-500/10 rounded-3xl space-y-4">
            <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase tracking-widest">
              <span>{selectedAct.nom}</span>
              <span>{selectedAct.prix.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-orange-700 pt-4 border-t border-orange-200 tracking-tighter">
              <span>NET À PAYER</span>
              <span>
                {(assurance === AssuranceType.INAM ? selectedAct.prix * 0.2 : 
                  assurance === AssuranceType.AMU ? selectedAct.prix * 0.1 : 
                  selectedAct.prix).toLocaleString()} F
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black uppercase text-orange-400 tracking-widest ml-1">Somme Reçue</label>
              
              <div className="grid grid-cols-5 gap-2 mb-2">
                {[500, 1000, 2000, 5000, 10000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setMontantRecu(amt)}
                    className="py-2 bg-[var(--bg-secondary)] border-b-4 border-orange-200 rounded-xl font-black text-[9px] text-orange-600 active:border-b-0 active:translate-y-1 transition-all hover:bg-orange-500/10 shadow-sm"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Payment Status & Method */}
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setPaymentStatus('PAID')} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${paymentStatus === 'PAID' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/80'}`}
                >
                  Payé
                </button>
                <button 
                  onClick={() => setPaymentStatus('PENDING')} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${paymentStatus === 'PENDING' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/80'}`}
                >
                  Non Payé
                </button>
              </div>

              {paymentStatus === 'PAID' && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['ESPECES', 'TMONEY', 'FLOOZ', 'CHEQUE', 'VIREMENT', 'ASSURANCE'].map(method => (
                    <button 
                      key={method} 
                      onClick={() => setPaymentMethod(method as any)}
                      className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${paymentMethod === method ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/80'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <input 
                  type="number" 
                  className="w-full p-3 bg-[var(--bg-secondary)] border-2 border-orange-200 rounded-xl font-black text-xl text-orange-900 outline-none focus:border-orange-500 transition-colors"
                  placeholder="0"
                  value={montantRecu || ''}
                  onChange={(e) => setMontantRecu(Number(e.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-orange-400">FCFA</span>
              </div>
            </div>

            {montantRecu > 0 && (
              <div className="flex justify-between items-center bg-orange-900 p-4 rounded-xl text-white">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Reliquat</span>
                 <span className={`text-2xl font-black tracking-tighter`}>
                   {(montantRecu - (assurance === AssuranceType.INAM ? selectedAct.prix * 0.2 : assurance === AssuranceType.AMU ? selectedAct.prix * 0.1 : selectedAct.prix)).toLocaleString()} F
                 </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedAct(null); setSelectedPatient(null); setPractitioner(''); setMontantRecu(0); }}
            className="px-6 py-4 rounded-2xl font-black text-sm uppercase bg-[var(--bg-primary)] text-[var(--text-secondary)] active:scale-95 transition-all flex items-center gap-2"
          >
            <X size={18} /> Retour
          </button>
          <button 
            onClick={handleCreate}
            disabled={!selectedAct || !selectedPatient || !practitioner}
            className={`flex-1 py-5 rounded-2xl font-black shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 uppercase tracking-tighter text-lg text-white ${montantRecu >= (selectedAct ? (assurance === AssuranceType.INAM ? selectedAct.prix * 0.2 : assurance === AssuranceType.AMU ? selectedAct.prix * 0.1 : selectedAct.prix) : 0) ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-orange-500 shadow-orange-500/30'}`}
          >
            <Check size={24} />
            <span>{montantRecu >= (selectedAct ? (assurance === AssuranceType.INAM ? selectedAct.prix * 0.2 : assurance === AssuranceType.AMU ? selectedAct.prix * 0.1 : selectedAct.prix) : 0) ? "ENCAISSER & VALIDER" : "ENVOYER EN CAISSE"}</span>
          </button>
        </div>
      </div>

      {showTicket && lastTicket && (
        <TicketModal ticket={lastTicket} onClose={() => setShowTicket(false)} />
      )}
    </div>
  );
};

export default NursingModule;
