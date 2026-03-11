import React from 'react';
import { Ticket } from '../../types';
import { useStore } from '../../store/useStore';

const getTicketTypeLabel = (type: string) => {
  switch (type) {
    case 'PHARMACY': return 'PHARMACIE';
    case 'CONSULTATION': return 'CONSULTATION';
    case 'NURSING': return 'SOINS INFIRMIERS';
    case 'LABORATORY': return 'LABORATOIRE';
    default: return type;
  }
};

const PrintableA5 = ({ ticket }: { ticket: Ticket }) => {
  const { settings, tickets } = useStore();
  const isPaid = ticket.statut === 'PAID';

  // Calculate previous unpaid balance for this patient
  const previousUnpaid = tickets
    .filter(t => t.patientId === ticket.patientId && t.id !== ticket.id && t.statut === 'PENDING')
    .reduce((acc, t) => acc + t.netAPayer, 0);

  return (
    <div className="p-12 max-w-[148mm] mx-auto !text-slate-800 font-sans h-[210mm] relative bg-white overflow-hidden flex flex-col border border-slate-200 shadow-sm print:mx-auto print:shadow-none print:border-none">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center !text-white font-black text-2xl">CMS</div>
          )}
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter !text-slate-900 leading-none mb-1">{settings.establishmentName || 'CMS LE SEUL'}</h1>
            <div className="space-y-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <p>{settings.address || 'Lomé, Togo'}</p>
              <p>Tél: {settings.phone || '+228 90 00 00 00'}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black !text-slate-900 uppercase tracking-tighter mb-1">{isPaid ? 'REÇU DE PAIEMENT' : 'FACTURE'}</h2>
          <div className="space-y-0.5">
            <p className="text-xs font-mono font-black !text-slate-900 uppercase tracking-widest">N° {ticket.numero}</p>
            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Date: {new Date(ticket.date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Informations Patient</p>
            <p className="font-black text-lg uppercase !text-slate-900 leading-tight">{ticket.patientNom}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Age: {ticket.patientAge} Ans | Assurance: {ticket.assurance || 'AUCUNE'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Type de Prestation</p>
            <p className="font-black text-lg uppercase !text-slate-900 leading-tight">{getTicketTypeLabel(ticket.type)}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Désignation</th>
              <th className="text-center py-3 text-[10px] font-black uppercase tracking-widest w-20">Qté</th>
              <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest w-28">P. Unitaire</th>
              <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ticket.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 text-[11px] font-bold text-slate-700 uppercase">{item.label}</td>
                <td className="py-4 text-center text-[11px] font-mono font-bold text-slate-500">{item.quantity}</td>
                <td className="py-4 text-right text-[11px] font-mono font-bold text-slate-500">{item.pricePerUnit.toLocaleString('fr-FR')}</td>
                <td className="py-4 text-right text-[11px] font-mono font-black text-slate-900">{item.total.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mt-8 pt-8 border-t-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div className="w-1/2 space-y-6">
            {previousUnpaid > 0 && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 inline-block">
                <p className="text-amber-600 font-black text-[10px] uppercase tracking-widest">Reliquat impayé : {previousUnpaid.toLocaleString('fr-FR')} F</p>
                <p className="text-[8px] font-bold text-amber-500 uppercase mt-0.5">Dettes antérieures à régulariser</p>
              </div>
            )}
            <div className="pt-4">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-12">Cachet et Signature</p>
              <div className="w-48 h-px bg-slate-200 border-dashed border-t"></div>
            </div>
          </div>
          <div className="w-1/2 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
              <span>Total Brut</span>
              <span className="font-mono">{ticket.totalBrut.toLocaleString('fr-FR')} F</span>
            </div>
            {ticket.partAssurance > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2">
                <span>Part Assurance ({ticket.assurance})</span>
                <span className="font-mono">-{ticket.partAssurance.toLocaleString('fr-FR')} F</span>
              </div>
            )}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center mt-4">
              <span className="font-black text-[10px] uppercase tracking-widest">Net à Payer</span>
              <div className="text-right">
                <span className="block font-mono font-black text-2xl tracking-tighter leading-none">{ticket.netAPayer.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
            {isPaid && (
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest px-4 pt-2">
                <span className="font-mono">Reçu: {ticket.montantRecu?.toLocaleString('fr-FR')} F</span>
                <span className="font-mono">Reliquat: {ticket.reliquat?.toLocaleString('fr-FR')} F</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">CMS LE SEUL • SYSTÈME DE GESTION MÉDICALE</p>
        <p className="text-[8px] font-bold italic">Bonne guérison !</p>
      </div>
    </div>
  );
};

export default PrintableA5;
