import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Mail, Lock, GraduationCap, Building2, BookOpen, Calendar } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { useSeo } from '../hooks/useSeo';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    department: '',
    graduation_year: null as number | null,
  });

  useSeo('アカウント設定 | 就活基地', 'アカウント情報の確認・変更');

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/');
      return;
    }

    setEmail(user.email || '');

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as UserProfile);
      setFormData({
        full_name: profileData.full_name || '',
        university: profileData.university || '',
        department: profileData.department || '',
        graduation_year: profileData.graduation_year || null,
      });
    } else if (!profileError) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: '',
          university: '',
          department: '',
          graduation_year: null,
        });

      if (!insertError) {
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (newProfile) {
          setProfile(newProfile as UserProfile);
        }
      }
    }

    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: formData.full_name,
        university: formData.university,
        department: formData.department,
        graduation_year: formData.graduation_year,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの保存に失敗しました');
    } else {
      alert('プロフィールを保存しました');
      loadAccountData();
    }

    setIsSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      alert('メールアドレスを入力してください');
      return;
    }

    if (!currentPassword) {
      alert('現在のパスワードを入力してください');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      console.error('Error updating email:', error);
      alert('メールアドレスの更新に失敗しました');
    } else {
      alert('メールアドレスを更新しました');
    }

    setIsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      alert('現在のパスワードを入力してください');
      return;
    }

    if (!newPassword || !confirmPassword) {
      alert('新しいパスワードを入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('新しいパスワードが一致しません');
      return;
    }

    if (newPassword.length < 6) {
      alert('パスワードは6文字以上にしてください');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('Error updating password:', error);
      alert('パスワードの更新に失敗しました');
    } else {
      alert('パスワードを更新しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            アカウント設定
          </h1>
          <p className="text-slate-600 mt-2">アカウント情報の確認・変更</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              プロフィール情報
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <User className="w-4 h-4" />
                  氏名
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  大学名
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="〇〇大学"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <BookOpen className="w-4 h-4" />
                  学部
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="〇〇学部"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  卒業予定年度
                </label>
                <input
                  type="number"
                  value={formData.graduation_year || ''}
                  onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2025"
                  min="2020"
                  max="2030"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <Save className="w-5 h-5" />
                プロフィールを保存
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              メールアドレス変更
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Mail className="w-4 h-4" />
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Lock className="w-4 h-4" />
                  現在のパスワード（確認用）
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="現在のパスワード"
                />
              </div>

              <button
                onClick={handleUpdateEmail}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <Save className="w-5 h-5" />
                メールアドレスを更新
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              パスワード変更
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Lock className="w-4 h-4" />
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="現在のパスワード"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Lock className="w-4 h-4" />
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="新しいパスワード（6文字以上）"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Lock className="w-4 h-4" />
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="新しいパスワード（確認）"
                />
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <Save className="w-5 h-5" />
                パスワードを更新
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
