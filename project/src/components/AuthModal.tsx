import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {isLogin ? 'ログイン' : '新規登録'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors mt-4 sm:mt-6 text-sm sm:text-base"
          >
            {isSubmitting ? '処理中...' : isLogin ? 'ログイン' : '登録'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
            >
              {isLogin ? 'アカウントを作成' : 'ログインに戻る'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
