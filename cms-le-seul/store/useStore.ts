
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, ref, onValue, set as dbSet, update as dbUpdate } from '../src/firebase-config';
import { 
  Medicament, LabExam, CareAct, Practitioner, User, Ticket, 
  AssuranceType, UserRole, TransactionType, StockMovement, Patient, ConsultationType, Consumable,
  CashSession, AuditLog, CashDisbursement
} from '../types';

interface AppState {
  currentUser: User | null;
  users: User[];
  medicaments: Medicament[];
  medicamentCategories: string[];
  consumables: Consumable[];
  labExams: LabExam[];
  careActs: CareAct[];
  consultationTypes: ConsultationType[];
  practitioners: Practitioner[];
  tickets: Ticket[];
  stockMovements: StockMovement[];
  patients: Patient[];
  settings: {
    logoUrl?: string;
    establishmentName?: string;
    address?: string;
    phone?: string;
    email?: string;
    theme?: 'light' | 'dark';
    loginButtonColor?: string;
  };
  
  login: (username: string, pin: string) => { success: boolean, message?: string };
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetSettings: () => void;
  
  addPractitioner: (p: Practitioner) => void;
  updatePractitioner: (id: string, updates: Partial<Practitioner>) => void;
  deletePractitioner: (id: string) => void;
  
  updateMedicament: (id: string, updates: Partial<Medicament>) => void;
  addMedicament: (med: Medicament) => void;
  deleteMedicament: (id: string) => void;

  addMedicamentCategory: (category: string) => void;

  addConsumable: (c: Consumable) => void;
  updateConsumable: (id: string, updates: Partial<Consumable>) => void;
  deleteConsumable: (id: string) => void;
  
  updateLabExam: (id: string, updates: Partial<LabExam>) => void;
  addLabExam: (exam: LabExam) => void;
  deleteLabExam: (id: string) => void;

  updateCareAct: (id: string, updates: Partial<CareAct>) => void;
  addCareAct: (act: CareAct) => void;
  deleteCareAct: (id: string) => void;

  addConsultationType: (consultation: ConsultationType) => void;
  updateConsultationType: (id: string, updates: Partial<ConsultationType>) => void;
  deleteConsultationType: (id: string) => void;

  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;

  adjustStock: (id: string, qty: number, type: StockMovement['type'], options?: { description?: string, dateExpiration?: string, lotNumber?: string }) => void;
  
  createTicket: (ticket: Omit<Ticket, 'id' | 'numero' | 'date'>) => Ticket;
  updateTicketStatus: (id: string, status: Ticket['statut'], paymentDetails?: { montantRecu: number, reliquat: number, paymentMethod?: Ticket['paymentMethod'], caissierId?: string, caissierNom?: string }) => void;
  
  cashSessions: CashSession[];
  auditLogs: AuditLog[];

  // Session Management
  openSession: (openingAmount: number) => { success: boolean, message?: string };
  closeSession: (closingAmount: number) => void;
  addDisbursement: (amount: number, reason: string) => void;
  
  // Admin Actions
  logAudit: (action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') => void;
  clearCashSession: (sessionId: string, reason: string) => void; // Vider la caisse
  adjustCashSession: (sessionId: string, newAmount: number, reason: string) => void; // Ajuster le solde

  initializeDemoData: () => void;
  syncToCloud: () => Promise<{ success: boolean, message: string }>;
}

const sessionId = Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Initialize Firebase Listeners
      const stateRef = ref(db, 'appState');
      onValue(stateRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          set(data);
        }
      });

      // Session Kick Listener (Active even after refresh)
      const setupSessionListener = (userId: string) => {
        const userSessionRef = ref(db, `sessions/${userId}`);
        return onValue(userSessionRef, (snapshot) => {
          const activeSessionId = snapshot.val();
          if (activeSessionId && activeSessionId !== sessionId) {
            get().logout();
            alert('VOTRE SESSION A ÉTÉ OUVERTE SUR UN AUTRE APPAREIL. VOUS AVEZ ÉTÉ DÉCONNECTÉ.');
          }
        });
      };

      // Re-establish listener if user is already logged in (from persist)
      setTimeout(() => {
        const state = get();
        if (state.currentUser) {
          if (db) {
            console.log("🔄 Rétablissement de la surveillance de session pour:", state.currentUser.fullName);
            setupSessionListener(state.currentUser.id);
          } else {
            console.warn("🚫 Impossible de surveiller la session : Firebase n'est pas connecté.");
          }
        }
      }, 2000);

      return {
        currentUser: null,
      users: [],
      medicaments: [],
      medicamentCategories: [],
      consumables: [],
      labExams: [],
      careActs: [],
      consultationTypes: [],
      practitioners: [],
      tickets: [],
      stockMovements: [],
      patients: [],
      cashSessions: [],
      auditLogs: [],
      settings: {
        establishmentName: 'CMS LE SEUL',
        address: 'Lomé, Togo',
        phone: '+228 90 00 00 00',
        email: 'contact@cmsleseul.tg',
        loginButtonColor: '#0056b3'
      },

      updateSettings: (newSettings) => set(s => {
        const newState = { settings: { ...s.settings, ...newSettings } };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      resetSettings: () => set(s => {
        const newState = {
          settings: {
            establishmentName: 'CMS LE SEUL',
            address: 'Lomé, Togo',
            phone: '+228 90 00 00 00',
            email: 'contact@cmsleseul.tg',
            theme: 'dark' as const,
            loginButtonColor: '#0056b3'
          }
        };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      login: (username, pin) => {
        const state = get();
        const userIndex = state.users.findIndex(u => 
          u.username.toLowerCase() === username.toLowerCase() && 
          u.code === pin && 
          u.isActive
        );

        if (userIndex !== -1) {
          const user = state.users[userIndex];
          
          const updatedUsers = [...state.users];
          updatedUsers[userIndex] = { ...user, isLoggedIn: true };
          
          // Firebase Session Management (Kick logic)
          if (db) {
            console.log("📡 Enregistrement de la session Firebase pour:", user.fullName);
            const userSessionRef = ref(db, `sessions/${user.id}`);
            dbSet(userSessionRef, sessionId);

            // Listen for session changes (Kick)
            onValue(userSessionRef, (snapshot) => {
              const activeSessionId = snapshot.val();
              if (activeSessionId && activeSessionId !== sessionId) {
                console.log("⚠️ Session écrasée par une nouvelle connexion !");
                get().logout();
                alert('VOTRE SESSION A ÉTÉ OUVERTE SUR UN AUTRE APPAREIL. VOUS AVEZ ÉTÉ DÉCONNECTÉ.');
              }
            });
          } else {
            console.warn("⚠️ Session locale uniquement : Firebase n'est pas configuré.");
          }

          // Sync users state
          dbUpdate(ref(db, 'appState'), { users: updatedUsers });

          set(s => ({ 
            users: updatedUsers,
            currentUser: updatedUsers[userIndex],
            auditLogs: [{
              id: Math.random().toString(36).substr(2, 9),
              action: 'CONNEXION',
              details: `Connexion réussie de ${user.fullName}`,
              timestamp: new Date().toISOString(),
              userId: user.id,
              userName: user.fullName,
              severity: 'INFO'
            }, ...s.auditLogs]
          }));
          return { success: true };
        }
        
        // Log failed attempt
        const userByUsername = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (userByUsername) {
             set(s => ({
              auditLogs: [{
                id: Math.random().toString(36).substr(2, 9),
                action: 'ECHEC_CONNEXION',
                details: `Échec connexion pour ${userByUsername.fullName} (Code incorrect)`,
                timestamp: new Date().toISOString(),
                userId: userByUsername.id,
                userName: userByUsername.fullName,
                severity: 'WARNING' as const
              }, ...s.auditLogs]
            }));
        }

        return { success: false, message: 'IDENTIFIANTS INCORRECTS' };
      },

      logout: () => {
        const state = get();
        if (state.currentUser) {
          const updatedUsers = state.users.map(u => 
            u.id === state.currentUser?.id ? { ...u, isLoggedIn: false } : u
          );
          
          // Sync logout state
          dbUpdate(ref(db, 'appState'), { users: updatedUsers });

          set(s => ({ 
            users: updatedUsers, 
            currentUser: null,
            auditLogs: [{
              id: Math.random().toString(36).substr(2, 9),
              action: 'DECONNEXION',
              details: `Déconnexion de ${state.currentUser?.fullName}`,
              timestamp: new Date().toISOString(),
              userId: state.currentUser?.id || 'sys',
              userName: state.currentUser?.fullName || 'Système',
              severity: 'INFO'
            }, ...s.auditLogs]
          }));
        }
      },
      
      addUser: (user) => set(s => {
        const newState = { users: [user, ...s.users] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      updateUser: (id, updates) => set(s => {
        const updatedUsers = s.users.map(u => u.id === id ? {...u, ...updates} : u);
        const updatedCurrentUser = s.currentUser?.id === id ? {...s.currentUser, ...updates} : s.currentUser;
        const newState = { users: updatedUsers, currentUser: updatedCurrentUser };
        dbUpdate(ref(db, 'appState'), { users: updatedUsers });
        return newState;
      }),
      deleteUser: (id) => set(s => {
        const newState = { users: s.users.filter(u => u.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      addPractitioner: (p) => set(s => {
        const newState = { practitioners: [p, ...s.practitioners] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      updatePractitioner: (id, updates) => set(s => {
        const newState = { practitioners: s.practitioners.map(p => p.id === id ? {...p, ...updates} : p) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deletePractitioner: (id) => set(s => {
        const newState = { practitioners: s.practitioners.filter(p => p.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      updateMedicament: (id, updates) => set(s => {
        const newState = { medicaments: s.medicaments.map(m => m.id === id ? {...m, ...updates} : m) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      addMedicament: (med) => set(s => {
        const newState = { medicaments: [med, ...s.medicaments] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deleteMedicament: (id) => set(s => {
        const newState = { medicaments: s.medicaments.filter(m => m.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      addMedicamentCategory: (category) => set(s => {
        const cat = category.toUpperCase().trim();
        if (s.medicamentCategories.includes(cat)) return s;
        const newState = { medicamentCategories: [...s.medicamentCategories, cat].sort() };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      addConsumable: (c) => set(s => {
        const newState = { consumables: [c, ...s.consumables] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      updateConsumable: (id, updates) => set(s => {
        const newState = { consumables: s.consumables.map(c => c.id === id ? {...c, ...updates} : c) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deleteConsumable: (id) => set(s => {
        const newState = { consumables: s.consumables.filter(c => c.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      
      updateLabExam: (id, updates) => set(s => {
        const newState = { labExams: s.labExams.map(e => e.id === id ? {...e, ...updates} : e) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      addLabExam: (exam) => set(s => {
        const newState = { labExams: [exam, ...s.labExams] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deleteLabExam: (id) => set(s => {
        const newState = { labExams: s.labExams.filter(e => e.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      updateCareAct: (id, updates) => set(s => {
        const newState = { careActs: s.careActs.map(a => a.id === id ? {...a, ...updates} : a) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      addCareAct: (act) => set(s => {
        const newState = { careActs: [act, ...s.careActs] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deleteCareAct: (id) => set(s => {
        const newState = { careActs: s.careActs.filter(a => a.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      addConsultationType: (consultation) => set(s => {
        const newState = { consultationTypes: [consultation, ...s.consultationTypes] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      updateConsultationType: (id, updates) => set(s => {
        const newState = { consultationTypes: s.consultationTypes.map(c => c.id === id ? {...c, ...updates} : c) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      deleteConsultationType: (id) => set(s => {
        const newState = { consultationTypes: s.consultationTypes.filter(c => c.id !== id) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      addPatient: (patient) => set(s => {
        const newState = { patients: [patient, ...s.patients] };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),
      updatePatient: (id, updates) => set(s => {
        const newState = { patients: s.patients.map(p => p.id === id ? {...p, ...updates} : p) };
        dbUpdate(ref(db, 'appState'), newState);
        return newState;
      }),

      adjustStock: (id, qty, type, options) => {
        const state = get();
        const med = state.medicaments.find(m => m.id === id);
        if (!med) return;
        
        const newStock = Math.max(0, med.stock + qty);
        const movement: StockMovement = {
          id: Math.random().toString(36).substr(2, 9),
          medicamentId: id,
          medNom: med.nom,
          type,
          quantite: qty,
          date: new Date().toISOString(),
          userId: state.currentUser?.id || 'sys',
          userNom: state.currentUser?.fullName || 'Système',
          description: options?.description,
          dateExpiration: options?.dateExpiration || med.dateExpiration,
          lotNumber: options?.lotNumber || med.lotNumber
        };

        const newState = {
          medicaments: state.medicaments.map(m => m.id === id ? { 
            ...m, 
            stock: newStock,
            dateExpiration: options?.dateExpiration || m.dateExpiration,
            lotNumber: options?.lotNumber || m.lotNumber
          } : m),
          stockMovements: [movement, ...state.stockMovements]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      createTicket: (data: Omit<Ticket, 'id' | 'numero' | 'date'>) => {
        const state = get();
        const prefix = { PHARMACY: 'PH', CONSULTATION: 'CS', LABORATORY: 'LB', NURSING: 'SN' }[data.type];
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const count = state.tickets.filter(t => t.numero.startsWith(`${prefix}-${dateStr}`)).length + 1;
        const numero = `${prefix}-${dateStr}-${count.toString().padStart(5, '0')}`;
        const newTicket: Ticket = { ...data, id: Math.random().toString(36).substr(2, 9), numero, date: new Date().toISOString() };
        
        // Si le ticket est immédiatement payé
        if (data.statut === 'PAID') {
          // PHARMACIE: on déduit le stock médicaments
          if (data.type === 'PHARMACY') {
            set({
              medicaments: state.medicaments.map(m => {
                const item = data.items.find(it => it.id === m.id);
                if (item) {
                  return { ...m, stock: m.stock - item.quantity, salesCount: (m.salesCount || 0) + item.quantity };
                }
                return m;
              }),
              stockMovements: [
                ...data.items.map(it => ({
                  id: Math.random().toString(36).substr(2, 9),
                  medicamentId: it.id,
                  medNom: it.label,
                  type: 'VENTE' as const,
                  quantite: -it.quantity,
                  date: new Date().toISOString(),
                  userId: state.currentUser?.id || 'sys',
                  userNom: state.currentUser?.fullName || 'Système'
                })),
                ...state.stockMovements
              ]
            });
          }
          
          // LABORATOIRE & SOINS: on déduit les consommables
          if (data.type === 'LABORATORY' || data.type === 'NURSING') {
            let updatedConsumables = [...state.consumables];
            data.items.forEach(item => {
              const exam = state.labExams.find(e => e.id === item.id);
              const act = state.careActs.find(a => a.id === item.id);
              const definition = exam || act;

              if (definition && definition.consumables) {
                definition.consumables.forEach(req => {
                  const consIndex = updatedConsumables.findIndex(c => c.id === req.id);
                  if (consIndex !== -1) {
                     updatedConsumables[consIndex] = {
                       ...updatedConsumables[consIndex],
                       stock: Math.max(0, updatedConsumables[consIndex].stock - (req.quantity * item.quantity))
                     };
                  }
                });
              }
            });
            set({ consumables: updatedConsumables });
          }
        }
        
        const newState = { tickets: [newTicket, ...state.tickets] };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
        return newTicket;
      },

      updateTicketStatus: (id, status, paymentDetails) => {
        const state = get();
        const ticket = state.tickets.find(t => t.id === id);
        if (!ticket) return;

        // Si on passe à PAID
        if (status === 'PAID' && ticket.statut !== 'PAID') {
           // PHARMACIE
           if (ticket.type === 'PHARMACY') {
             set({
              medicaments: state.medicaments.map(m => {
                const item = ticket.items.find(it => it.id === m.id);
                if (item) {
                  return { ...m, stock: m.stock - item.quantity, salesCount: (m.salesCount || 0) + item.quantity };
                }
                return m;
              }),
              stockMovements: [
                ...ticket.items.map(it => ({
                  id: Math.random().toString(36).substr(2, 9),
                  medicamentId: it.id,
                  medNom: it.label,
                  type: 'VENTE' as const,
                  quantite: -it.quantity,
                  date: new Date().toISOString(),
                  userId: state.currentUser?.id || 'sys',
                  userNom: state.currentUser?.fullName || 'Système'
                })),
                ...state.stockMovements
              ]
            });
           }

           // LABORATOIRE & SOINS
           if (ticket.type === 'LABORATORY' || ticket.type === 'NURSING') {
              let updatedConsumables = [...state.consumables];
              ticket.items.forEach(item => {
                const exam = state.labExams.find(e => e.id === item.id);
                const act = state.careActs.find(a => a.id === item.id);
                const definition = exam || act;

                if (definition && definition.consumables) {
                  definition.consumables.forEach(req => {
                    const consIndex = updatedConsumables.findIndex(c => c.id === req.id);
                    if (consIndex !== -1) {
                       updatedConsumables[consIndex] = {
                         ...updatedConsumables[consIndex],
                         stock: Math.max(0, updatedConsumables[consIndex].stock - (req.quantity * item.quantity))
                       };
                    }
                  });
                }
              });
              set({ consumables: updatedConsumables });
           }
        }

        // Si on annule un ticket payé (PHARMACY), on restitue le stock
        if (status === 'CANCELLED' && ticket.statut === 'PAID' && ticket.type === 'PHARMACY') {
           set({
            medicaments: state.medicaments.map(m => {
              const item = ticket.items.find(it => it.id === m.id);
              if (item) {
                return { ...m, stock: m.stock + item.quantity, salesCount: Math.max(0, (m.salesCount || 0) - item.quantity) };
              }
              return m;
            }),
            stockMovements: [
              ...ticket.items.map(it => ({
                id: Math.random().toString(36).substr(2, 9),
                medicamentId: it.id,
                medNom: it.label,
                type: 'CORRECTION' as const,
                quantite: it.quantity,
                date: new Date().toISOString(),
                userId: state.currentUser?.id || 'sys',
                userNom: state.currentUser?.fullName || 'Système'
              })),
              ...state.stockMovements
            ]
          });
        }

        const newState = {
          tickets: state.tickets.map(t => t.id === id ? { 
            ...t, 
            statut: status,
            ...(paymentDetails || {}),
            date: status === 'PAID' ? new Date().toISOString() : t.date
          } : t)
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      openSession: (openingAmount) => {
        const state = get();
        const user = state.currentUser;
        if (!user) return { success: false, message: 'Non connecté' };

        // Check for existing open session
        const activeSession = state.cashSessions.find(s => s.status === 'OPEN');
        if (activeSession) {
          if (activeSession.cashierId !== user.id) {
            return { success: false, message: 'Une session de caisse est déjà en cours sur un autre support.' };
          }
          return { success: false, message: 'Vous avez déjà une session ouverte.' };
        }

        const newSession: CashSession = {
          id: Math.random().toString(36).substr(2, 9),
          cashierId: user.id,
          cashierName: user.fullName,
          startTime: new Date().toISOString(),
          openingAmount,
          status: 'OPEN',
          disbursements: [],
          totalSales: 0
        };

        const newState = { 
          cashSessions: [newSession, ...state.cashSessions],
          auditLogs: [{
            id: Math.random().toString(36).substr(2, 9),
            action: 'OUVERTURE_CAISSE',
            details: `Ouverture par ${user.fullName} avec ${openingAmount} F`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.fullName,
            severity: 'INFO' as const
          }, ...state.auditLogs]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);

        return { success: true };
      },

      closeSession: (closingAmount) => {
        const state = get();
        const user = state.currentUser;
        if (!user) return;

        const activeSession = state.cashSessions.find(s => s.status === 'OPEN' && s.cashierId === user.id);
        if (!activeSession) return;

        // Calculate theoretical amount
        // Opening + Sales - Disbursements
        const totalDisbursements = activeSession.disbursements.reduce((acc, d) => acc + d.amount, 0);
        
        // Calculate sales for this session
        // Filter tickets paid during this session time window by this cashier
        const sessionSales = state.tickets
          .filter(t => 
            t.statut === 'PAID' && 
            t.caissierId === user.id && 
            new Date(t.date) >= new Date(activeSession.startTime)
          )
          .reduce((acc, t) => acc + (t.montantRecu || 0), 0);

        const theoretical = activeSession.openingAmount + sessionSales - totalDisbursements;
        const gap = closingAmount - theoretical;

        const updatedSession: CashSession = {
          ...activeSession,
          endTime: new Date().toISOString(),
          closingAmount,
          theoreticalClosingAmount: theoretical,
          status: 'CLOSED',
          totalSales: sessionSales
        };

        const newState = {
          cashSessions: state.cashSessions.map(session => session.id === activeSession.id ? updatedSession : session),
          auditLogs: [{
            id: Math.random().toString(36).substr(2, 9),
            action: 'FERMETURE_CAISSE',
            details: `Fermeture par ${user.fullName}. Attendu: ${theoretical}, Réel: ${closingAmount}, Écart: ${gap}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.fullName,
            severity: gap !== 0 ? 'WARNING' as const : 'INFO' as const
          }, ...state.auditLogs]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      addDisbursement: (amount, reason) => {
        const state = get();
        const user = state.currentUser;
        if (!user) return;

        const activeSession = state.cashSessions.find(s => s.status === 'OPEN' && s.cashierId === user.id);
        if (!activeSession) return;

        const newDisbursement: CashDisbursement = {
          id: Math.random().toString(36).substr(2, 9),
          sessionId: activeSession.id,
          amount,
          reason,
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.fullName
        };

        const updatedSession = {
          ...activeSession,
          disbursements: [...activeSession.disbursements, newDisbursement]
        };

        const newState = {
          cashSessions: state.cashSessions.map(session => session.id === activeSession.id ? updatedSession : session),
          auditLogs: [{
            id: Math.random().toString(36).substr(2, 9),
            action: 'DECAISSEMENT',
            details: `Sortie de ${amount} F par ${user.fullName}. Motif: ${reason}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.fullName,
            severity: 'INFO' as const
          }, ...state.auditLogs]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      logAudit: (action, details, severity) => {
        const state = get();
        const user = state.currentUser;
        const newState = {
          auditLogs: [{
            id: Math.random().toString(36).substr(2, 9),
            action,
            details,
            timestamp: new Date().toISOString(),
            userId: user?.id || 'sys',
            userName: user?.fullName || 'Système',
            severity
          }, ...state.auditLogs]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      clearCashSession: (sessionId, reason) => {
        const state = get();
        const user = state.currentUser;
        if (!user || user.role !== UserRole.ADMIN) return;

        const session = state.cashSessions.find(s => s.id === sessionId);
        if (!session || session.status !== 'OPEN') return;

        // Calculate current balance
        const totalDisbursements = session.disbursements.reduce((acc, d) => acc + d.amount, 0);
        const sessionSales = state.tickets
          .filter(t => 
            t.statut === 'PAID' && 
            t.caissierId === session.cashierId && 
            new Date(t.date) >= new Date(session.startTime)
          )
          .reduce((acc, t) => acc + (t.montantRecu || 0), 0);
        
        const currentBalance = session.openingAmount + sessionSales - totalDisbursements;

        const newDisbursement: CashDisbursement = {
          id: Math.random().toString(36).substr(2, 9),
          sessionId: session.id,
          amount: currentBalance,
          reason: `VIDAGE CAISSE ADMIN: ${reason}`,
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.fullName
        };

        const updatedSession = {
          ...session,
          disbursements: [...session.disbursements, newDisbursement]
        };

        const newState = {
          cashSessions: state.cashSessions.map(sess => sess.id === sessionId ? updatedSession : sess),
          auditLogs: [{
            id: Math.random().toString(36).substr(2, 9),
            action: 'VIDAGE_CAISSE',
            details: `Vidage par Admin ${user.fullName}. Montant: ${currentBalance}. Motif: ${reason}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.fullName,
            severity: 'CRITICAL' as const
          }, ...state.auditLogs]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      adjustCashSession: (sessionId, newAmount, reason) => {
         // Admin function to force the balance to a specific amount
         const state = get();
         const user = state.currentUser;
         if (!user || user.role !== UserRole.ADMIN) return;

         const session = state.cashSessions.find(s => s.id === sessionId);
         if (!session || session.status !== 'OPEN') return;

         const totalDisbursements = session.disbursements.reduce((acc, d) => acc + d.amount, 0);
         const sessionSales = state.tickets
           .filter(t => 
             t.statut === 'PAID' && 
             t.caissierId === session.cashierId && 
             new Date(t.date) >= new Date(session.startTime)
           )
           .reduce((acc, t) => acc + (t.montantRecu || 0), 0);
         
         const currentBalance = session.openingAmount + sessionSales - totalDisbursements;
         const diff = currentBalance - newAmount;

         const newDisbursement: CashDisbursement = {
           id: Math.random().toString(36).substr(2, 9),
           sessionId: session.id,
           amount: diff,
           reason: `AJUSTEMENT ADMIN: ${reason}`,
           timestamp: new Date().toISOString(),
           userId: user.id,
           userName: user.fullName
         };
 
         const updatedSession = {
           ...session,
           disbursements: [...session.disbursements, newDisbursement]
         };
 
         const newState = {
           cashSessions: state.cashSessions.map(sess => sess.id === sessionId ? updatedSession : sess),
           auditLogs: [{
             id: Math.random().toString(36).substr(2, 9),
             action: 'AJUSTEMENT_CAISSE',
             details: `Ajustement par Admin ${user.fullName}. Ancien: ${currentBalance}, Nouveau: ${newAmount}. Motif: ${reason}`,
             timestamp: new Date().toISOString(),
             userId: user.id,
             userName: user.fullName,
             severity: 'WARNING' as const
           }, ...state.auditLogs]
         };
         dbUpdate(ref(db, 'appState'), newState);
         set(newState);
      },

      initializeDemoData: () => {
        const demoUsers: User[] = [
          { id: 'u-1', username: 'admin', role: UserRole.ADMIN, code: '1234', fullName: 'Administrateur Principal', isActive: true, isLoggedIn: false, createdAt: new Date().toISOString() },
          { id: 'u-2', username: 'caisse', role: UserRole.CAISSIER, code: '0000', fullName: 'Caisse Centrale', isActive: true, isLoggedIn: false, createdAt: new Date().toISOString() }
        ];

        const initialCategories = [
          'ANALGÉSIQUE',
          'ANTIBIOTIQUE',
          'ANTI-INFLAMMATOIRE',
          'ANTIPALUDÉEN',
          'ANTIHISTAMINIQUE',
          'ANTISPASMODIQUE',
          'VITAMINES',
          'CONSOMMABLE',
          'INJECTION',
          'SIROP',
          'MATÉRIEL',
          'AUTRE'
        ];

        const medNames = [
          { n: 'Paracétamol 500mg', cat: 'ANALGÉSIQUE', exp: '2026-12-15' },
          { n: 'Amoxicilline 1g', cat: 'ANTIBIOTIQUE', exp: '2024-08-20' },
          { n: 'Ibuprofène 400mg', cat: 'ANTI-INFLAMMATOIRE', exp: '2025-10-10' },
          { n: 'Artéméther 80mg', cat: 'ANTIPALUDÉEN', exp: '2024-05-12' },
          { n: 'Cétirizine 10mg', cat: 'ANTIHISTAMINIQUE', exp: '2026-01-01' },
          { n: 'Spasfon Lyoc', cat: 'ANTISPASMODIQUE', exp: '2025-06-30' },
          { n: 'Doliprane 1g', cat: 'ANALGÉSIQUE', exp: '2027-02-14' },
          // New items from user
          { n: 'Ivepral inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Intraflon jaune', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: '9 Vit', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Accupan', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Accuzon', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Ampi', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Arté Inj 80', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'B. Complexe', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Bandelette Gly', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Bandellette H', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Calcium Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Carnet CPN', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Carnet De Sante', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Carnet Rouge', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Catapressant Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Ceftri', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Célestène Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Cétafor Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Cimétidine', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Cipro Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Compresse', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'D10 250', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'D10 500', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Dépôt', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Déxa', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Diazé', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Diclo Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Dislep', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Dysnone Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Eau Distillée', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Épi veine', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Fil', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'G5 250', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'G5 500', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Gant Stéril', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Gelo', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Genta Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Hémafer Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Intraflon', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Iocyne Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Magnesium Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Métro Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Nos–pa inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Novalgin Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Para Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Paven', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Perfuseur', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Quinine RL', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Sale', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Sat', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Seringue 10cc', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Seringue 5cc', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Sparadrap', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Spasfon Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Test De Z', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Trabar Inj VAT', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Vit B12', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Vit C', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Vit K1', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Vit K3', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Vogalène inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Artefan B6', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artefan B12', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artefan B18', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artefan B24', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Tdr', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Artesun 60', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Mid', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Sonde', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Acenland', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Aclogel', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Aclop', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Actinac', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Advil Med', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Alaise', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Alben Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Albène', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Alccol', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Alfer', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Algofène', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Allergyl', cat: 'ANTIHISTAMINIQUE', exp: '2026-01-01' },
          { n: 'Ambect', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Amifer', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Amoxi Gèl', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Amoxi Sp 125', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Amoxi Sp 250', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Apdyl-h', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Apflu', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Artéfan 20', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artéfan 40', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artéfan 60', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artéfan 80', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artéfan Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Artequick', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artésian 20', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artésiane 80', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Artiz Forte', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Artome Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Ascoril Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Aspégic 1g', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Astaph', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Augmentin Enf', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Azicure cp', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Azirox', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Bande', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Bendex', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Benzatine Bezinc', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Biba', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Bimalaril Ado', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Bimalaril Cp 80', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Bimalaril enft', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Bimalaril Nnee', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Biofar enf', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Bistouri', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Bléortem', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Bon-Bon', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Brufen CaC 1000', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Cartèf 80/480', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Cartèf 20/120', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Cazithro Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Cazitro Cp', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Cepfil 500', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Ciamox 125', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Ciamox 500', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Cipro cp 500', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Cipro Tm', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Clamoxyl 125', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Clamoxyl 250', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Clamp', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Clavmox', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Clofains', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Coartèm', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Cofantrine Sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Coflex Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Colinil gtte', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Combiart', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Confiance', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Coton', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Cotri Cp', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Cotri Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Curan 1g', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Curan 500g', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Cyteal', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Dermobactère', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Diclo 50mg', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Diclo Denk', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Dicynone Gel', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Dolco Cp 500', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Doliprane 1000', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Doliprane sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Dolko Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Doxy 200', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Efferalgan 1g', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Efferalgan 500', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Efferalgan sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Erytro Cp', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Faf', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Falciart 80mg', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Farciart 20', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Febrilex Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Fedate', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Fercefol Cp', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Fercefol Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Ferrum', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Fervital', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Fifer', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Falciart SP', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Filazol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Flagyl 250', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Flucazol Gel', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Flucazol Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Flugen', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Flurifen', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Folcan', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Fuclo 250', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Furosémide', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Genta Collyre', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Gentazol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Goyal Balm', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Gynofer', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Hemafer Cp', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Ibumol', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Ibuprofene Cp', cat: 'ANTI-INFLAMMATOIRE', exp: '2026-01-01' },
          { n: 'Ibuprofene Sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Immu C', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Imox Gel 500', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Indozone S', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Iocyne Inj', cat: 'INJECTION', exp: '2026-01-01' },
          { n: 'Kit D’acc', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Kolicure Gtte', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Laridox', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Laritem 20', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Laritem 80', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Lariter 40', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Litacold Cp', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Litacold sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Maalox', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Malacure cp 40', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Malacure sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Maloxine', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Mébendazol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Méto', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Metro 500', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Métro cp 200', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Métro Sirop 125', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Micizal Crem', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Miso-Fem', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Multivita Enf', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Mumfer', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Nemozol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Normet', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Novalgin Cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Nuravit', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Nystatine Ovul', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Oméprozol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Orex', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Orofer', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Oxacilline', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Paidofebril', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Paidoterin', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Pamagin Cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Pamagin Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Panadol', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Panol cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Panol sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Para Cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Paraffizz', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Parafil', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Parol cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Parol sp', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Para Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Pédiavit', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Pekfen', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Péné G', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Philci Ubu', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Philco–Cotri', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Philco–Fervit', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Philco Para 240', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Pinko', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Poipar Plus', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Polyfer', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Potacium', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Prégnid', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Progestérone', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Quinine cp', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'R-Lume', cat: 'ANTIPALUDÉEN', exp: '2026-01-01' },
          { n: 'Ranferon', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Redin 100', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Redin 200', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Rifamicyne', cat: 'ANTIBIOTIQUE', exp: '2026-01-01' },
          { n: 'Rinomicine', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Roipar 1000', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Roipar 500', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Saniver', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Sivoderm', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Spasfon cp', cat: 'ANTISPASMODIQUE', exp: '2026-01-01' },
          { n: 'Spasfon Supp', cat: 'ANTISPASMODIQUE', exp: '2026-01-01' },
          { n: 'Spéculum', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Surdex', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'T-Fer', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Synto', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'TDR', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Thermo', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Ticass 200', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Ticass 400', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Tinazol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Tinidazol', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Tinifil', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Tot’ Hema', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Tardyferon', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Tramacetal Cp', cat: 'ANALGÉSIQUE', exp: '2026-01-01' },
          { n: 'Tres Orix', cat: 'VITAMINES', exp: '2026-01-01' },
          { n: 'Tube D’etat', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Tube Sec', cat: 'MATÉRIEL', exp: '2026-01-01' },
          { n: 'Tussuphan', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Ultra-Levure', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Vagalene Suppo', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Vagalène Suppo', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Verzol Cp', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Verzol Sirop', cat: 'SIROP', exp: '2026-01-01' },
          { n: 'Vogalène gtte', cat: 'AUTRE', exp: '2026-01-01' },
          { n: 'Zipferon', cat: 'VITAMINES', exp: '2026-01-01' }
        ];

        const meds: Medicament[] = medNames.map((item, i) => ({
          id: `med-${i}`, 
          nom: item.n, 
          prix: i < 7 ? 1000 + (i * 100) : 0, 
          prixInam: i < 7 ? 200 + (i * 20) : 0, 
          prixAmu: i < 7 ? 100 + (i * 10) : 0, 
          stock: i === 3 ? 5 : 100, 
          stockMin: 10, 
          stockMax: 500, 
          categorie: item.cat, 
          salesCount: Math.floor(Math.random() * 50),
          dateExpiration: item.exp,
          lotNumber: `LOT-${2024 + i}-${Math.floor(Math.random()*1000)}`
        }));

        const newState = { 
          users: demoUsers, 
          medicaments: meds,
          medicamentCategories: initialCategories,
          practitioners: [
            { id: 'pr-1', nom: 'Dr. Kouassi', role: UserRole.MEDECIN as const, specialite: 'Généraliste' },
            { id: 'pr-2', nom: 'Inf. Mensah', role: UserRole.INFIRMIER as const, specialite: 'Soins Inf.' }
          ], 
          careActs: [
            { id: 'act-1', nom: 'Injection IM/IV', prix: 500, prixInam: 100, prixAmu: 50, categorie: 'INJECTIONS' },
            { id: 'act-2', nom: 'Pansement Simple', prix: 1500, prixInam: 300, prixAmu: 150, categorie: 'PANSEMENTS' },
            { id: 'act-3', nom: 'Suture Plaie', prix: 5000, prixInam: 1000, prixAmu: 500, categorie: 'CHIRURGIE MINEURE' }
          ], 
          consultationTypes: [
            { id: 'cons-1', label: 'Consultation Générale', price: 1000, priceInam: 200, priceAmu: 100, category: 'GP' as const },
            { id: 'cons-2', label: 'CPN 1', price: 500, priceInam: 100, priceAmu: 50, category: 'CPN' as const },
            { id: 'cons-3', label: 'CPN 2', price: 500, priceInam: 100, priceAmu: 50, category: 'CPN' as const },
            { id: 'cons-4', label: 'CPN 3', price: 500, priceInam: 100, priceAmu: 50, category: 'CPN' as const },
            { id: 'cons-5', label: 'CPN 4', price: 500, priceInam: 100, priceAmu: 50, category: 'CPN' as const }
          ],
          labExams: [
            { id: 'lb-1', nom: 'Hémogramme', prix: 3500, prixInam: 700, prixAmu: 350, categorie: 'HÉMATOLOGIE' },
            { id: 'lb-2', nom: 'Glycémie', prix: 1500, prixInam: 300, prixAmu: 150, categorie: 'BIOCHIMIE' },
            { id: 'lb-3', nom: 'Test Palu (TDR)', prix: 1000, prixInam: 200, prixAmu: 100, categorie: 'PARASITOLOGIE' }
          ],
          patients: [
            { id: 'p-1', nom: 'KOFFI', prenom: 'Jean', age: 35, sexe: 'M' as const, assuranceType: AssuranceType.INAM, numeroAssurance: '123456' },
            { id: 'p-2', nom: 'AMETOWOGBE', prenom: 'Sarah', age: 28, sexe: 'F' as const, assuranceType: AssuranceType.PLEIN_TARIF }
          ],
          tickets: [
            {
              id: 't-demo-1',
              numero: 'CS-20261024-00001',
              type: 'CONSULTATION' as const,
              patientId: 'p-1',
              patientNom: 'KOFFI Jean',
              patientAge: 35,
              date: new Date().toISOString(),
              items: [
                { id: 'act-1', label: 'Injection IM/IV', quantity: 1, pricePerUnit: 500, total: 500, partAssurance: 400, partPatient: 100 }
              ],
              assurance: AssuranceType.INAM,
              totalBrut: 500,
              partAssurance: 400,
              netAPayer: 100,
              montantRecu: 0,
              reliquat: 0,
              caissierId: '',
              caissierNom: '',
              statut: 'PENDING' as const
            }
          ]
        };
        dbUpdate(ref(db, 'appState'), newState);
        set(newState);
      },

      syncToCloud: async () => {
        const state = get();
        try {
          // Dynamic import to avoid issues if firebase isn't configured
          const { db, ref, set } = await import('../src/firebase-config');
          
          if (!import.meta.env.VITE_FIREBASE_API_KEY) {
            throw new Error("Firebase n'est pas configuré. Veuillez ajouter les clés API dans les variables d'environnement.");
          }

          const backupRef = ref(db, `backups/${state.settings.establishmentName?.replace(/\s+/g, '_') || 'default'}`);
          
          await set(backupRef, {
            medicaments: state.medicaments,
            patients: state.patients,
            tickets: state.tickets,
            settings: state.settings,
            lastSync: new Date().toISOString()
          });

          return { success: true, message: 'Synchronisation réussie !' };
        } catch (error: any) {
          console.error('Sync error:', error);
          return { success: false, message: error.message || 'Erreur de synchronisation' };
        }
      }
    }
  },
  { name: 'cms-le-seul-pro-storage-v2' }
)
);
