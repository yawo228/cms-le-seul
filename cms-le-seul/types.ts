
export enum UserRole {
  ADMIN = 'ADMIN',
  CAISSIER = 'CAISSIER',
  MEDECIN = 'MEDECIN',
  INFIRMIER = 'INFIRMIER'
}

export interface CashDisbursement {
  id: string;
  sessionId: string;
  amount: number;
  reason: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface CashSession {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingAmount: number;
  closingAmount?: number; // The physical amount counted by cashier
  theoreticalClosingAmount?: number; // Calculated by system
  disbursements: CashDisbursement[];
  status: 'OPEN' | 'CLOSED';
  totalSales: number; // Track sales during session for easier calculation
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
  userName: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  code: string;
  fullName: string;
  isActive: boolean;
  isLoggedIn?: boolean; // Pour gérer la session unique
  cameraPreference?: 'user' | 'environment';
  hasConfiguredCamera?: boolean;
  createdAt: string;
}

export enum AssuranceType {
  PLEIN_TARIF = 'PLEIN_TARIF',
  INAM = 'INAM',
  AMU = 'AMU',
  AUTRE = 'AUTRE'
}

export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  sexe: 'M' | 'F';
  telephone?: string;
  assuranceType: AssuranceType;
  numeroAssurance?: string;
  historique?: string[]; // IDs des tickets
}

export interface Medicament {
  id: string;
  nom: string;
  prix: number;
  prixInam: number;
  prixAmu: number;
  stock: number;
  stockMin: number;
  stockMax: number;
  image?: string;
  categorie: string;
  salesCount: number;
  dateExpiration: string;
  lotNumber?: string;
}

export interface Consumable {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  lastRestockDate?: string;
}

export interface LabExam {
  id: string;
  nom: string;
  prix: number;
  prixInam: number;
  prixAmu: number;
  categorie: string;
  consumables?: { id: string; quantity: number }[];
}

export interface CareAct {
  id: string;
  nom: string;
  prix: number;
  prixInam: number;
  prixAmu: number;
  categorie: string;
  consumables?: { id: string; quantity: number }[];
}

export interface ConsultationType {
  id: string;
  label: string;
  price: number;
  priceInam: number;
  priceAmu: number;
  category: 'GP' | 'CPN';
}

export interface Practitioner {
  id: string;
  nom: string;
  role: UserRole.MEDECIN | UserRole.INFIRMIER | UserRole.ADMIN;
  specialite?: string;
}

export type TransactionType = 'PHARMACY' | 'CONSULTATION' | 'LABORATORY' | 'NURSING';

export interface TransactionItem {
  id: string;
  label: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  partAssurance: number;
  partPatient: number;
}

export interface Ticket {
  id: string;
  numero: string;
  type: TransactionType;
  patientId?: string;
  patientNom: string;
  patientAge?: number;
  date: string;
  items: TransactionItem[];
  assurance: AssuranceType;
  totalBrut: number;
  partAssurance: number;
  netAPayer: number;
  montantRecu: number;
  reliquat: number;
  caissierId: string;
  caissierNom: string;
  praticienId?: string;
  praticienNom?: string;
  statut: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'ESPECES' | 'TMONEY' | 'FLOOZ' | 'CHEQUE' | 'VIREMENT' | 'ASSURANCE';
}

export interface StockMovement {
  id: string;
  medicamentId: string;
  medNom: string;
  type: 'INVENTAIRE' | 'ACHAT' | 'CORRECTION' | 'VENTE';
  quantite: number;
  date: string;
  userId: string;
  userNom: string;
  description?: string;
  dateExpiration?: string;
  lotNumber?: string;
}
