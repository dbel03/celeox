export default function Header() {
  return (
    <header className="bg-slate-800 text-white px-5 py-3 flex justify-between items-center border-b border-slate-700 z-10 shadow-md">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <span>⛰️</span> Visor de Montaña
      </h1>
      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
        v1.0 - IGN & OSM
      </span>
    </header>
  );
}