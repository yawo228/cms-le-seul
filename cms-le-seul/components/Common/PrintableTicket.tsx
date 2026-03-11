import React from 'react';
import { Ticket } from '../../types';
import { useStore } from '../../store/useStore';

const PrintableTicket = ({ ticket }: { ticket: Ticket }) => {
  const { settings } = useStore();
  const isPaid = ticket.statut === 'PAID';
  
  return (
    <div className="p-8 max-w-[72mm] mx-auto !text-black font-sans text-[10px] leading-tight relative bg-white print:p-10 print:w-[72mm] print:mx-auto print:shadow-none">
      <div className="text-center mb-4">
        {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 mx-auto mb-1.5 object-contain grayscale print:grayscale-0" />
        ) : (
            <div className="w-10 h-10 bg-black !text-white rounded-xl flex items-center justify-center font-black text-lg mx-auto mb-1.5">CMS</div>
        )}
        <h1 className="text-sm font-black uppercase mb-0.5 tracking-tighter !text-black">{settings.establishmentName || 'CMS LE SEUL'}</h1>
        <p className="uppercase text-[6px] font-bold tracking-widest mb-1 !text-black">Centre Médico-Social</p>
        <div className="border-b border-black w-2/3 mx-auto mb-1"></div>
        <p className="text-[7px] font-mono font-bold !text-black">{settings.phone || '+228 90 00 00 00'}</p>
      </div>

      <div className="mb-2 text-[8px] uppercase space-y-0.5 border-y border-black border-dashed py-1.5 !text-black">
        <div className="flex justify-between">
          <span>DATE :</span>
          <span className="font-mono">{new Date(ticket.date).toLocaleString('fr-FR')}</span>
        </div>
        <div className="flex justify-between">
          <span>N° :</span>
          <span className="font-mono font-bold">{ticket.numero}</span>
        </div>
        <div className="flex justify-between">
          <span>PATIENT :</span>
          <span className="font-bold truncate max-w-[130px]">{ticket.patientNom}</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between font-black text-[8px] uppercase mb-1 border-b border-black pb-1">
          <span>DÉSIGNATION</span>
          <span>TOTAL</span>
        </div>
        {ticket.items.map((item, i) => (
          <div key={i} className="flex justify-between text-[8px] mb-0.5">
            <span className="truncate max-w-[160px]">{item.quantity} x {item.label}</span>
            <span className="font-mono font-bold">{item.total.toLocaleString('fr-FR')}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-black border-dashed pt-1.5 space-y-1">
        <div className="flex justify-between items-end text-[8px]">
          <span className="font-bold">TOTAL BRUT :</span>
          <span className="font-mono font-bold">{ticket.totalBrut.toLocaleString('fr-FR')} F</span>
        </div>
        {ticket.partAssurance > 0 && (
          <div className="flex justify-between items-end text-[7px] italic">
            <span>PART ASSURANCE ({ticket.assurance}) :</span>
            <span className="font-mono">-{ticket.partAssurance.toLocaleString('fr-FR')} F</span>
          </div>
        )}
        <div className="flex justify-between items-end border-t border-black pt-1">
          <span className="font-black text-[10px]">NET À PAYER :</span>
          <span className="font-mono font-black text-xs">{ticket.netAPayer.toLocaleString('fr-FR')} F</span>
        </div>
        
        {isPaid && (
          <div className="space-y-0.5 pt-1 border-t border-black border-dotted mt-1">
            <div className="flex justify-between items-center text-[8px]">
              <span className="font-bold">REÇU :</span>
              <span className="font-mono font-bold">{(ticket.montantRecu || 0).toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between items-center text-[8px]">
              <span className="font-bold">RELIQUAT :</span>
              <span className="font-mono font-bold">{(ticket.reliquat || 0).toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-4 text-[7px] font-bold uppercase border-t border-black border-dashed pt-3 text-black">
        <p>Bonne guérison !</p>
      </div>
    </div>
  );
};

export default PrintableTicket;
