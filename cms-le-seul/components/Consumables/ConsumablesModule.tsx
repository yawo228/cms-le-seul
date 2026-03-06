import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Consumable } from '../../types';
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, Save, X } from 'lucide-react';

const ConsumablesModule: React.FC = () => {
  const { consumables, addConsumable, updateConsumable, deleteConsumable } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Consumable | null>(null);
  const [formData, setFormData] = useState<Partial<Consumable>>({
    name: '',
    stock: 0,
    minStock: 10,
    unit: 'unité'
  });

  const filteredConsumables = consumables.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateConsumable(editingItem.id, formData);
    } else {
      addConsumable({
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Nouveau Consommable',
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 0,
        unit: formData.unit || 'unité',
        lastRestockDate: new Date().toISOString()
      });
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', stock: 0, minStock: 10, unit: 'unité' });
  };

  const openEdit = (item: Consumable) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', stock: 0, minStock: 10, unit: 'unité' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="text-emerald-500" />
            Gestion des Consommables
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez le stock des consommables utilisés pour les soins et analyses</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          Nouveau Consommable
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un consommable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConsumables.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Package size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-500">
                  <Edit size={16} />
                </button>
                <button onClick={() => deleteConsumable(item.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{item.name}</h3>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Stock Actuel</span>
                <span className={`text-2xl font-mono font-bold ${item.stock <= item.minStock ? 'text-red-500' : 'text-emerald-600'}`}>
                  {item.stock} <span className="text-sm font-normal text-gray-400">{item.unit}</span>
                </span>
              </div>
              {item.stock <= item.minStock && (
                <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full animate-pulse">
                  <AlertTriangle size={12} />
                  STOCK CRITIQUE
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredConsumables.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            Aucun consommable trouvé.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingItem ? 'Modifier Consommable' : 'Nouveau Consommable'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du consommable</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Initial</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: ml, kit, pcs"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seuil d'alerte (Stock Min)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {editingItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumablesModule;
