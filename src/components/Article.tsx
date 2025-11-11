import { Download } from 'lucide-react';
import { allArticles as mockArticles, allMediaVideos as mediaVideos } from '../data/mockData';

interface ArticleProps {
  projectId: string | null;
  projects: Array<{ id: string; name: string }>;
}

export default function Article({ projectId, projects }: ArticleProps) {
  // Filter based on selected project or show all
  const articles = projectId 
    ? mockArticles.filter(a => a.project_id === projectId)
    : mockArticles;
  const videos = projectId 
    ? mediaVideos.filter(v => v.project_id === projectId).slice(0, 5)
    : mediaVideos.slice(0, 5);

  // Get current project name for display
  const currentProjectName = projectId 
    ? projects.find(p => p.id === projectId)?.name 
    : null;

  function handleDownload(url: string) {
    window.open(url, '_blank');
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600">
            {currentProjectName ? `📰 ${currentProjectName} - Articles` : '📰 ALL PROJECTS - ARTICLES'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific newspaper cuttings and videos' : 'Combined articles from all projects'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-rose-200 p-6 shadow-2xl hover:shadow-rose-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 mb-6 pb-4 border-b-2 border-rose-200">
              📰 NEWSPAPER CUTTINGS
            </h2>

            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-rose-50 transition-all duration-300 group border border-transparent hover:border-rose-200 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      {article.title} - {new Date(article.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {article.is_featured && (
                      <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs shadow-lg animate-pulse overflow-hidden" style={{ borderRadius: '9999px' }}>
                        ⚡ TIME NOW
                      </span>
                    )}

                    <button
                      onClick={() => handleDownload(article.drive_link)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                      style={{ borderRadius: '9999px' }}
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOADS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-orange-200 p-6 shadow-2xl hover:shadow-orange-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-6 pb-4 border-b-2 border-orange-200">
              🎬 VIDEOS
            </h2>

            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50 transition-all duration-300 group border border-transparent hover:border-orange-200 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {video.title} - {new Date(video.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs shadow-lg animate-pulse overflow-hidden" style={{ borderRadius: '9999px' }}>
                      ⚡ TIME NOW
                    </span>

                    <button
                      onClick={() => handleDownload(video.drive_link)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                      style={{ borderRadius: '9999px' }}
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOADS
                    </button>
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
