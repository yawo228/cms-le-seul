import React, { useState, useMemo } from 'react';
import { Stethoscope, User, ClipboardList, Check, UserPlus, X, Layers, ArrowLeft, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AssuranceType, UserRole, Patient, ConsultationType } from '../../types';
import PatientSelector from '../Common/PatientSelector';
import TicketModal from '../Common/TicketModal';

const ConsultationModule: React.FC = () => {
  const { practitioners, createTicket, currentUser, consultationTypes } = useStore();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState('');
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [assurance, setAssurance] = useState<AssuranceType>(AssuranceType.PLEIN_TARIF);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'TMONEY' | 'FLOOZ' | 'CHEQUE' | 'VIREMENT' | 'ASSURANCE'>('ESPECES');

  const doctors = practitioners.filter(p => p.role === UserRole.MEDECIN || p.role === UserRole.INFIRMIER);

  const groupedTypes: Record<string, ConsultationType[]> = useMemo(() => {
    const s = search.toLowerCase();
    const filtered = (consultationTypes || []).filter(c => c.label.toLowerCase().includes(s));
    const grouped: Record<string, ConsultationType[]> = {};
    filtered.forEach(c => {
      const cat = c.category === 'GP' ? 'GÉNÉRALE' : c.category === 'CPN' ? 'MATERNITÉ (CPN)' : c.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(c);
    });
    return grouped;
  }, [consultationTypes, search]);

  const selectedConsultation = useMemo(() => 
    consultationTypes?.find(c => c.id === selectedConsultationId), 
  [consultationTypes, selectedConsultationId]);

  const calculateTotal = () => {
    if (!selectedConsultation) return { gross: 0, net: 0, assurancePart: 0 };

    const basePrice = selectedConsultation.price;
    let net = basePrice;

    if (assurance === AssuranceType.INAM) {
      net = selectedConsultation.priceInam;
    } else if (assurance === AssuranceType.AMU) {
      net = selectedConsultation.priceAmu;
    }

    return { gross: basePrice, net, assurancePart: basePrice - net };
  };

  const totals = calculateTotal();

  const handleCreate = () => {
    if (!selectedPatient || !selectedConsultation) return;

    const { gross, net, assurancePart } = totals;
    const pract = practitioners.find(p => p.id === selectedPractitioner);
    
    const ticket = createTicket({
      type: 'CONSULTATION',
      patientNom: `${selectedPatient.nom} ${selectedPatient.prenom}`.toUpperCase(),
      patientId: selectedPatient.id,
      items: [{
        id: selectedConsultation.id,
        label: selectedConsultation.label,
        quantity: 1,
        pricePerUnit: net,
        total: net,
        partAssurance: assurancePart,
        partPatient: net
      }],
      assurance,
      totalBrut: gross,
      partAssurance: assurancePart,
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
    
    setSelectedPatient(null);
    setSelectedPractitioner('');
    setSelectedConsultationId(null);
    setMontantRecu(0);
    setIsSummaryOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 pb-20 h-[calc(100vh-100px)]">
      {/* Left Side: Selection */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="bg-[var(--bg-secondary)] p-4 lg:p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)] space-y-4 shrink-0">
          <div className="flex items-center space-x-3 text-[var(--accent-color)]">
            <div className="p-2 bg-[var(--accent-color)]/10 rounded-xl">
              <Stethoscope size={24} />
            </div>
            <h2 className="font-black uppercase text-sm tracking-widest text-[var(--text-primary)]">Nouvelle Consultation</h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={18} />
            <input 
              type="text" 
              placeholder="RECHERCHER..." 
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] rounded-xl font-black uppercase text-xs outline-none border border-[var(--border-color)] focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 shadow-sm" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
           {Object.entries(groupedTypes).map(([category, types]) => (
             <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-[var(--accent-color)]/20 rounded-full"></div>
                  <h3 className="text-[11px] md:text-[12px] font-semibold text-[var(--text-secondary)]/60 uppercase tracking-widest">{category}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {types.map(type => (
                    <button 
                      key={type.id} 
                      onClick={() => setSelectedConsultationId(type.id)} 
                      className={`p-5 rounded-[1.5rem] border-2 text-left transition-all duration-300 group ${selectedConsultationId === type.id ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-lg shadow-[var(--accent-color)]/10' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/30'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${selectedConsultationId === type.id ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]/30 group-hover:bg-[var(--accent-color)]/10 group-hover:text-[var(--accent-color)]'}`}>
                            <Stethoscope size={20} />
                          </div>
                          {selectedConsultationId === type.id && <div className="bg-[var(--accent-color)] text-white text-[9px] font-black px-2 py-1 rounded-lg">SÉLECTIONNÉ</div>}
                       </div>
                       <div>
                          <p className="font-semibold text-xs uppercase text-[var(--text-primary)] leading-tight mb-1">{type.label}</p>
                          <p className="text-[11px] font-bold text-[var(--accent-color)]/80">{(assurance === AssuranceType.INAM ? type.priceInam : assurance === AssuranceType.AMU ? type.priceAmu : type.price || 0).toLocaleString()} F</p>
                       </div>
                    </button>
                  ))}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Right Side: Summary / Invoice */}
      <div className={`fixed inset-0 z-50 lg:static lg:z-auto lg:w-96 flex flex-col ${isSummaryOpen ? 'flex' : 'hidden lg:flex'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSummaryOpen(false)}></div>
        <div className="relative w-full h-full lg:h-auto lg:rounded-[2.5rem] bg-[var(--bg-secondary)] shadow-2xl lg:shadow-xl lg:border border-[var(--border-color)] flex flex-col animate-slide-in-right lg:animate-none overflow-hidden text-[var(--text-primary)]">
           
           {/* Header */}
           <div className="p-4 lg:p-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] z-10 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase text-[var(--accent-color)] tracking-widest flex items-center gap-2">
                  <Layers size={18} />
                  Facture Consultation
                </h2>
              </div>
              <button onClick={() => setIsSummaryOpen(false)} className="lg:hidden p-2 bg-[var(--bg-primary)] rounded-full text-[var(--text-secondary)]"><X size={20}/></button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[var(--bg-primary)]/30">
              <PatientSelector 
                selectedPatientId={selectedPatient?.id} 
                onSelect={setSelectedPatient} 
              />
              
              <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Praticien / Agent</label>
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={16} />
                      <select className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-bold uppercase text-xs outline-none focus:border-[var(--accent-color)] transition-colors text-[var(--text-primary)] appearance-none shadow-sm" value={selectedPractitioner} onChange={(e) => setSelectedPractitioner(e.target.value)}>
                        <option value="" className="text-black">SÉLECTIONNER...</option>
                        {doctors.map(d => <option key={d.id} value={d.id} className="text-black">{d.nom}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)]/40 ml-1 tracking-widest">Assurance</label>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                       {Object.values(AssuranceType).map(a => (
                         <button key={a} onClick={() => setAssurance(a)} className={`flex-1 px-3 py-2.5 rounded-xl border font-black text-[9px] uppercase transition-all whitespace-nowrap ${assurance === a ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-primary)]'}`}>{a}</button>
                       ))}
                    </div>
                  </div>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)] space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[var(--text-secondary)]/40 mb-1">Prestation</p>
                      <p className="text-xs font-black uppercase text-[var(--text-primary)]">{selectedConsultation?.label || 'Aucune sélection'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-[var(--text-secondary)]/40 mb-1">Prix</p>
                      <p className="text-xs font-mono font-medium text-[var(--accent-color)]">{totals.gross.toLocaleString()} F</p>
                    </div>
                 </div>

                 {totals.assurancePart > 0 && (
                   <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]/20">
                      <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase">Part Assurance</span>
                      <span className="text-xs font-black text-pink-500">-{totals.assurancePart.toLocaleString()} F</span>
                   </div>
                 )}
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest">Net à Payer</span>
                    <span className="text-3xl font-mono font-medium text-[var(--accent-color)] tracking-tighter">{totals.net.toLocaleString()} F</span>
                 </div>

                 <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)]/40 tracking-widest ml-1">Montant Reçu</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-mono font-medium text-2xl text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] transition-colors"
                        placeholder="0"
                        value={montantRecu || ''}
                        onChange={(e) => setMontantRecu(Number(e.target.value))}
                      />
                      <div className="px-3 py-3 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center font-black text-[10px] text-[var(--text-secondary)]/40">FCFA</div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 5000, 10000].map(amt => (
                        <button key={amt} onClick={() => setMontantRecu(amt)} className="py-2 bg-[var(--bg-primary)] rounded-lg text-[9px] font-black text-[var(--text-secondary)]/60 hover:bg-[var(--accent-color)]/10 hover:text-[var(--accent-color)] transition-colors">{amt}</button>
                      ))}
                    </div>

                     {/* Payment Status & Method */}
                     <div className="flex gap-2 mt-4">
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
                       <div className="grid grid-cols-3 gap-2 mt-2">
                         {['ESPECES', 'TMONEY', 'FLOOZ', 'CHEQUE', 'VIREMENT', 'ASSURANCE'].map(method => (
                           <button 
                             key={method} 
                             onClick={() => setPaymentMethod(method as any)}
                             className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${paymentMethod === method ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/80'}`}
                           >
                             {method}
                           </button>
                         ))}
                       </div>
                     )}
                 </div>

                 {montantRecu > 0 && (
                   <div className={`p-4 rounded-2xl flex justify-between items-center text-white shadow-lg ${montantRecu >= totals.net ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Reliquat</span>
                      <span className="text-xl font-mono font-medium">{(montantRecu - totals.net).toLocaleString()} F</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Footer Actions */}
           <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex gap-3">
              <button 
                onClick={() => setIsSummaryOpen(false)}
                className="lg:hidden px-4 py-4 rounded-2xl font-black text-xs uppercase bg-[var(--bg-primary)] text-[var(--text-secondary)] active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <button 
                onClick={handleCreate} 
                disabled={!selectedPatient || !selectedPractitioner || !selectedConsultation} 
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${!selectedPatient || !selectedPractitioner || !selectedConsultation ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)]/40 cursor-not-allowed' : montantRecu >= totals.net ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'}`}
              >
                {montantRecu >= totals.net ? <Check size={18} /> : <Layers size={18} />}
                {montantRecu >= totals.net ? "VALIDER & IMPRIMER" : "GÉNÉRER TICKET"}
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setIsSummaryOpen(true)} 
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Layers size={24} />
      </button>

      {showTicket && lastTicket && <TicketModal ticket={lastTicket} onClose={() => setShowTicket(false)} />}
    </div>
  );
};

export default ConsultationModule;
