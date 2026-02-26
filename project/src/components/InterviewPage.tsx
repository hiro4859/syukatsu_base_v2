import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, Trash2, Save, BookOpen, X, Download, Upload } from 'lucide-react';
import { supabase, Company, Interview, Template } from '../lib/supabase';
import { demoCompanies, demoInterviewData } from '../lib/demoData';

type InterviewPageProps = {
  onLoginRequired?: () => void;
};

const commonThemes = [
  '自己紹介',
  '志望動機',
  '学生時代に力を入れたこと',
  '長所・短所',
  'キャリアプラン',
  '逆質問',
  '困難を乗り越えた経験',
  'チームワーク経験',
  'リーダーシップ経験',
  '企業選びの軸',
];

export default function InterviewPage({ onLoginRequired }: InterviewPageProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const [editForm, setEditForm] = useState({
    theme: '',
    content: '',
    script: '',
    actual_qa: '',
    answer_satisfaction: null as number | null,
    manner_evaluation: null as number | null,
    interviewer_reaction: '',
    improvement_notes: '',
  });
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

  const loadInterviews = useCallback(async () => {
    if (!company) return;

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const demoData = demoInterviewData.filter(iv => iv.company_id === company.id);
      setInterviews(demoData as Interview[]);
      if (demoData.length > 0) {
        setSelectedInterview(demoData[0] as Interview);
        setEditForm({
          theme: demoData[0].theme || '',
          content: demoData[0].content || '',
          script: demoData[0].script || '',
          actual_qa: demoData[0].actual_qa || '',
          answer_satisfaction: demoData[0].answer_satisfaction || null,
          manner_evaluation: demoData[0].manner_evaluation || null,
          interviewer_reaction: demoData[0].interviewer_reaction || '',
          improvement_notes: demoData[0].improvement_notes || '',
        });
      }
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading interviews:', error);
    } else {
      setInterviews(data || []);
      if (data && data.length > 0) {
        setSelectedInterview(data[0]);
        setEditForm({
          theme: data[0].theme,
          content: data[0].content,
          script: data[0].script || '',
          actual_qa: data[0].actual_qa || '',
          answer_satisfaction: data[0].answer_satisfaction,
          manner_evaluation: data[0].manner_evaluation,
          interviewer_reaction: data[0].interviewer_reaction || '',
          improvement_notes: data[0].improvement_notes || '',
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
      .eq('type', 'interview')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
    loadTemplates();
  }, [loadInterviews, loadTemplates]);

  const createNewInterview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const { data, error } = await supabase
      .from('interviews')
      .insert({
        company_id: company.id,
        user_id: user.id,
        theme: '',
        content: '',
        script: '',
        actual_qa: '',
        interviewer_reaction: '',
        improvement_notes: '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interview:', error);
    } else {
      setInterviews([data, ...interviews]);
      setSelectedInterview(data);
      setEditForm({
        theme: '',
        content: '',
        script: '',
        actual_qa: '',
        answer_satisfaction: null,
        manner_evaluation: null,
        interviewer_reaction: '',
        improvement_notes: '',
      });
    }
  };

  const saveInterview = async () => {
    if (!selectedInterview) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('interviews')
      .update({
        theme: editForm.theme,
        content: editForm.content,
        script: editForm.script,
        actual_qa: editForm.actual_qa,
        answer_satisfaction: editForm.answer_satisfaction,
        manner_evaluation: editForm.manner_evaluation,
        interviewer_reaction: editForm.interviewer_reaction,
        improvement_notes: editForm.improvement_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedInterview.id);

    if (error) {
      console.error('Error saving interview:', error);
      alert('保存に失敗しました');
    } else {
      loadInterviews();
    }
    setIsSaving(false);
  };

  const deleteInterview = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    if (!confirm('この面接準備を削除しますか？')) return;

    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting interview:', error);
    } else {
      const updatedInterviews = interviews.filter(iv => iv.id !== id);
      setInterviews(updatedInterviews);
      if (selectedInterview?.id === id) {
        if (updatedInterviews.length > 0) {
          setSelectedInterview(updatedInterviews[0]);
          setEditForm({
            theme: updatedInterviews[0].theme,
            content: updatedInterviews[0].content,
            script: updatedInterviews[0].script || '',
            actual_qa: updatedInterviews[0].actual_qa || '',
            answer_satisfaction: updatedInterviews[0].answer_satisfaction,
            manner_evaluation: updatedInterviews[0].manner_evaluation,
            interviewer_reaction: updatedInterviews[0].interviewer_reaction || '',
            improvement_notes: updatedInterviews[0].improvement_notes || '',
          });
        } else {
          setSelectedInterview(null);
          setEditForm({ theme: '', content: '', script: '', actual_qa: '', answer_satisfaction: null, manner_evaluation: null, interviewer_reaction: '', improvement_notes: '' });
        }
      }
    }
  };

  const selectInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setEditForm({
      theme: interview.theme,
      content: interview.content,
      script: interview.script || '',
      actual_qa: interview.actual_qa || '',
      answer_satisfaction: interview.answer_satisfaction,
      manner_evaluation: interview.manner_evaluation,
      interviewer_reaction: interview.interviewer_reaction || '',
      improvement_notes: interview.improvement_notes || '',
    });
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
        type: 'interview',
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
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              <span className="truncate">{company.name} - 面接</span>
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
              <h2 className="text-lg font-bold text-slate-800">面接一覧</h2>
              <button
                onClick={createNewInterview}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                title="新規作成"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : interviews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">面接準備がありません</p>
            ) : (
              <div className="space-y-2">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    onClick={() => selectInterview(interview)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedInterview?.id === interview.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">
                          {interview.theme || '無題の面接'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(interview.updated_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInterview(interview.id);
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
            {!selectedInterview ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">面接準備を選択するか、新規作成してください</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">面接準備</h2>
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
                      onClick={saveInterview}
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500"
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
                              className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors text-slate-700"
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
                      話す内容
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
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 resize-none font-mono"
                    placeholder="面接で話す内容を入力してください..."
                  />
                  <div className="mt-2 text-right text-sm text-slate-500">
                    {editForm.content.length} 文字
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    面接台本
                  </label>
                  <textarea
                    value={editForm.script}
                    onChange={(e) => setEditForm({ ...editForm, script: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                    placeholder="面接で使う台本を書いてください..."
                  />
                  <div className="mt-2 text-right text-sm text-slate-500">
                    {editForm.script.length} 文字
                  </div>
                </div>

                <div className="border-t-2 border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">面接後の振り返り</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        聞かれたこと・どう答えたか
                      </label>
                      <textarea
                        value={editForm.actual_qa}
                        onChange={(e) => setEditForm({ ...editForm, actual_qa: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                        placeholder="質問内容と実際の回答を記録してください..."
                      />
                      <div className="mt-2 text-right text-sm text-slate-500">
                        {editForm.actual_qa.length} 文字
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        改善点
                      </label>
                      <textarea
                        value={editForm.improvement_notes}
                        onChange={(e) => setEditForm({ ...editForm, improvement_notes: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                        placeholder="次回に向けた改善点を記録してください..."
                      />
                      <div className="mt-2 text-right text-sm text-slate-500">
                        {editForm.improvement_notes.length} 文字
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        面接官の反応
                      </label>
                      <textarea
                        value={editForm.interviewer_reaction}
                        onChange={(e) => setEditForm({ ...editForm, interviewer_reaction: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                        placeholder="面接官の反応や雰囲気を記録してください..."
                      />
                      <div className="mt-2 text-right text-sm text-slate-500">
                        {editForm.interviewer_reaction.length} 文字
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          回答の満足度 (1-5)
                        </label>
                        <select
                          value={editForm.answer_satisfaction || ''}
                          onChange={(e) => setEditForm({ ...editForm, answer_satisfaction: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500"
                        >
                          <option value="">未選択</option>
                          <option value="1">1 - 不満</option>
                          <option value="2">2 - やや不満</option>
                          <option value="3">3 - 普通</option>
                          <option value="4">4 - 良い</option>
                          <option value="5">5 - 非常に良い</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          話し方の評価 (1-5)
                        </label>
                        <select
                          value={editForm.manner_evaluation || ''}
                          onChange={(e) => setEditForm({ ...editForm, manner_evaluation: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500"
                        >
                          <option value="">未選択</option>
                          <option value="1">1 - 不満</option>
                          <option value="2">2 - やや不満</option>
                          <option value="3">3 - 普通</option>
                          <option value="4">4 - 良い</option>
                          <option value="5">5 - 非常に良い</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
                      className="p-4 border-2 border-slate-200 rounded-lg hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-2">{template.theme}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{template.content}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadTemplate(template)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-green-500"
                  placeholder="例: 自己紹介、ガクチカ"
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
