import { 
  Users, 
  ArrowLeft,
  Bell
} from 'lucide-react';
import KnowledgeSharingApp from './KnowledgeSharingApp';

export default function CommunityHubApp() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Community Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="lobby.html" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <ArrowLeft size={20} />
              </a>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                  <Users size={18} />
                </div>
                <h1 className="text-lg font-bold text-slate-900">Góc Cộng đồng</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                <Bell size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          <KnowledgeSharingApp isNested={true} />
        </div>
      </main>
    </div>
  );
}
