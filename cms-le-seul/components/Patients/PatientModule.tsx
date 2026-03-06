import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, FileText, XCircle, User, Calendar, Phone, Shield, Printer, Trash2
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { Patient, AssuranceType } from '../../types';
import PrintablePatientDossierA5 from '../Common/PrintablePatientDossierA5';

const PatientModule: React.FC = () => {
  const { patients, tickets, currentUser, deletePatient } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const filteredPatients = useMemo(() => 
    patients.filter(p => 
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.telephone && p.telephone.includes(searchTerm))
    ),
    [patients, searchTerm]
  );

  const handleOpenModal = (patient: Patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const getPatientHistory = (patientId: string) => {
    return tickets.filter(t => t.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handlePrintDossier = useReactToPrint({
    contentRef,
    documentTitle: `Dossier_${editingPatient?.nom}_${editingPatient?.prenom}`,
  });

  const handleDeletePatient = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier de ${name} ? Cette action est irréversible.`)) {
      deletePatient(id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tighter text-[var(--text-primary)] neon-text">Dossiers Patients</h1>
          <p className="text-[var(--text-secondary)]/60 font-semibold uppercase tracking-widest text-[8px] md:text-[9px] mt-1">Consultation & Historique Médical</p>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl min-h-[600px] border border-[var(--border-color)]">
        <div className="mb-6 relative">
           <Search className="absolute left-4 top-4 text-[var(--text-secondary)]/40" size={20} />
           <input 
             type="text" 
             className="w-full pl-12 pr-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 outline-none focus:border-royal/50 transition-colors"
             placeholder="Rechercher un patient (Nom, Prénom, Tél)..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--border-color)] p-3 md:p-6 rounded-xl md:rounded-[2rem] relative group overflow-hidden hover:bg-[var(--bg-primary)]/60 transition-all duration-300 shadow-sm flex items-center md:flex-col md:items-start gap-4">
              <div className="absolute top-0 right-0 p-2 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex gap-2">
                {currentUser?.role === 'ADMIN' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePatient(patient.id, `${patient.nom} ${patient.prenom}`);
                    }} 
                    className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/40 text-red-500 transition-colors"
                    title="Supprimer le patient"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => handleOpenModal(patient)} className="p-2 bg-[var(--accent-color)]/20 rounded-xl hover:bg-[var(--accent-color)]/40 text-[var(--text-primary)] transition-colors">
                  <FileText size={16} />
                </button>
              </div>

              <div className="flex items-center md:items-start gap-3 md:gap-4 w-full">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-black shadow-lg shrink-0 ${patient.sexe === 'M' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                  {patient.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm md:text-lg uppercase tracking-tight text-[var(--text-primary)] truncate">{patient.nom} {patient.prenom}</h3>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]/50 text-[10px] md:text-xs font-bold mt-0.5 md:mt-1">
                    <span className="bg-[var(--accent-color)]/10 px-1.5 py-0.5 rounded-md">{patient.age} Ans</span>
                    <span>•</span>
                    <span>{patient.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                  </div>
                </div>
                <div className="md:hidden flex items-center gap-1">
                  {currentUser?.role === 'ADMIN' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePatient(patient.id, `${patient.nom} ${patient.prenom}`);
                      }} 
                      className="p-2 text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button onClick={() => handleOpenModal(patient)} className="p-2 text-[var(--text-secondary)]/40">
                    <FileText size={18} />
                  </button>
                </div>
              </div>

              <div className="hidden md:block w-full space-y-3 border-t border-[var(--border-color)] pt-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Phone size={14} className="text-[var(--text-secondary)]/40" />
                  <span className="font-mono">{patient.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Shield size={14} className="text-[var(--text-secondary)]/40" />
                  <span className="uppercase text-xs font-bold tracking-wider">{patient.assuranceType.replace('_', ' ')}</span>
                  {patient.numeroAssurance && <span className="text-[10px] bg-[var(--accent-color)]/10 px-2 rounded text-[var(--text-secondary)]/40">{patient.numeroAssurance}</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <FileText size={14} className="text-[var(--text-secondary)]/40" />
                  <span className="text-xs">{getPatientHistory(patient.id).length} Consultations</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]/30">
            <User size={64} className="mb-4 opacity-50" />
            <p className="font-black uppercase tracking-widest">Aucun patient trouvé</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-2xl md:rounded-3xl overflow-hidden animate-scale-in border border-[var(--border-color)] shadow-2xl my-auto">
            <div className="p-4 md:p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)]/50">
              <div className="flex items-center gap-3 md:gap-4">
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight neon-text">
                  Détails Patient
                </h3>
                <button 
                  onClick={handlePrintDossier}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/40 text-[var(--text-primary)] rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all border border-[var(--border-color)]"
                >
                  <Printer size={14} /> <span className="hidden xs:inline">Imprimer Dossier A5</span><span className="xs:hidden">A5</span>
                </button>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)]/40 hover:text-red-400 transition-colors"><XCircle size={24} /></button>
            </div>
            
            <div className="p-5 md:p-8 space-y-5 md:space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-4 mb-4 md:mb-6">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black shadow-lg ${editingPatient.sexe === 'M' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                    {editingPatient.nom.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">{editingPatient.nom} {editingPatient.prenom}</h2>
                    <p className="text-[var(--text-secondary)]/60 font-bold uppercase text-[10px] md:text-xs">{editingPatient.age} Ans • {editingPatient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                  </div>
               </div>

               <div className="space-y-3 md:space-y-4">
                 <h4 className="text-[10px] md:text-xs font-black text-[var(--text-secondary)]/40 uppercase tracking-widest border-b border-[var(--border-color)] pb-2">Historique des Soins</h4>
                 {getPatientHistory(editingPatient.id).length === 0 ? (
                   <p className="text-[var(--text-secondary)]/30 text-xs italic">Aucun historique disponible.</p>
                 ) : (
                   getPatientHistory(editingPatient.id).map(ticket => (
                     <div key={ticket.id} className="bg-[var(--bg-primary)]/40 p-3 md:p-4 rounded-xl border border-[var(--border-color)]/20 hover:bg-[var(--bg-primary)]/60 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                         <span className={`px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-black uppercase ${ticket.type === 'CONSULTATION' ? 'bg-blue-500/20 text-blue-600' : 'bg-emerald-500/20 text-emerald-600'}`}>{ticket.type}</span>
                         <span className="text-[9px] md:text-[10px] text-[var(--text-secondary)]/40 font-mono">{new Date(ticket.date).toLocaleDateString()}</span>
                       </div>
                       <div className="space-y-1">
                         {ticket.items.map((item, idx) => (
                           <p key={idx} className="text-[11px] md:text-xs text-[var(--text-primary)]/80 font-bold uppercase">• {item.label}</p>
                         ))}
                       </div>
                       <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[var(--border-color)]/20 flex flex-col sm:flex-row sm:justify-between gap-1 text-[9px] md:text-[10px] text-[var(--text-secondary)]/50 uppercase">
                         <span>Prat: <span className="text-[var(--text-primary)]">{ticket.praticienNom || 'N/A'}</span></span>
                         <span>Caisse: <span className="text-[var(--text-primary)]">{ticket.caissierNom || 'N/A'}</span></span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={contentRef}>
          {editingPatient && (
            <PrintablePatientDossierA5 
              patient={editingPatient} 
              history={getPatientHistory(editingPatient.id)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientModule;
