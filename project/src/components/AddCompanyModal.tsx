import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AddCompanyModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddCompanyModal({ onClose, onSuccess }: AddCompanyModalProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('ログインが必要です');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('companies').insert({
      name: name.trim(),
      industry: industry.trim(),
      website: website.trim(),
      location: location.trim(),
      description: description.trim(),
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding company:', error);
      alert('企業の追加に失敗しました');
    } else {
      onSuccess();
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">新しい企業を追加</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例: 株式会社サンプル"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                業界
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例: IT・ソフトウェア"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                場所
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例: 東京都渋谷区"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ウェブサイト
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例: https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                企業説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="企業の詳細や特徴を入力してください"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
