import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Printer, CreditCard, CheckCircle, FileText, 
  Plus, Trash2, User, Calendar, DollarSign, Filter, Download, 
  Share2, ArrowLeft, Edit, Phone, MapPin, X, Eye, AlertCircle, ScanLine
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Ticket, AssuranceType, TransactionItem, UserRole, Patient } from '../../types';
import { useReactToPrint } from 'react-to-print';
import PrintableTicket from '../Common/PrintableTicket';
import PrintableA5 from '../Common/PrintableA5';
import PrintableMoneyReceipt from '../Common/PrintableMoneyReceipt';

const getTicketTypeLabel = (type: string) => {
  switch (type) {
    case 'PHARMACY': return 'PHARMACIE';
    case 'CONSULTATION': return 'CONSULTATION';
    case 'NURSING': return 'SOINS INFIRMIERS';
    case 'LABORATORY': return 'LABORATOIRE';
    default: return type;
  }
};

const BillingModule: React.FC = () => {
  const { tickets, updateTicketStatus, currentUser, patients } = useStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'TICKET' | 'MONEY'>('MONEY');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (activeTab === 'PENDING' && t.statut !== 'PENDING') return false;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        t.numero.toLowerCase().includes(searchLower) ||
        t.patientNom.toLowerCase().includes(searchLower)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, activeTab, searchTerm]);

  const handleValidatePayment = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowPaymentModal(true);
  };

  const confirmPayment = (amountReceived: number, paymentMethod: string) => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, 'PAID', {
      montantRecu: amountReceived,
      reliquat: amountReceived - selectedTicket.netAPayer,
      paymentMethod: paymentMethod as any,
      caissierId: currentUser?.id || 'sys',
      caissierNom: currentUser?.fullName || 'System'
    });
    setShowPaymentModal(false);
    // After payment, show print modal
    setShowPrintModal(true);
  };

  const selectedTickets = useMemo(() => {
    if (selectedTicketIds.length > 0) {
      return tickets.filter(t => selectedTicketIds.includes(t.id));
    }
    if (selectedTicket) return [selectedTicket];
    return [];
  }, [tickets, selectedTicketIds, selectedTicket]);

  const toggleTicketSelection = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    if (selectedTicketIds.length === 0) return;
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)] pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter neon-text text-[var(--text-primary)]">Facturation & Paiements</h1>
          <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Gestion des transactions et impressions</p>
        </div>

        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)]">
          {selectedTicketIds.length > 0 && (
            <button 
              onClick={handlePrintSelected}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mr-2 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Printer size={14} />
              Imprimer Sélection ({selectedTicketIds.length})
            </button>
          )}
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ALL' ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            Tous les Documents
          </button>
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            <AlertCircle size={14} />
            Gestion des Impayés
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
          <input 
            type="text" 
            className="w-full pl-12 pr-4 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none border border-[var(--border-color)] focus:border-[var(--accent-color)] transition-all"
            placeholder="RECHERCHER PAR N° OU PATIENT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-[var(--accent-color)] mb-1">Total Impayés</p>
          <p className="text-2xl font-black text-[var(--accent-color)]">
            {tickets.filter(t => t.statut === 'PENDING').reduce((acc, t) => acc + t.netAPayer, 0).toLocaleString()} F
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl md:rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-[var(--border-color)] bg-transparent"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTicketIds(filteredTickets.map(t => t.id));
                      } else {
                        setSelectedTicketIds([]);
                      }
                    }}
                    checked={selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0}
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">N° Doc</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Patient</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Type</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Montant</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-center">Statut</th>
                <th className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-[var(--border-color)] bg-transparent"
                      checked={selectedTicketIds.includes(ticket.id)}
                      onChange={() => toggleTicketSelection(ticket.id)}
                    />
                  </td>
                  <td className="p-4 text-xs font-bold text-[var(--text-primary)] whitespace-nowrap">
                    {new Date(ticket.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-xs font-mono font-black text-[var(--accent-color)] uppercase">
                    {ticket.numero}
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-black text-[var(--text-primary)] uppercase truncate max-w-[150px]">{ticket.patientNom}</p>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 truncate max-w-[150px]">{ticket.assurance || 'Plein Tarif'}</p>
                  </td>
                  <td className="p-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                    {getTicketTypeLabel(ticket.type)}
                  </td>
                  <td className="p-4 text-sm font-mono font-medium text-[var(--text-primary)] text-right">
                    {(ticket.netAPayer || 0).toLocaleString()} F
                  </td>
                  <td className="p-4 text-center">
                    {ticket.statut === 'PAID' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-200">
                        PAYÉ
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-red-200">
                        IMPAYÉ
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {ticket.statut === 'PENDING' ? (
                        <button 
                          onClick={() => handleValidatePayment(ticket)}
                          className="p-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-color)]/90 transition-all shadow-md shadow-[var(--accent-color)]/20"
                          title="Valider Paiement"
                        >
                          <CreditCard size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setSelectedTicket(ticket); setShowPrintModal(true); }}
                          className="p-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-all"
                          title="Imprimer"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedTicket(ticket); setShowPrintModal(true); }}
                        className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-lg hover:text-[var(--text-primary)] transition-all"
                        title="Aperçu"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[var(--border-color)]">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className="p-3 bg-[var(--bg-primary)]/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-mono font-black text-[var(--accent-color)]">{ticket.numero}</p>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase">{ticket.patientNom}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{(ticket.netAPayer || 0).toLocaleString()} F</p>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold">{new Date(ticket.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2">
                  {ticket.statut === 'PAID' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-black uppercase border border-emerald-200">PAYÉ</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[8px] font-black uppercase border border-red-200">IMPAYÉ</span>
                  )}
                  <span className="text-[8px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest">{getTicketTypeLabel(ticket.type)}</span>
                </div>
                <div className="flex gap-1.5">
                  {ticket.statut === 'PENDING' ? (
                    <button onClick={() => handleValidatePayment(ticket)} className="p-2 bg-[var(--accent-color)] text-white rounded-lg"><CreditCard size={14} /></button>
                  ) : (
                    <button onClick={() => { setSelectedTicket(ticket); setShowPrintModal(true); }} className="p-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg"><Printer size={14} /></button>
                  )}
                  <button onClick={() => { setSelectedTicket(ticket); setShowPrintModal(true); }} className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg"><Eye size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px]">
            Aucun document trouvé
          </div>
        )}
      </div>

      {/* Payment Validation Modal */}
      {showPaymentModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-[var(--border-color)] shadow-2xl animate-scale-in my-auto">
            <div className="p-6 md:p-8 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Validation Paiement</h3>
                <p className="text-[8px] md:text-[9px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-widest mt-1">Ticket #{selectedTicket.numero}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="text-center">
                <p className="text-[9px] md:text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] mb-2">Montant à Encaisser</p>
                <p className="text-3xl md:text-5xl font-mono font-medium text-[var(--text-primary)] tracking-tighter">{(selectedTicket.netAPayer || 0).toLocaleString()} <span className="text-sm md:text-lg text-[var(--text-secondary)]/40">F</span></p>
              </div>

              <div className="space-y-4 md:space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest ml-1">Mode de Paiement</label>
                  <div className="relative">
                    <select 
                      id="payment-method"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl p-3 md:p-4 text-[var(--text-primary)] font-black uppercase outline-none focus:border-[var(--accent-color)] transition-all appearance-none shadow-sm"
                    >
                      <option value="ESPECES" className="text-black">ESPECES</option>
                      <option value="TMONEY" className="text-black">TMONEY</option>
                      <option value="FLOOZ" className="text-black">FLOOZ</option>
                      <option value="CHEQUE" className="text-black">CHEQUE</option>
                      <option value="VIREMENT" className="text-black">VIREMENT</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest ml-1">Montant Reçu</label>
                  <input 
                    id="amount-received"
                    type="number" 
                    defaultValue={selectedTicket.netAPayer}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl p-3 md:p-4 text-[var(--text-primary)] font-mono font-medium text-xl md:text-2xl outline-none focus:border-[var(--accent-color)] transition-all text-center shadow-sm"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-[var(--bg-primary)] pt-4 pb-2 md:static md:p-0">
                <button 
                  onClick={() => {
                    const method = (document.getElementById('payment-method') as HTMLSelectElement).value;
                    const received = Number((document.getElementById('amount-received') as HTMLInputElement).value);
                    confirmPayment(received, method);
                  }}
                  className="w-full py-4 md:py-6 bg-[var(--accent-color)] text-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl uppercase tracking-tighter shadow-xl shadow-[var(--accent-color)]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirmer le Règlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-primary)] w-full max-w-4xl h-[95vh] md:h-[90vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-[var(--border-color)] shadow-2xl flex flex-col animate-scale-in my-auto">
            <div className="p-4 md:p-8 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 shrink-0">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Aperçu Impression</h3>
                  <p className="text-[8px] md:text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Format: {printFormat}</p>
                </div>
                <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl md:rounded-2xl border border-[var(--border-color)] shadow-xl w-full md:w-auto">
                  <button 
                    onClick={() => setPrintFormat('MONEY')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${printFormat === 'MONEY' ? 'bg-[var(--accent-color)] text-white shadow-lg scale-105' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-color)]/5'}`}
                  >
                    <DollarSign size={14} />
                    <span>Reçu</span>
                  </button>
                  <button 
                    onClick={() => setPrintFormat('TICKET')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${printFormat === 'TICKET' ? 'bg-[var(--accent-color)] text-white shadow-lg scale-105' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <ScanLine size={14} />
                    <span>Ticket</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <button 
                  onClick={() => handlePrint()}
                  className="flex-1 md:flex-none px-6 py-3 bg-[var(--accent-color)] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--accent-color)]/90 transition-all shadow-lg shadow-[var(--accent-color)]/20"
                >
                  <Printer size={16} /> Imprimer
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-2 md:p-3 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-red-400 rounded-xl md:rounded-2xl transition-all"><X size={24}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
              <div ref={printRef} className="shadow-2xl bg-white origin-top transition-transform scale-[0.85] sm:scale-100 print-content">
                {printFormat === 'MONEY' ? (
                  <PrintableMoneyReceipt tickets={selectedTickets} />
                ) : (
                  <PrintableTicket ticket={selectedTickets[0]} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingModule;
