import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Trash2, Save, Copy, BookOpen, X, Download, Upload } from 'lucide-react';
import { supabase, Company, EntrySheet, Template } from '../lib/supabase';
import { demoCompanies, demoESData } from '../lib/demoData';

type ESPageProps = {
  onLoginRequired?: () => void;
};

const commonThemes = [
  '志望動機',
  '自己PR',
  '学生時代に力を入れたこと',
  '長所・短所',
  'キャリアプラン',
  '困難を乗り越えた経験',
  'チームワーク経験',
  'リーダーシップ経験',
];

export default function ESPage({ onLoginRequired }: ESPageProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [entrySheets, setEntrySheets] = useState<EntrySheet[]>([]);
  const [selectedES, setSelectedES] = useState<EntrySheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const [editForm, setEditForm] = useState({
    theme: '',
    content: '',
  });
  const [charLimit, setCharLimit] = useState<number | null>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) return;

      setIsLoadingCompany(true);

      const demoCompany = demoCompanies.find(c => c.id === companyId);
      if (demoCompany) {
        setCompany(demoCompany);
        setIsLoadingCompany(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();

        if (data && !error) {
          setCompany(data as Company);
        }
      }

      setIsLoadingCompany(false);
    };

    loadCompany();
  }, [companyId]);

  const loadEntrySheets = useCallback(async () => {
    if (!company) return;

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const demoData = demoESData.filter(es => es.company_id === company.id);
      setEntrySheets(demoData as EntrySheet[]);
      if (demoData.length > 0) {
        setSelectedES(demoData[0] as EntrySheet);
        setEditForm({
          theme: demoData[0].theme || '',
          content: demoData[0].content || '',
        });
      }
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('entry_sheets')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading entry sheets:', error);
    } else {
      setEntrySheets(data || []);
      if (data && data.length > 0) {
        setSelectedES(data[0]);
        setEditForm({
          theme: data[0].theme,
          content: data[0].content,
        });
      }
    }
    setIsLoading(false);
  }, [company]);

  const loadTemplates = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'es')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
  }, []);

  useEffect(() => {
    loadEntrySheets();
    loadTemplates();
  }, [loadEntrySheets, loadTemplates]);

  const createNewES = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const { data, error } = await supabase
      .from('entry_sheets')
      .insert({
        company_id: company.id,
        user_id: user.id,
        theme: '',
        content: '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating entry sheet:', error);
    } else {
      setEntrySheets([data, ...entrySheets]);
      setSelectedES(data);
      setEditForm({
        theme: '',
        content: '',
      });
    }
  };

  const saveES = async () => {
    if (!selectedES) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('entry_sheets')
      .update({
        theme: editForm.theme,
        content: editForm.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedES.id);

    if (error) {
      console.error('Error saving entry sheet:', error);
      alert('保存に失敗しました');
    } else {
      loadEntrySheets();
    }
    setIsSaving(false);
  };

  const deleteES = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    if (!confirm('このESを削除しますか？')) return;

    const { error } = await supabase
      .from('entry_sheets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry sheet:', error);
    } else {
      const updatedSheets = entrySheets.filter(es => es.id !== id);
      setEntrySheets(updatedSheets);
      if (selectedES?.id === id) {
        if (updatedSheets.length > 0) {
          setSelectedES(updatedSheets[0]);
          setEditForm({
            theme: updatedSheets[0].theme,
            content: updatedSheets[0].content,
          });
        } else {
          setSelectedES(null);
          setEditForm({ theme: '', content: '' });
        }
      }
    }
  };

  const selectES = (es: EntrySheet) => {
    setSelectedES(es);
    setEditForm({
      theme: es.theme,
      content: es.content,
    });
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(editForm.content);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('コピーに失敗しました');
    }
  };

  const selectTheme = (theme: string) => {
    setEditForm({ ...editForm, theme });
    setShowThemeDropdown(false);
  };

  const saveAsTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    if (!templateName.trim() || !editForm.content.trim()) {
      alert('テンプレート名と内容を入力してください');
      return;
    }

    const { error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        type: 'es',
        theme: templateName,
        content: editForm.content,
      });

    if (error) {
      console.error('Error saving template:', error);
      alert('テンプレートの保存に失敗しました');
    } else {
      setTemplateName('');
      setShowSaveTemplateModal(false);
      loadTemplates();
      alert('テンプレートを保存しました');
    }
  };

  const loadTemplate = (template: Template) => {
    setEditForm({ ...editForm, content: template.content });
    setShowTemplateModal(false);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return;

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
    } else {
      loadTemplates();
    }
  };

  if (isLoadingCompany || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Link
              to={`/companies/${company.id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">戻る</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              <span className="truncate">{company.name} - ES</span>
            </h1>
          </div>
          <Link
            to={`/companies/${company.id}`}
            className="sr-only"
          >
            {company.name}の基本情報・企業詳細ページを見る
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative">
          <div className={`w-full transition-all ${showAnalysis ? 'lg:w-[15%]' : 'lg:w-1/4'}`}>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">ES一覧</h2>
              <button
                onClick={createNewES}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="新規作成"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : entrySheets.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">ESがありません</p>
            ) : (
              <div className="space-y-2">
                {entrySheets.map((es) => (
                  <div
                    key={es.id}
                    onClick={() => selectES(es)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedES?.id === es.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">
                          {es.theme || '無題のES'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(es.updated_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteES(es.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          <div className={`w-full flex-1 transition-all ${showAnalysis ? 'lg:flex-none lg:w-[55%]' : 'lg:w-3/4'}`}>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 relative">
            {!selectedES ? (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">ESを選択するか、新規作成してください</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">ES編集</h2>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm flex-1 sm:flex-initial"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">{showAnalysis ? '企業分析を閉じる' : '企業分析を見る'}</span>
                      <span className="sm:hidden">分析</span>
                    </button>
                    <button
                      onClick={saveES}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm flex-1 sm:flex-initial"
                    >
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    テーマ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.theme}
                      onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                      onFocus={() => setShowThemeDropdown(true)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="テーマを入力または選択"
                    />
                    {showThemeDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowThemeDropdown(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {commonThemes.map((theme) => (
                            <button
                              key={theme}
                              onClick={() => selectTheme(theme)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-slate-700"
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      内容
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            if (onLoginRequired) {
                              onLoginRequired();
                            }
                            return;
                          }
                          setShowTemplateModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        title="テンプレートを読み込む"
                      >
                        <Download className="w-4 h-4" />
                        テンプレート読込
                      </button>
                      <button
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            if (onLoginRequired) {
                              onLoginRequired();
                            }
                            return;
                          }
                          setShowSaveTemplateModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        title="テンプレートとして保存"
                      >
                        <Upload className="w-4 h-4" />
                        テンプレート保存
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={charLimit || ''}
                          onChange={(e) => setCharLimit(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="文字数制限"
                          className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-xs text-slate-500">文字以内</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        charLimit && editForm.content.replace(/\n/g, '').length > charLimit
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {editForm.content.replace(/\n/g, '').length} 文字
                      </span>
                      <button
                        onClick={copyContent}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                        title="内容をコピー"
                      >
                        <Copy className="w-4 h-4" />
                        {showCopyFeedback ? 'コピー済み!' : 'コピー'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={20}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono"
                    placeholder="ESの内容を入力してください..."
                  />
                </div>
              </div>
            )}
            </div>
          </div>

          {showAnalysis && (
            <div className="hidden lg:block w-full lg:w-[30%] transition-all">
              <div className="bg-white rounded-xl shadow-md p-6 max-h-[calc(100vh-200px)] overflow-y-auto sticky top-8">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  企業分析
                </h2>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: '売上', value: company.revenue },
                  { label: '従業員数', value: company.employee_count },
                  { label: '資本金', value: company.capital },
                  { label: '理念', value: company.philosophy },
                  { label: '製品', value: company.products },
                  { label: '事業内容', value: company.business_content },
                  { label: '部門業務', value: company.department_operations },
                  { label: 'キャリアプラン', value: company.career_plan },
                  { label: '社風', value: company.company_culture },
                  { label: '競合比較', value: company.competitive_comparison },
                  { label: '成長性', value: company.growth_potential },
                  { label: '採用数', value: company.hiring_count },
                  { label: '年収', value: company.average_salary },
                  { label: '福利厚生', value: company.benefits },
                  { label: '平均勤続年数', value: company.average_tenure },
                  { label: '残業時間', value: company.overtime_hours },
                  { label: 'CM', value: company.commercials },
                  { label: '中期経営計画', value: company.mid_term_plan },
                ].map((field) => (
                  field.value && (
                    <div key={field.label} className="bg-slate-50 rounded-lg p-3">
                      <h3 className="font-semibold text-slate-800 text-sm mb-1">{field.label}</h3>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{field.value}</p>
                    </div>
                  )
                ))}
                {![
                  company.revenue, company.employee_count, company.capital,
                  company.philosophy, company.products, company.business_content,
                  company.department_operations, company.career_plan, company.company_culture,
                  company.competitive_comparison, company.growth_potential, company.hiring_count,
                  company.average_salary, company.benefits, company.average_tenure,
                  company.overtime_hours, company.commercials, company.mid_term_plan
                ].some(v => v) && (
                  <p className="text-center text-slate-500 text-sm py-8">企業分析が入力されていません</p>
                )}
              </div>
              </div>
            </div>
          )}
        </div>

      {showAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 lg:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  {company.name} - 企業分析
                </h2>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                {[
                  { label: '売上', value: company.revenue },
                  { label: '従業員数', value: company.employee_count },
                  { label: '資本金', value: company.capital },
                  { label: '理念', value: company.philosophy },
                  { label: '製品', value: company.products },
                  { label: '事業内容', value: company.business_content },
                  { label: '部門業務', value: company.department_operations },
                  { label: 'キャリアプラン', value: company.career_plan },
                  { label: '社風', value: company.company_culture },
                  { label: '競合比較', value: company.competitive_comparison },
                  { label: '成長性', value: company.growth_potential },
                  { label: '採用数', value: company.hiring_count },
                  { label: '年収', value: company.average_salary },
                  { label: '福利厚生', value: company.benefits },
                  { label: '平均勤続年数', value: company.average_tenure },
                  { label: '残業時間', value: company.overtime_hours },
                  { label: 'CM', value: company.commercials },
                  { label: '中期経営計画', value: company.mid_term_plan },
                ].map((field) => (
                  field.value && (
                    <div key={field.label} className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">{field.label}</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{field.value}</p>
                    </div>
                  )
                ))}
                {![
                  company.revenue, company.employee_count, company.capital,
                  company.philosophy, company.products, company.business_content,
                  company.department_operations, company.career_plan, company.company_culture,
                  company.competitive_comparison, company.growth_potential, company.hiring_count,
                  company.average_salary, company.benefits, company.average_tenure,
                  company.overtime_hours, company.commercials, company.mid_term_plan
                ].some(v => v) && (
                  <p className="text-center text-slate-500 py-8">企業分析が入力されていません</p>
                )}
              </div>
            </div>
          </div>
        )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">テンプレート読み込み</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {templates.length === 0 ? (
                <p className="text-center text-slate-500 py-8">保存されたテンプレートがありません</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-2">{template.theme}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{template.content}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadTemplate(template)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              読み込む
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">テンプレートとして保存</h2>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  テンプレート名
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="例: 自己PR、ガクチカ"
                />
              </div>
              <button
                onClick={saveAsTemplate}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
