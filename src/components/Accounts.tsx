import { projects } from '../data/mockData';

interface AccountsProps {
  projectId: string | null;
  projects: Array<{ id: string; name: string }>;
}

export default function Accounts({ projectId, projects: projectsList }: AccountsProps) {
  // Calculate totals based on selected project or all projects
  const relevantProjects = projectId 
    ? projects.filter(p => p.id === projectId)
    : projects;

  const totalBudget = relevantProjects.reduce((sum, p) => sum + p.total_budget, 0);
  const utilizedBudget = relevantProjects.reduce((sum, p) => sum + p.utilized_budget, 0);
  
  const utilizedPercentage = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;
  const pendingPercentage = 100 - utilizedPercentage;

  // Get current project name for display
  const currentProjectName = projectId 
    ? projectsList.find(p => p.id === projectId)?.name 
    : null;

  const circumference = 2 * Math.PI * 90;
  const utilizedOffset = circumference - (utilizedPercentage / 100) * circumference;
  const pendingOffset = circumference - (pendingPercentage / 100) * circumference;

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            {currentProjectName ? `💰 ${currentProjectName} - Funds Utilization` : '💰 ALL PROJECTS - FUNDS UTILIZATION'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific budget data' : 'Combined budget from all projects'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-emerald-200 p-8 shadow-2xl">

          <div className="flex items-center justify-center gap-16">
            <div className="relative w-96 h-96 group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              
              <svg className="relative w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="24"
                />

                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gradient-utilized)"
                  strokeWidth="24"
                  strokeDasharray={circumference}
                  strokeDashoffset={utilizedOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />

                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gradient-pending)"
                  strokeWidth="24"
                  strokeDasharray={circumference}
                  strokeDashoffset={pendingOffset}
                  strokeLinecap="round"
                  transform={`rotate(${(utilizedPercentage / 100) * 360} 100 100)`}
                  className="transition-all duration-1000"
                />

                <defs>
                  <linearGradient id="gradient-utilized" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gradient-pending" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    {utilizedPercentage.toFixed(0)}%
                  </p>
                  <p className="text-sm font-bold text-slate-600 mt-2">UTILIZED</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="group hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg group-hover:shadow-xl transition-shadow"></div>
                  <span className="text-xl font-black text-slate-700">UTILIZED</span>
                </div>
                <p className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent ml-11">
                  {utilizedPercentage.toFixed(1)}%
                </p>
                <p className="text-sm font-semibold text-slate-600 ml-11 mt-1">
                  ₹{utilizedBudget.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="group hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 shadow-lg group-hover:shadow-xl transition-shadow"></div>
                  <span className="text-xl font-black text-slate-700">PENDING</span>
                </div>
                <p className="text-5xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent ml-11">
                  {pendingPercentage.toFixed(1)}%
                </p>
                <p className="text-sm font-semibold text-slate-600 ml-11 mt-1">
                  ₹{(totalBudget - utilizedBudget).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
