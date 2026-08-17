export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-800 text-slate-200 border-r border-slate-700 p-5 flex flex-col gap-6 z-10 overflow-y-auto">
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Filtros & Puntos de Interés
        </h2>
        
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500/20" 
            />
            <span>💧 Fuentes de Agua</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500/20" 
            />
            <span>⛰️ Picos y Cumbres</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500/20" 
            />
            <span>🛖 Refugios</span>
          </label>
        </div>
      </div>

      <hr className="border-slate-700" />

      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Cargar Rutas
        </h2>
        <button className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>📂</span> Importar GPX
        </button>
      </div>
    </aside>
  );
}