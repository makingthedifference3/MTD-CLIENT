import { allTimelines as mockTimelines } from '../data/mockData';

interface TimelinesProps {
  projectId: string | null;
  projects: Array<{ id: string; name: string }>;
}

export default function Timelines({ projectId, projects }: TimelinesProps) {
  // Filter timelines based on selected project or show all
  const timelines = projectId 
    ? mockTimelines.filter(t => t.project_id === projectId)
    : mockTimelines;

  // Get current project name for display
  const currentProjectName = projectId 
    ? projects.find(p => p.id === projectId)?.name 
    : null;

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  function getPosition(date: string) {
    const targetDate = new Date(date);
    const daysFromStart = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  }

  function getWidth(start: string, end: string) {
    const startPos = getPosition(start);
    const endPos = getPosition(end);
    return endPos - startPos;
  }

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2025, i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
            {currentProjectName ? `📅 ${currentProjectName} - Timelines` : '📅 ALL PROJECTS - TIMELINES'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific Gantt chart' : `Combined Gantt chart from all projects (${timelines.length} timelines)`}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-purple-200 p-8 shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"></div>
                <span className="text-sm font-black text-slate-700">✅ Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 shadow-lg"></div>
                <span className="text-sm font-black text-slate-700">⏳ In Progress</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <div className="flex mb-6 pb-3 border-b-2 border-purple-100 bg-violet-50/50 rounded-t-xl sticky top-0 z-10 min-w-max">
              <div className="w-32 text-center text-sm font-black text-purple-700 py-2 flex items-center justify-center shrink-0">
                PHASES
              </div>
              <div className="flex flex-1 gap-1 px-2">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center text-xs font-black text-violet-600 py-2 min-w-[70px]"
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            <div 
              className="space-y-4 mt-4 min-w-max overflow-y-auto pr-2"
              style={{ 
                maxHeight: projectId ? 'none' : '500px',
              }}
            >
              {timelines.map((timeline) => (
                <div key={timeline.id} className="relative h-12 group flex">
                  <div className="w-32 text-xs font-bold text-slate-700 text-right pr-3 group-hover:text-purple-600 transition-colors leading-tight py-1 shrink-0">
                    <div className="break-words text-[10px]">
                      {timeline.title}
                    </div>
                  </div>

                  <div className="relative h-full flex-1 px-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-purple-100"
                        style={{ left: `${(i / 12) * 100}%` }}
                      />
                    ))}

                    <div
                      className="absolute top-1/2 -translate-y-1/2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-xs font-black text-white group-hover:scale-105 overflow-hidden"
                      style={{
                        left: `${getPosition(timeline.start_date)}%`,
                        width: `${getWidth(timeline.start_date, timeline.end_date)}%`,
                        background: timeline.color === '#10b981' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        minWidth: '60px',
                        height: projectId ? '40px' : '28px',
                        borderRadius: projectId ? '20px' : '14px',
                      }}
                    >
                      <span className="drop-shadow-lg px-2">{timeline.completion_percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
