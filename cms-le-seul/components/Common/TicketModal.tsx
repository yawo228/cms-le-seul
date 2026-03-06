
import React, { useState, useRef } from 'react';
import { X, Printer, CheckCircle, FileText, Receipt } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Ticket } from '../../types';
import { useStore } from '../../store/useStore';
import PrintableTicket from './PrintableTicket';
import PrintableA5 from './PrintableA5';

interface TicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose }) => {
  const { settings } = useStore();
  const [viewMode, setViewMode] = useState<'TICKET' | 'A5'>('TICKET');
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Ticket_${ticket.numero}`,
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block print:static overflow-y-auto print-container">
      <div className={`bg-[var(--bg-secondary)] rounded-[2.5rem] shadow-2xl w-full ${viewMode === 'A5' ? 'max-w-3xl' : 'max-w-md'} overflow-hidden animate-in zoom-in duration-300 transition-all print:shadow-none print:w-full print:max-w-none print:rounded-none my-8 print:my-0 border border-[var(--border-color)]`}>
        {/* Header with Format Selection */}
        <div className="p-6 bg-[var(--bg-primary)]/50 border-b border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase text-xs text-[var(--text-secondary)]/40 tracking-widest">Validation Réussie</h3>
              <p className="font-black text-[var(--text-primary)] uppercase tracking-tighter">Ticket N° {ticket.numero}</p>
            </div>
          </div>

          {/* Format Selector - Segmented Control */}
          <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-2xl w-full sm:w-auto border border-[var(--border-color)]">
            <button 
              onClick={() => setViewMode('TICKET')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${viewMode === 'TICKET' ? 'bg-royal text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <Receipt size={16} />
              <span>Ticket</span>
            </button>
            <button 
              onClick={() => setViewMode('A5')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${viewMode === 'A5' ? 'bg-royal text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <FileText size={16} />
              <span>Format A5</span>
            </button>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors text-[var(--text-secondary)]">
            <X size={24} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-8 overflow-y-auto max-h-[70vh] bg-[var(--bg-primary)]/30 flex justify-center print:p-0 print:overflow-visible print:max-h-none print:bg-white">
          <div ref={contentRef} className={`bg-white shadow-2xl border border-[var(--border-color)] ${viewMode === 'TICKET' ? 'w-[72mm]' : 'w-[148mm]'} print:shadow-none print:border-none print:w-full transition-all duration-500`}>
            {viewMode === 'TICKET' ? (
              <PrintableTicket ticket={ticket} />
            ) : (
              <PrintableA5 ticket={ticket} />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-[var(--bg-primary)]/50 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-3 no-print">
          <button onClick={onClose} className="flex-1 px-6 py-4 border border-[var(--border-color)] rounded-2xl font-black text-[var(--text-secondary)] text-[11px] uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-all active:scale-95">
            Fermer la fenêtre
          </button>
          <button onClick={() => handlePrint()} className="flex-[2] px-6 py-4 bg-royal text-white rounded-2xl font-black flex items-center justify-center space-x-3 text-[11px] uppercase tracking-widest shadow-xl shadow-royal/20 hover:bg-royal/90 transition-all active:scale-95">
            <Printer size={20} />
            <span>Lancer l'impression</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export default TicketModal;
