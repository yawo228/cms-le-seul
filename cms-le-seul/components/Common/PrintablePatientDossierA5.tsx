import React from 'react';
import { Patient, Ticket } from '../../types';
import { useStore } from '../../store/useStore';

interface PrintablePatientDossierA5Props {
  patient: Patient;
  history: Ticket[];
}

const PrintablePatientDossierA5: React.FC<PrintablePatientDossierA5Props> = ({ patient, history }) => {
  const { settings } = useStore();

  return (
    <div className="p-8 max-w-[148mm] mx-auto !text-slate-800 font-sans h-[210mm] relative bg-white overflow-hidden flex flex-col">
      {/* Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-royal"></div>

      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 pt-4">
        <div className="flex items-center gap-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-royal rounded-xl flex items-center justify-center !text-white font-black text-2xl shadow-lg shadow-royal/20">CMS</div>
          )}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter !text-slate-900 leading-none mb-1">{settings.establishmentName || 'CMS LE SEUL'}</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-royal">Centre Médico-Social</p>
            <div className="mt-2 space-y-0.5 text-[9px] font-bold text-slate-500">
              <p>{settings.address || 'Lomé, Togo'}</p>
              <p>Tél: {settings.phone || '+228 90 00 00 00'}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-200 uppercase tracking-tighter mb-1">DOSSIER MÉDICAL</h2>
          <div className="space-y-1">
            <p className="text-xs font-black !text-slate-900">ID: {patient.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Édité le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-2">Identité du Patient</p>
            <h2 className="text-2xl font-black uppercase text-white leading-tight mb-2">{patient.nom} {patient.prenom}</h2>
            <div className="flex flex-wrap gap-3">
              <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{patient.age} ANS</span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{patient.sexe === 'M' ? 'HOMME' : 'FEMME'}</span>
            </div>
          </div>
          <div className="text-right flex flex-col justify-between">
            <div>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Couverture Santé</p>
              <p className="font-black text-sm uppercase text-emerald-400">{patient.assuranceType.replace('_', ' ')}</p>
              {patient.numeroAssurance && <p className="text-[10px] font-bold text-white/60 mt-1">N° {patient.numeroAssurance}</p>}
            </div>
            <div className="mt-4">
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Contact</p>
              <p className="text-xs font-bold text-white tracking-wider">{patient.telephone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical History Section */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-royal/10 rounded-lg flex items-center justify-center text-royal">
            <span className="font-black text-xs">01</span>
          </div>
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Historique des Consultations & Actes</h3>
        </div>
        
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Aucun antécédent enregistré</p>
            </div>
          ) : (
            history.slice(0, 5).map((ticket, idx) => (
              <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-royal/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-royal/10 text-royal rounded-md">{ticket.type}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Réf: {ticket.numero}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{new Date(ticket.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="space-y-1 pl-2 border-l-2 border-slate-100 group-hover:border-royal/30 transition-colors">
                  {ticket.items.map((item, i) => (
                    <p key={i} className="text-[11px] font-black text-slate-700 uppercase leading-tight">{item.label}</p>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Praticien: {ticket.praticienNom || 'N/A'}</span>
                  <span>Caissier: {ticket.caissierNom}</span>
                </div>
              </div>
            ))
          )}
          {history.length > 5 && (
            <div className="text-center py-2">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
                + {history.length - 5} autres entrées dans le dossier
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Signature Area */}
      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="flex justify-between items-end">
          <div className="max-w-[60%]">
            <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.3em] mb-1">CMS LE SEUL • SYSTÈME D'INFORMATION MÉDICALE</p>
            <p className="text-[7px] font-bold text-slate-400 italic leading-tight">Ce document est confidentiel et protégé par le secret médical. Toute reproduction non autorisée est interdite.</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-10">Cachet & Signature</p>
            <div className="w-40 h-px bg-slate-200 border-dashed border-t"></div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PrintablePatientDossierA5;
