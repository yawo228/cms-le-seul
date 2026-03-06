
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Pill, 
  Stethoscope, 
  FlaskConical,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC = () => {
  const { tickets, medicaments } = useStore();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTickets = tickets.filter(t => t.date.startsWith(today));
    
    const revenueToday = todayTickets.reduce((acc, t) => acc + t.netAPayer, 0);
    const pharmacyToday = todayTickets.filter(t => t.type === 'PHARMACY').length;
    const consultationToday = todayTickets.filter(t => t.type === 'CONSULTATION').length;
    
    const lowStock = medicaments.filter(m => m.stock < m.stockMin).length;

    return [
      { label: "Recettes Aujourd'hui", value: `${revenueToday.toLocaleString()} F`, icon: TrendingUp, color: "blue", trend: "+12%" },
      { label: "Ventes Pharmacie", value: pharmacyToday, icon: Pill, color: "green", trend: "+5%" },
      { label: "Consultations", value: consultationToday, icon: Stethoscope, color: "orange", trend: "0%" },
      { label: "Alerte Stocks", value: lowStock, icon: TrendingDown, color: "red", trend: "-2" },
    ];
  }, [tickets, medicaments]);

  // Chart Data: Last 7 days revenue
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    tickets.forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (data[dateStr] !== undefined) {
        data[dateStr] += t.netAPayer;
      }
    });

    return Object.entries(data).map(([date, revenue]) => ({
      name: date.split('-').slice(1).join('/'),
      revenue
    }));
  }, [tickets]);

  const typeDistribution = useMemo(() => {
    const counts = { PHARMACY: 0, CONSULTATION: 0, LABORATORY: 0, NURSING: 0 };
    tickets.forEach(t => {
      counts[t.type]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Bonjour, Administrateur</h1>
          <p className="text-[var(--text-secondary)] mt-1">Voici le résumé des activités du centre aujourd'hui.</p>
        </div>
        <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] px-4 py-2 rounded-xl shadow-sm border border-[var(--border-color)]">
          <Activity className="text-royal" size={20} />
          <span className="font-medium text-sm text-[var(--text-secondary)] uppercase tracking-wider">État du Système: Optimal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] group hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-[var(--text-secondary)]'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <h3 className="text-[var(--text-secondary)] text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Recettes (7 derniers jours)</h2>
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-3 h-3 bg-royal rounded-full"></span>
              <span className="text-[var(--text-secondary)]">Recettes Net</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: 'var(--text-primary)'}}
                  cursor={{stroke: 'var(--border-color)', strokeWidth: 1}}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-8">Répartition des Services</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {typeDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-[var(--text-secondary)]">{entry.name}</span>
                </div>
                <span className="font-bold text-[var(--text-primary)]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stock Table Shortcut */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Stocks en Alerte</h2>
          <button className="text-royal text-sm font-semibold hover:underline">Voir tout l'inventaire</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Médicament</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Stock Actuel</th>
              <th className="px-6 py-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {medicaments.filter(m => m.stock < 20).slice(0, 5).map(med => (
              <tr key={med.id} className="hover:bg-[var(--bg-primary)]/50 transition">
                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{med.nom}</td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">{med.categorie}</td>
                <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{med.stock}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${med.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {med.stock < 10 ? 'CRITIQUE' : 'BAS'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
