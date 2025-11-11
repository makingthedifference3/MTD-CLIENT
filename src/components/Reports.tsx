import { Download } from 'lucide-react';
import { allRealTimeUpdates as realTimeUpdates, allReports as mockReports } from '../data/mockData';

interface ReportsProps {
  projectId: string | null;
  projects: Array<{ id: string; name: string }>;
}

export default function Reports({ projectId, projects }: ReportsProps) {
  // Filter based on selected project or show all
  const updates = projectId 
    ? realTimeUpdates.filter(u => u.project_id === projectId)
    : realTimeUpdates;
  const reports = projectId 
    ? mockReports.filter(r => r.project_id === projectId)
    : mockReports;

  // Get current project name for display
  const currentProjectName = projectId 
    ? projects.find(p => p.id === projectId)?.name 
    : null;

  function handleDownload(url: string) {
    window.open(url, '_blank');
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {currentProjectName ? `📄 ${currentProjectName} - Reports` : '📄 ALL PROJECTS - REPORTS'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific reports and updates' : 'Combined reports from all projects'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-purple-200 p-6 shadow-2xl hover:shadow-purple-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6 pb-4 border-b-2 border-purple-200">
              📢 REAL TIME UPDATE
            </h2>

            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 transition-all duration-300 group border border-transparent hover:border-purple-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {update.title} - {new Date(update.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  {update.is_downloadable && (
                    <button
                      onClick={() => handleDownload(update.drive_link)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                      style={{ borderRadius: '9999px' }}
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOADS
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-indigo-200 p-6 shadow-2xl hover:shadow-indigo-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-6 pb-4 border-b-2 border-indigo-200">
              📄 REPORTS
            </h2>

            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-50 transition-all duration-300 group border border-transparent hover:border-indigo-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {report.title}
                    </p>
                    <p className="text-xs text-slate-600 font-semibold">
                      📅 {new Date(report.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload(report.drive_link)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                    style={{ borderRadius: '9999px' }}
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOADS
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
