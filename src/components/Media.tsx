import { Download, ChevronDown } from 'lucide-react';
import { allMediaPhotos as mediaPhotos, allMediaVideos as mediaVideos } from '../data/mockData';

interface MediaProps {
  projectId: string | null;
  projects: Array<{ id: string; name: string }>;
}

export default function Media({ projectId, projects }: MediaProps) {
  // Filter based on selected project or show all
  const photos = projectId 
    ? mediaPhotos.filter(m => m.project_id === projectId)
    : mediaPhotos;
  const videos = projectId 
    ? mediaVideos.filter(m => m.project_id === projectId)
    : mediaVideos;

  // Get current project name for display
  const currentProjectName = projectId 
    ? projects.find(p => p.id === projectId)?.name 
    : null;

  function handleDownload(url: string) {
    window.open(url, '_blank');
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
            {currentProjectName ? `📸 ${currentProjectName} - Media` : '📸 ALL PROJECTS - MEDIA'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific photos and videos' : 'Combined media from all projects'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-teal-200 p-6 shadow-2xl hover:shadow-teal-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-6 pb-4 border-b-2 border-teal-200">
              📸 PHOTOS
            </h2>

            <div className="space-y-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-teal-50 transition-all duration-300 group border border-transparent hover:border-teal-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {photo.is_geo_tagged && '📍 '}
                      {photo.title} - {new Date(photo.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload(photo.drive_link)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                    style={{ borderRadius: '9999px' }}
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOADS
                  </button>
                </div>
              ))}

              {photos.length > 5 && (
                <div className="flex justify-center pt-4">
                  <button className="p-3 hover:bg-teal-100 rounded-full transition-all hover:scale-110 duration-300 bg-teal-50">
                    <ChevronDown className="w-5 h-5 text-teal-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-cyan-200 p-6 shadow-2xl hover:shadow-cyan-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 mb-6 pb-4 border-b-2 border-cyan-200">
              🎥 VIDEOS
            </h2>

            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-cyan-50 transition-all duration-300 group border border-transparent hover:border-cyan-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      {video.is_geo_tagged && '📍 '}
                      {video.title} - {new Date(video.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload(video.drive_link)}
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
