import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Pill, X, ShoppingCart, LayoutGrid, ScanBarcode, Camera, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicament, AssuranceType, TransactionItem, Patient } from '../../types';
import TicketModal from '../Common/TicketModal';
import PatientSelector from '../Common/PatientSelector';

// Fonction de calcul de similitude pour la recherche floue
const getSimilarityScore = (target: string, query: string) => {
  const t = target.toLowerCase();
  const q = query.toLowerCase();
  
  if (t.includes(q)) return 1; // Correspondance exacte ou partielle
  
  const dist = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () => 
      Array(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const distance = dist(t, q);
  const maxLen = Math.max(t.length, q.length);
  return 1 - (distance / maxLen);
};

const PharmacyModule: React.FC = () => {
  const { medicaments, medicamentCategories, createTicket, currentUser, tickets, settings } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');
  const [sortBy, setSortBy] = useState<'NAME' | 'PRICE' | 'STOCK'>('NAME');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [assurance, setAssurance] = useState<AssuranceType>(AssuranceType.PLEIN_TARIF);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'TMONEY' | 'FLOOZ' | 'CHEQUE' | 'VIREMENT' | 'ASSURANCE'>('ESPECES');
  
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cols, setCols] = useState(4);

  const categories = useMemo(() => ['TOUS', ...medicamentCategories], [medicamentCategories]);

  const filteredMeds = useMemo(() => {
    const query = search.trim();
    let meds = [...medicaments];

    if (query) {
      meds = medicaments
        .map(m => {
          const nomScore = getSimilarityScore(m.nom, query);
          const lotScore = m.lotNumber ? getSimilarityScore(m.lotNumber, query) : 0;
          return { med: m, score: Math.max(nomScore, lotScore) };
        })
        .filter(item => item.score > 0.4)
        .sort((a, b) => b.score - a.score)
        .map(item => item.med);
    }

    return meds
      .filter(m => selectedCategory === 'TOUS' || m.categorie === selectedCategory)
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'NAME') {
          comparison = a.nom.localeCompare(b.nom);
        } else if (sortBy === 'PRICE') {
          comparison = a.prix - b.prix;
        } else if (sortBy === 'STOCK') {
          comparison = a.stock - b.stock;
        }
        return sortOrder === 'ASC' ? comparison : -comparison;
      });
  }, [medicaments, search, selectedCategory, sortBy, sortOrder]);

  const cartItems = useMemo(() => {
    return (Object.entries(cart) as [string, number][]).map(([id, qty]) => {
      const med = medicaments.find(m => m.id === id);
      if (!med) return null;
      
      const basePrice = med.prix;
      let patientPrice = basePrice;
      
      if (assurance === AssuranceType.INAM) patientPrice = med.prixInam;
      if (assurance === AssuranceType.AMU) patientPrice = med.prixAmu;
      
      return { 
        id: med.id, 
        label: med.nom, 
        quantity: qty, 
        pricePerUnit: basePrice, 
        total: basePrice * qty,
        partAssurance: (basePrice - patientPrice) * qty,
        partPatient: patientPrice * qty
      };
    }).filter(Boolean) as TransactionItem[];
  }, [cart, assurance, medicaments]);

  const totals = useMemo(() => {
    const totalBrut = cartItems.reduce((acc, item) => acc + item.total, 0);
    const netAPayer = cartItems.reduce((acc, item) => acc + item.partPatient, 0);
    const reliquat = montantRecu > 0 ? montantRecu - netAPayer : 0;
    return { brut: totalBrut, net: netAPayer, reliquat };
  }, [cartItems, montantRecu]);

  const addToCart = (med: Medicament) => {
    if (med.stock <= 0) return;
    setCart(prev => ({ ...prev, [med.id]: (prev[med.id] || 0) + 1 }));
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) newCart[id] -= 1;
      else delete newCart[id];
      return newCart;
    });
  };

  const handleQuickSale = (medName: string = 'Paracétamol') => {
    const med = medicaments.find(m => 
      m.nom.toLowerCase().includes(medName.toLowerCase()) && m.stock > 0
    );
    
    if (!med) {
      alert(`Produit "${medName}" introuvable ou en rupture de stock.`);
      return;
    }

    const price = med.prix;
    const quickSaleCount = tickets.filter(t => t.patientNom.includes('RAPIDE')).length + 1;
    const finalPatientName = `CLIENT RAPIDE #${quickSaleCount}`;
    
    const item: TransactionItem = {
      id: med.id,
      label: med.nom,
      quantity: 1,
      pricePerUnit: price,
      total: price,
      partAssurance: 0,
      partPatient: price
    };

    const ticket = createTicket({
      type: 'PHARMACY',
      patientNom: finalPatientName,
      items: [item],
      assurance: AssuranceType.PLEIN_TARIF,
      totalBrut: price,
      partAssurance: 0,
      netAPayer: price,
      montantRecu: price,
      reliquat: 0,
      caissierId: currentUser?.id || 'sys',
      caissierNom: currentUser?.fullName || 'Système',
      statut: 'PAID'
    });

    setLastTicket(ticket);
    setShowTicket(true);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: any = null;

    const startScanner = async () => {
      try {
        setScanError(null);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code']
          });

          interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) handleScannedCode(barcodes[0].rawValue);
              } catch (e) { console.error(e); }
            }
          }, 500);
        } else {
          setScanError("API Scan non supportée.");
        }
      } catch (err) { setScanError("Accès caméra refusé."); }
    };

    if (isScanning) startScanner();
    else {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (interval) clearInterval(interval);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  const handleScannedCode = (code: string) => {
    const med = medicaments.find(m => m.lotNumber === code || m.id === code);
    if (med) { addToCart(med); setIsScanning(false); }
    else { setSearch(code); setIsScanning(false); }
  };

  const handleCheckout = () => {
    if (!currentUser || cartItems.length === 0) return;
    
    const finalPatientName = selectedPatient 
      ? `${selectedPatient.nom} ${selectedPatient.prenom}`.toUpperCase()
      : `CLIENT PASSAGE ${tickets.filter(t => t.type === 'PHARMACY').length + 1}`;
    
    const ticket = createTicket({
      type: 'PHARMACY',
      patientNom: finalPatientName,
      patientId: selectedPatient?.id,
      items: cartItems,
      assurance,
      totalBrut: totals.brut,
      partAssurance: totals.brut - totals.net,
      netAPayer: totals.net,
      montantRecu: paymentStatus === 'PAID' ? (montantRecu || totals.net) : 0,
      reliquat: paymentStatus === 'PAID' ? totals.reliquat : 0,
      caissierId: currentUser.id,
      caissierNom: currentUser.fullName,
      statut: paymentStatus,
      paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined
    });
    setLastTicket(ticket);
    setShowTicket(true);
    setCart({});
    setSelectedPatient(null);
    setMontantRecu(0);
    setIsCartOpen(false);
  };

  const increaseZoom = () => setCols(prev => Math.max(2, prev - 1));
  const decreaseZoom = () => setCols(prev => Math.min(6, prev + 1));

  const gridColsClass = {
    2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6'
  }[cols] || 'grid-cols-4';

  const titleSize = cols >= 6 ? 'text-[9px]' : cols >= 5 ? 'text-[10px]' : cols === 4 ? 'text-[12px]' : 'text-[14px]';
  const priceSize = cols >= 6 ? 'text-[10px]' : cols >= 5 ? 'text-[11px]' : cols === 4 ? 'text-[13px]' : 'text-[16px]';
  const iconSize = cols >= 6 ? 12 : cols >= 5 ? 16 : cols === 4 ? 22 : 32;

  return (
    <div className="flex flex-col space-y-4 pb-20 -mt-1 w-full max-w-full overflow-x-hidden">
      {/* Liquid Glass Search Header */}
      <div className="liquid-glass p-1.5 md:p-2 rounded-xl md:rounded-[1.5rem] sticky top-0 z-20 space-y-1.5 md:space-y-2 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-primary)]/50 group-focus-within:text-[var(--accent-color)] transition-colors" size={12} md:size={14} />
            <input 
              type="text" 
              placeholder="RECHERCHE..."
              className="w-full pl-8 pr-14 md:pl-9 md:pr-16 py-2 md:py-3 bg-[var(--bg-primary)] dark:bg-slate-900 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] outline-none border border-[var(--border-color)] focus:border-[var(--accent-color)]/50 focus:bg-white dark:focus:bg-black transition-all text-[var(--text-primary)] dark:text-white placeholder-[var(--text-secondary)]/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-24 md:right-28 top-1/2 -translate-y-1/2 text-[var(--text-primary)]/50 hover:text-[var(--text-primary)] active:scale-90 transition-transform"><X size={12} md:size={14}/></button>}
            
            <div className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[8px] md:text-[9px] font-black uppercase outline-none px-1 text-[var(--text-primary)] cursor-pointer border-r border-[var(--border-color)] mr-1"
              >
                <option value="NAME">NOM</option>
                <option value="PRICE">PRIX</option>
                <option value="STOCK">STOCK</option>
              </select>
              <button 
                onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                className="p-1 text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md active:scale-90 transition-transform"
              >
                {sortOrder === 'ASC' ? '↑' : '↓'}
              </button>
              <button 
                onClick={() => handleQuickSale()} 
                title="Vente Rapide"
                className="p-1 text-magenta hover:bg-magenta/10 rounded-md transition-all active:scale-90 animate-pulse"
              >
                <Zap size={14} md:size={16} fill="currentColor" />
              </button>
              <button 
                onClick={() => setIsScanning(true)} 
                className="p-1 text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md active:scale-90 transition-transform"
              >
                <ScanBarcode size={16} md:size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center bg-[var(--bg-primary)]/40 rounded-lg md:rounded-xl p-0.5 md:p-1 border border-[var(--border-color)]">
            <button onClick={increaseZoom} className="p-1.5 md:p-2 text-[var(--accent-color)] hover:bg-[var(--bg-primary)]/60 rounded-md transition-colors active:scale-90"><Plus size={14} md:size={16} /></button>
            <button onClick={decreaseZoom} className="p-1.5 md:p-2 text-[var(--accent-color)] hover:bg-[var(--bg-primary)]/60 rounded-md transition-colors active:scale-90"><Minus size={14} md:size={16} /></button>
          </div>
        </div>
        <div className="flex gap-1">
          {Object.values(AssuranceType).map(a => (
            <button key={a} onClick={() => setAssurance(a)} className={`flex-1 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase border transition-all duration-300 active:scale-95 squishy-button ${assurance === a ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg shadow-[var(--accent-color)]/20' : 'bg-[var(--bg-primary)]/40 text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]/60'}`}>
              {a === AssuranceType.PLEIN_TARIF ? 'PUBLIC' : a}
            </button>
          ))}
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-fade-in">
          <div className="p-6 flex justify-between items-center text-white z-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-gradient-liquid">Scanner IA</h2>
            <button onClick={() => setIsScanning(false)} className="p-3 bg-white/10 rounded-full active:scale-90 transition-transform hover:bg-white/20"><X size={24}/></button>
          </div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
            
            {/* Overlay Zone de détection avec effets clignotants */}
            <div className="relative z-10 w-72 h-48 animate-blink-frame">
              {/* Cadre de Scan */}
              <div className="absolute inset-0 border-2 border-royal/50 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)]"></div>
              
              {/* Coins de scan renforcés */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-royal rounded-tl-2xl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-royal rounded-tr-2xl"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-royal rounded-bl-2xl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-royal rounded-br-2xl"></div>
              
              {/* Ligne Laser Animée */}
              <div className="absolute left-0 right-0 h-0.5 bg-magenta shadow-[0_0_20px_rgba(255,77,109,1)] z-20 animate-scan-laser"></div>
              
              {/* Message instructif */}
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                 <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] bg-black/60 py-2 px-4 rounded-full backdrop-blur-md inline-block border border-white/10">Aligner le code</p>
              </div>
            </div>

            {scanError && <div className="absolute bottom-24 left-6 right-6 bg-magenta/20 border border-magenta/50 text-white p-4 rounded-2xl text-center text-[10px] font-bold animate-bounce-subtle backdrop-blur-md">{scanError}</div>}
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-1">
        {categories.map((cat, idx) => {
          const colors = [
            'bg-blue-500 border-blue-500 shadow-blue-500/20',
            'bg-emerald-500 border-emerald-500 shadow-emerald-500/20',
            'bg-purple-500 border-purple-500 shadow-purple-500/20',
            'bg-orange-500 border-orange-500 shadow-orange-500/20',
            'bg-rose-500 border-rose-500 shadow-rose-500/20',
            'bg-cyan-500 border-cyan-500 shadow-cyan-500/20',
            'bg-indigo-500 border-indigo-500 shadow-indigo-500/20',
          ];
          const activeColor = colors[idx % colors.length];
          
          return (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`opacity-0 animate-staggered-fade px-2 py-1 rounded-lg text-[10px] md:text-[11px] font-semibold uppercase border transition-all active:scale-90 shadow-sm stagger-${idx % 8 + 1} ${
                selectedCategory === cat 
                  ? `${activeColor} text-white shadow-lg` 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className={`grid ${gridColsClass} gap-2 md:gap-3 w-full mt-1 md:mt-2 px-1`}>
        {filteredMeds.map((med, idx) => (
          <button 
            key={med.id} 
            onClick={() => addToCart(med)} 
            className={`glass-card opacity-0 animate-staggered-fade aspect-square p-2 md:p-3 flex flex-col items-center justify-between active:scale-95 transition-all duration-300 relative overflow-hidden group stagger-${idx % 8 + 1} ${med.stock < 10 ? 'border-magenta/30 bg-magenta/5' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <span className={`absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-lg font-black text-white shadow-sm ${med.stock < 10 ? 'bg-magenta shadow-[0_0_10px_rgba(255,77,109,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'} ${cols >= 6 ? 'text-[6px]' : 'text-[8px]'}`}>{med.stock}</span>
            
            <div className="mt-0.5 text-[var(--text-primary)]/80 flex items-center justify-center flex-1 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <Pill size={iconSize} />
            </div>
            
            <div className="w-full shrink-0 relative z-10">
              <h3 className={`font-semibold ${titleSize} uppercase leading-tight line-clamp-2 mb-0.5 text-[var(--text-primary)] tracking-tighter group-hover:text-[var(--accent-color)] transition-colors`}>{med.nom}</h3>
              <p className={`font-mono font-medium text-[var(--accent-color)] ${priceSize} leading-none tracking-tighter drop-shadow-sm`}>{(assurance === AssuranceType.INAM ? med.prixInam : assurance === AssuranceType.AMU ? med.prixAmu : med.prix || 0).toLocaleString()} F</p>
            </div>
          </button>
        ))}
        {filteredMeds.length === 0 && search && (
          <div className="col-span-full py-32 text-center text-white/20 text-xs font-black uppercase animate-fade-in tracking-[0.5em]">Aucun résultat trouvé</div>
        )}
      </div>

      {cartItems.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)} 
          className={`fixed bottom-6 right-6 w-14 h-14 bg-royal text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 transition-all transform active:scale-90 ${cartPulse ? 'animate-pulse-fast' : 'animate-scale-in'}`}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-3 -right-3 bg-magenta text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce-subtle">
              {cartItems.length}
            </span>
          </div>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-[var(--bg-primary)]/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-sm h-full bg-[var(--bg-primary)] shadow-2xl animate-slide-in-right flex flex-col border-l border-[var(--border-color)]">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)] z-10">
              <h2 className="text-sm font-black uppercase text-[var(--accent-color)] tracking-widest flex items-center gap-2">
                <ShoppingCart size={18} />
                Panier Pharmacie
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-[var(--text-secondary)] p-2 hover:bg-[var(--accent-color)]/5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--bg-primary)]/50">
              {cartItems.map(item => (
                <div key={item.id} className="bg-[var(--bg-secondary)] p-3 rounded-2xl flex items-center justify-between border border-[var(--border-color)] shadow-sm animate-fade-in">
                  <div className="flex-1 pr-3 min-w-0">
                    <p className="font-black text-[11px] uppercase truncate text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-[12px] font-mono font-medium text-[var(--accent-color)]">{item.total.toLocaleString()} F</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center text-magenta shadow-sm border border-[var(--border-color)] active:scale-90 transition-transform"><Minus size={16}/></button>
                    <span className="font-black text-sm min-w-[20px] text-center text-[var(--text-primary)]">{item.quantity}</span>
                    <button onClick={() => { const med = medicaments.find(m => m.id === item.id); if (med && med.stock > item.quantity) addToCart(med); }} className="w-8 h-8 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center text-royal shadow-sm border border-[var(--border-color)] active:scale-90 transition-transform"><Plus size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 bg-[var(--bg-secondary)] backdrop-blur-md border-t border-[var(--border-color)] space-y-3">
              <PatientSelector 
                selectedPatientId={selectedPatient?.id} 
                onSelect={setSelectedPatient} 
                theme={settings.theme}
              />
              <div className="grid grid-cols-5 gap-2 mb-2">
                {[500, 1000, 2000, 5000, 10000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setMontantRecu(amt)}
                    className="py-2 bg-[var(--bg-primary)] border-b-4 border-[var(--border-color)] rounded-xl font-black text-[9px] text-[var(--text-secondary)] active:border-b-0 active:translate-y-1 transition-all hover:bg-[var(--bg-secondary)] shadow-sm"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Payment Status & Method */}
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setPaymentStatus('PAID')} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${paymentStatus === 'PAID' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'}`}
                >
                  Payé
                </button>
                <button 
                  onClick={() => setPaymentStatus('PENDING')} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${paymentStatus === 'PENDING' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'}`}
                >
                  Non Payé
                </button>
              </div>

              {paymentStatus === 'PAID' && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['ESPECES', 'TMONEY', 'FLOOZ', 'CHEQUE', 'VIREMENT', 'ASSURANCE'].map(method => (
                    <button 
                      key={method} 
                      onClick={() => setPaymentMethod(method as any)}
                      className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${paymentMethod === method ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20' : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="MONTANT REÇU..." className="px-5 py-3.5 bg-white rounded-2xl font-mono font-medium text-emerald-600 text-[12px] outline-none border border-slate-100 focus:border-emerald-500 shadow-sm" value={montantRecu || ''} onChange={(e) => setMontantRecu(Number(e.target.value))} />
                <div className="px-5 py-3.5 bg-slate-100/50 rounded-2xl font-mono font-medium text-magenta text-[11px] text-center flex items-center justify-center border border-slate-200">REL : {totals.reliquat.toLocaleString()} F</div>
              </div>
              <div className="bg-[var(--accent-color)] p-4 rounded-[1.8rem] flex justify-between items-center text-white shadow-xl shadow-[var(--accent-color)]/20">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-80">NET À PAYER :</span>
                <span className="text-2xl font-mono font-medium tracking-tighter">{totals.net.toLocaleString()} F</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm uppercase active:scale-95 transition-all hover:bg-slate-200"
                >
                  Retour
                </button>
                <button 
                  onClick={handleCheckout} 
                  disabled={cartItems.length === 0} 
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm uppercase disabled:opacity-30 active:scale-95 transition-all shadow-lg hover:bg-slate-900"
                >
                  Valider & Imprimer Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showTicket && lastTicket && <TicketModal ticket={lastTicket} onClose={() => setShowTicket(false)} />}
    </div>
  );
};

export default PharmacyModule;
