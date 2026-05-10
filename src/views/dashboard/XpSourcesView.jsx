export default function XpSourcesView({ xpBars }) {
  return (
    <div className="space-y-4">
      {xpBars.length === 0 && <p className="text-sm text-slate-600">Sync repository data to see your XP sources.</p>}
      {xpBars.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-slate-900" style={{ width: item.width }} />
          </div>
        </div>
      ))}
    </div>
  );
}
