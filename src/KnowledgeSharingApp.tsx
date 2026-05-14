import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Tag, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Clock, 
  User, 
  LayoutGrid, 
  Send
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KnowledgePost } from './types/knowledge';

const STORAGE_KEY = 'hocviet_knowledge_posts';

const INITIAL_POSTS: KnowledgePost[] = [
  {
    id: '1',
    title: 'Cách ghi nhớ công thức Vật lý hiệu quả',
    content: '# Phương pháp ghi nhớ\n\nSử dụng sơ đồ tư duy (Mindmap) để kết nối các công thức liên quan.\n\n### Ví dụ:\nCác công thức về động lực học: F = ma, P = mg...',
    author: 'Admin',
    tags: ['Học tập', 'Vật lý'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: 12
  },
  {
    id: '2',
    title: 'Top 5 website luyện IELTS Speaking',
    content: '1. SmallTalk2Me\n2. IELTS Liz\n3. Cambridge English...',
    author: 'Lan Anh',
    tags: ['Tiếng Anh', 'IELTS'],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    likes: 45
  }
];

export default function KnowledgeSharingApp({ isNested = false }: { isNested?: boolean }) {
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedPost, setSelectedPost] = useState<KnowledgePost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    tags: ''
  });

  // Load posts
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        // Ensure that posts have basic valid structure
        const safePosts = Array.isArray(parsedPosts) ? parsedPosts.map(p => ({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : [],
          content: p.content || '',
          title: p.title || '',
          likes: p.likes || 0,
        })) : INITIAL_POSTS;
        setPosts(safePosts);
      } catch (e) {
        setPosts(INITIAL_POSTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      }
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    }
  }, []);

  // Save posts
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter(p => {
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (p.content || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = !activeTag || (p.tags || []).includes(activeTag);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [posts, searchTerm, activeTag]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: KnowledgePost = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      author: formData.author || 'Ẩn danh',
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      createdAt: Date.now(),
      likes: 0
    };
    setPosts([newPost, ...posts]);
    setFormData({ title: '', content: '', author: '', tags: '' });
    setView('list');
  };

  const handleLike = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleShare = (post: KnowledgePost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `Xem bài viết: ${post.title} trên HọcViệt`,
        url: window.location.href
      });
    } else {
      alert('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  return (
    <div className={`bg-slate-50 text-slate-900 font-sans ${isNested ? 'h-full flex flex-col' : 'min-h-screen'}`}>
      {/* Header */}
      {!isNested && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view !== 'list' && (
                <button 
                  onClick={() => setView('list')}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="text-xl font-bold text-teal-700">Chia sẻ Kiến thức</h1>
            </div>
            
            {view === 'list' && (
              <button 
                onClick={() => setView('form')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm shadow-teal-200"
              >
                <Plus size={18} />
                <span>Đóng góp</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Embedded Action Bar when Nested */}
      {isNested && view === 'list' && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <p className="text-sm font-bold text-slate-500">Góc Kiến thức</p>
          <button 
            onClick={() => setView('form')}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Viết bài</span>
          </button>
        </div>
      )}

      <main className={`max-w-6xl mx-auto px-4 py-8 ${isNested ? 'flex-1 overflow-y-auto' : ''}`}>
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Search & Tabs */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveTag(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeTag ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Tất cả
                  </button>
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTag === tag ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <motion.article 
                      layoutId={post.id}
                      key={post.id}
                      onClick={() => {
                        setSelectedPost(post);
                        setView('detail');
                      }}
                      className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-900/5 transition-all cursor-pointer flex flex-col h-full"
                    >
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(post.tags || []).map(t => (
                          <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-teal-700 transition-colors mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">
                        {(post.content || '').replace(/[#*`]/g, '')}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <User size={14} />
                          <span className="font-medium">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Heart size={14} /> {post.likes}
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bài viết</h3>
                  <p className="text-slate-500">Hãy thử đổi từ khóa hoặc bộ lọc tag khác.</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Thêm bài viết mới</h2>
                    <p className="text-slate-500">Chia sẻ kiến thức bổ ích cho cộng đồng.</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Tiêu đề bài viết</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      placeholder="Ví dụ: Cách giải toán nhanh..."
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">Tác giả</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Tên của bạn..."
                        value={formData.author}
                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">Tags (cách nhau bởi dấu phẩy)</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Toán học, Mẹo vặt..."
                        value={formData.tags}
                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Nội dung (Hỗ trợ Markdown)</label>
                    <textarea 
                      required
                      rows={8}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                      placeholder="Nhập nội dung bài viết ở đây..."
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setView('list')}
                      className="flex-1 px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-900/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Đăng bài
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'detail' && selectedPost && (
            <motion.article
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                {/* Single detail view header */}
                <div className="p-8 md:p-12 border-b border-slate-100">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(selectedPost.tags || []).map(t => (
                      <span key={t} className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-bold text-slate-700">{selectedPost.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 prose prose-slate prose-teal max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedPost.content}
                  </ReactMarkdown>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(selectedPost.id)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-pink-500 hover:text-pink-600 rounded-xl transition-all shadow-sm font-bold"
                    >
                      <Heart size={20} className={selectedPost.likes > 0 ? "fill-pink-500 text-pink-500" : ""} />
                      <span>{selectedPost.likes} Thích</span>
                    </button>
                    <button 
                      onClick={() => handleShare(selectedPost)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-600 rounded-xl transition-all shadow-sm"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-medium"
                  >
                    <ArrowLeft size={18} />
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-8 right-8 md:hidden">
        <button 
          onClick={() => setView('form')}
          className="w-14 h-14 bg-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
