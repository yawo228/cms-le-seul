import React from 'react';
import { Ticket, Patient } from '../../types';
import { useStore } from '../../store/useStore';

interface MoneyReceiptProps {
  tickets: Ticket[];
  patient?: Patient;
}

const PrintableMoneyReceipt: React.FC<MoneyReceiptProps> = ({ tickets, patient }) => {
  const { settings } = useStore();
  
  const totalAmount = tickets.reduce((acc, t) => acc + t.netAPayer, 0);
  const firstTicket = tickets[0];
  const date = firstTicket ? new Date(firstTicket.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const ticketNumbers = tickets.map(t => t.numero).join(', ');
  
  // Group all items from all tickets
  const allItems = tickets.flatMap(t => t.items);
  const itemsSummary = allItems.map(item => `${item.quantity}x ${item.label}`).join(', ');

  return (
    <div className="w-[210mm] h-[148mm] bg-white text-black font-serif p-0 relative overflow-hidden border border-gray-200 shadow-lg print:shadow-none print:border-none">
      {/* Top Header Section */}
      <div className="flex justify-between p-8 pb-4 pr-24">
        <div className="flex gap-6 items-start">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
          ) : (
            <div className="w-20 h-20 bg-blue-900 text-white rounded-full flex items-center justify-center font-black text-3xl border-4 border-blue-100">
              {settings.establishmentName?.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-blue-900 uppercase tracking-tight leading-none mb-2">
              {settings.establishmentName || 'CMS LE SEUL'}
            </h1>
            <p className="text-sm text-gray-600 font-sans leading-tight max-w-md">
              Adresse : {settings.address || 'Lomé, Togo'}<br />
              Téléphone : {settings.phone || '+228 90 00 00 00'}<br />
              Email : {settings.email || 'contact@cmsleseul.tg'}
            </p>
          </div>
        </div>
        
        <div className="text-right font-sans space-y-3 pt-2">
          <div className="flex items-center justify-end gap-3">
            <span className="text-base font-bold text-gray-500 uppercase italic">N°</span>
            <span className="border-b-2 border-gray-400 w-48 text-center font-mono font-bold text-blue-900 text-lg">
              {firstTicket?.numero || '---'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-base font-bold text-gray-500 uppercase italic">Date :</span>
            <span className="border-b-2 border-gray-400 w-48 text-center font-mono font-bold text-blue-900 text-lg">
              {date}
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Side Bar */}
      <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-b from-blue-700 to-blue-900 flex items-center justify-center">
        <div className="rotate-90 whitespace-nowrap text-white font-bold text-2xl uppercase tracking-[0.4em] opacity-80">
          REÇU DE PAIEMENT
        </div>
      </div>

      {/* Main Content Body */}
      <div className="mx-8 mt-4 p-8 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-8 pr-24">
        <div className="flex items-end gap-6">
          <span className="text-base font-bold text-blue-900 italic whitespace-nowrap">Reçu de M./Mme</span>
          <div className="flex-1 border-b-2 border-dotted border-blue-300 pb-1 font-bold text-xl text-blue-900 px-3">
            {firstTicket?.patientNom || patient?.nom || '................................................................................'}
          </div>
        </div>

        <div className="flex items-end gap-6">
          <span className="text-base font-bold text-blue-900 italic whitespace-nowrap">La somme de Francs CFA</span>
          <div className="flex-1 border-b-2 border-dotted border-blue-300 pb-1 font-bold text-xl text-blue-900 px-3">
            {totalAmount.toLocaleString('fr-FR')} F (Net à Payer)
          </div>
        </div>

        <div className="flex items-end gap-6">
          <span className="text-base font-bold text-blue-900 italic whitespace-nowrap">Espèces/Chèque n°</span>
          <div className="w-64 border-b-2 border-dotted border-blue-300 pb-1 font-bold text-blue-900 px-3">
            {firstTicket?.paymentMethod || 'ESPÈCES'}
          </div>
          <span className="text-base font-bold text-blue-900 italic whitespace-nowrap">Banque</span>
          <div className="flex-1 border-b-2 border-dotted border-blue-300 pb-1 font-bold text-blue-900 px-3">
            ................................................................................
          </div>
        </div>

        <div className="flex items-end gap-6">
          <span className="text-base font-bold text-blue-900 italic whitespace-nowrap">Pour le compte de</span>
          <div className="flex-1 border-b-2 border-dotted border-blue-300 pb-1 font-bold text-blue-900 px-3 truncate">
            {itemsSummary || '................................................................................'}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="absolute bottom-10 left-8 right-32 flex justify-end items-end">
        <div className="text-center">
          <div className="w-64 border-b-2 border-gray-400 mb-3"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Signature</span>
        </div>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full h-3 bg-blue-900"></div>
      <div className="absolute bottom-3 left-0 w-40 h-8 bg-blue-700 rounded-tr-full"></div>
    </div>
  );
};

export default PrintableMoneyReceipt;
