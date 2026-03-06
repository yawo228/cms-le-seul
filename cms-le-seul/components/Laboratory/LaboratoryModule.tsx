import React, { useState, useMemo } from 'react';
import { FlaskConical, Search, Check, Trash2, User, Layers, X, Plus, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LabExam, AssuranceType, Patient } from '../../types';
import PatientSelector from '../Common/PatientSelector';
import TicketModal from '../Common/TicketModal';

const LaboratoryModule: React.FC = () => {
  const { labExams, createTicket, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [selectedExams, setSelectedExams] = useState<LabExam[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [assurance, setAssurance] = useState<AssuranceType>(AssuranceType.PLEIN_TARIF);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'TMONEY' | 'FLOOZ' | 'CHEQUE' | 'VIREMENT' | 'ASSURANCE'>('ESPECES');

  const examsByCategory = useMemo(() => {
    const s = search.toLowerCase();
    const filtered = labExams.filter(e => e.nom.toLowerCase().includes(s));
    const grouped: Record<string, LabExam[]> = {};
    filtered.forEach(exam => {
      if (!grouped[exam.categorie]) grouped[exam.categorie] = [];
      grouped[exam.categorie].push(exam);
    });
    return grouped;
  }, [labExams, search]);

  const toggleExam = (exam: LabExam) => {
    setSelectedExams(prev => 
      prev.find(e => e.id === exam.id) ? prev.filter(e => e.id !== exam.id) : [...prev, exam]
    );
  };

  const totals = useMemo(() => {
    const gross = selectedExams.reduce((acc, e) => acc + e.prix, 0);
    const net = selectedExams.reduce((acc, e) => {
      if (assurance === AssuranceType.INAM) return acc + e.prixInam;
      if (assurance === AssuranceType.AMU) return acc + e.prixAmu;
      return acc + e.prix;
    }, 0);
    return { gross, net, insurance: gross - net };
  }, [selectedExams, assurance]);

  const handleCheckout = () => {
    if (!currentUser || selectedExams.length === 0 || !selectedPatient) return;
    
    const reliquat = montantRecu - totals.net;

    const ticket = createTicket({
      type: 'LABORATORY',
      patientNom: `${selectedPatient.nom} ${selectedPatient.prenom}`.toUpperCase(),
      patientId: selectedPatient.id,
      items: selectedExams.map(e => {
        const price = e.prix;
        let partPatient = price;
        if (assurance === AssuranceType.INAM) partPatient = e.prixInam;
        if (assurance === AssuranceType.AMU) partPatient = e.prixAmu;
        
        return {
          id: e.id,
          label: e.nom,
          quantity: 1,
          pricePerUnit: price,
          total: price,
          partAssurance: price - partPatient,
          partPatient: partPatient
        };
      }),
      assurance,
      totalBrut: totals.gross,
      partAssurance: totals.insurance,
      netAPayer: totals.net,
      montantRecu: paymentStatus === 'PAID' ? montantRecu : 0,
      reliquat: paymentStatus === 'PAID' ? reliquat : 0,
      caissierId: currentUser.id,
      caissierNom: currentUser.fullName,
      statut: paymentStatus,
      paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined
    });
    
    setLastTicket(ticket);
    setShowTicket(true);
    
    setSelectedExams([]);
    setSelectedPatient(null);
    setMontantRecu(0);
    setIsSummaryOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 h-[calc(100vh-100px)]">
      {/* Left Side: Exam Selection */}
      <div className="flex-1 flex flex-col space-y-3 md:space-y-4 overflow-hidden">
        <div className="bg-[var(--bg-secondary)] p-3 md:p-4 rounded-2xl md:rounded-[2rem] shadow-sm border border-[var(--border-color)] space-y-2 md:space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={16} md:size={18} />
            <input type="text" placeholder="RECHERCHER EXAMEN..." className="w-full pl-10 pr-4 py-2.5 md:py-3.5 bg-[var(--bg-primary)] rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 p-1 bg-[var(--bg-primary)] rounded-xl overflow-x-auto scrollbar-hide">
            {Object.values(AssuranceType).map(a => (
              <button key={a} onClick={() => setAssurance(a)} className={`flex-1 px-3 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${assurance === a ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20' : 'text-[var(--text-secondary)]/60 hover:bg-[var(--bg-secondary)]'}`}>{a}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pr-1 md:pr-2">
          {(Object.entries(examsByCategory) as [string, LabExam[]][]).map(([category, exams]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-0.5 h-3 bg-[var(--accent-color)]/20 rounded-full"></div>
                <h3 className="text-[11px] md:text-[12px] font-semibold text-[var(--text-secondary)]/60 uppercase tracking-widest">{category}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {exams.map(exam => {
                  const isSelected = selectedExams.find(e => e.id === exam.id);
                  return (
                    <button 
                      key={exam.id} 
                      onClick={() => toggleExam(exam)} 
                      className={`aspect-square p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border-2 text-center transition-all duration-500 group flex flex-col items-center justify-center gap-2 md:gap-4 ${
                        isSelected 
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 shadow-xl shadow-[var(--accent-color)]/10 scale-[1.05]' 
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/30 hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-3xl flex items-center justify-center transition-all duration-500 ${
                        isSelected 
                          ? 'bg-[var(--accent-color)] text-white rotate-6 shadow-lg shadow-[var(--accent-color)]/30' 
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]/30 group-hover:bg-[var(--accent-color)]/10 group-hover:text-[var(--accent-color)] group-hover:-rotate-3'
                      }`}>
                        <FlaskConical size={isSelected ? 32 : 24} md:size={isSelected ? 48 : 32} strokeWidth={1.5} />
                      </div>
                      <div className="w-full">
                        <p className={`font-black uppercase text-[var(--text-primary)] leading-tight mb-1 line-clamp-2 tracking-tighter transition-colors ${isSelected ? 'text-[var(--accent-color)]' : ''} ${isSelected ? 'text-[10px] md:text-sm' : 'text-[9px] md:text-xs'}`}>{exam.nom}</p>
                        <p className="text-[10px] md:text-base font-black text-[var(--accent-color)]/80 tracking-tighter">
                          {(assurance === AssuranceType.INAM ? exam.prixInam : assurance === AssuranceType.AMU ? exam.prixAmu : exam.prix || 0).toLocaleString()} F
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Summary / Invoice (Desktop: Always visible, Mobile: Modal) */}
      <div className={`fixed inset-0 z-50 lg:static lg:z-auto lg:w-96 flex flex-col ${isSummaryOpen ? 'flex' : 'hidden lg:flex'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSummaryOpen(false)}></div>
        <div className="relative w-full h-full lg:h-auto lg:rounded-[2.5rem] bg-[var(--bg-secondary)] shadow-2xl lg:shadow-xl lg:border border-[var(--border-color)] flex flex-col animate-slide-in-right lg:animate-none overflow-hidden text-[var(--text-primary)]">
           
           {/* Header */}
           <div className="p-4 lg:p-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] z-10 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase text-[var(--accent-color)] tracking-widest flex items-center gap-2">
                  <Layers size={18} />
                  Facture Labo
                </h2>
                <p className="text-[10px] font-bold text-[var(--text-secondary)]/60 mt-1">{selectedExams.length} examen(s) sélectionné(s)</p>
              </div>
              <button onClick={() => setIsSummaryOpen(false)} className="lg:hidden p-2 bg-[var(--bg-primary)] rounded-full text-[var(--text-secondary)]"><X size={20}/></button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[var(--bg-primary)]/30">
              <PatientSelector 
                selectedPatientId={selectedPatient?.id} 
                onSelect={setSelectedPatient} 
              />
              
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-2 shadow-sm border border-[var(--border-color)] space-y-1">
                 {selectedExams.length === 0 ? (
                   <div className="py-8 text-center text-[var(--text-secondary)]/30 text-xs font-bold italic">Aucun examen sélectionné</div>
                 ) : (
                   selectedExams.map(e => (
                     <div key={e.id} className="flex justify-between items-center p-3 hover:bg-[var(--bg-primary)] rounded-xl group transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-[10px] font-black uppercase truncate text-[var(--text-primary)]">{e.nom}</p>
                          <p className="text-[10px] font-bold text-[var(--accent-color)]">{(assurance === AssuranceType.INAM ? e.prixInam : assurance === AssuranceType.AMU ? e.prixAmu : e.prix || 0).toLocaleString()} F</p>
                        </div>
                        <button onClick={() => toggleExam(e)} className="text-[var(--text-secondary)]/30 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14}/></button>
                     </div>
                   ))
                 )}
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest">Total Net</span>
                    <span className="text-2xl font-black text-[var(--accent-color)] tracking-tighter">{totals.net.toLocaleString()} F</span>
                 </div>

                 <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)]/40 tracking-widest ml-1">Montant Reçu</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-black text-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] transition-colors"
                        placeholder="0"
                        value={montantRecu || ''}
                        onChange={(e) => setMontantRecu(Number(e.target.value))}
                      />
                      <div className="px-3 py-3 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center font-black text-[10px] text-[var(--text-secondary)]/40">FCFA</div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[1000, 2000, 5000, 10000].map(amt => (
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
                            className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${paymentMethod === method ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/80'}`}
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
                      <span className="text-xl font-black tracking-tighter">{(montantRecu - totals.net).toLocaleString()} F</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Footer Actions */}
           <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
              <button 
                onClick={handleCheckout} 
                disabled={!selectedPatient || selectedExams.length === 0} 
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${!selectedPatient || selectedExams.length === 0 ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)]/40 cursor-not-allowed' : montantRecu >= totals.net ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-[var(--accent-color)] text-white shadow-[var(--accent-color)]/30 hover:bg-[var(--accent-color)]/90'}`}
              >
                {montantRecu >= totals.net ? <Check size={18} /> : <Layers size={18} />}
                {montantRecu >= totals.net ? "ENCAISSER & VALIDER" : "ENVOYER EN CAISSE"}
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setIsSummaryOpen(true)} 
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-royal text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <div className="relative">
          <Layers size={24} />
          {selectedExams.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">{selectedExams.length}</span>}
        </div>
      </button>

      {showTicket && lastTicket && <TicketModal ticket={lastTicket} onClose={() => setShowTicket(false)} />}
    </div>
  );
};

export default LaboratoryModule;
