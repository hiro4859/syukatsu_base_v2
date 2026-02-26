import { useState, useEffect,useCallback  } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Eye, EyeOff } from 'lucide-react';
import { supabase, Company } from '../lib/supabase';
import { demoCompanies } from '../lib/demoData';

type CompanyAnalysisPageProps = {
  onLoginRequired?: () => void;
};

type CustomField = {
  id: string;
  user_id: string;
  field_name: string;
  field_key: string;
  order_index: number;
  is_active: boolean;
  tab_category: string;
};

type CompanyCustomField = {
  id: string;
  company_id: string;
  field_key: string;
  value: string;
};

type TabType = 'basic' | 'business' | 'culture' | 'memo';

const basicInfoFields = [
  { key: 'revenue', label: '売上高' },
  { key: 'employee_count', label: '従業員数' },
  { key: 'capital', label: '資本金' },
  { key: 'hiring_count', label: '採用人数' },
  { key: 'average_salary', label: '平均年収' },
  { key: 'benefits', label: '福利厚生' },
  { key: 'average_tenure', label: '平均勤続年数' },
  { key: 'overtime_hours', label: '平均残業時間' },
];

const businessFields = [
  { key: 'business_content', label: '事業内容' },
  { key: 'products', label: '製品・サービス' },
  { key: 'department_operations', label: '部署・業務内容' },
  { key: 'competitive_comparison', label: '競合比較' },
  { key: 'growth_potential', label: '成長性・将来性' },
  { key: 'commercials', label: 'CM・広告' },
  { key: 'mid_term_plan', label: '中期経営計画' },
];

const cultureFields = [
  { key: 'philosophy', label: '企業理念' },
  { key: 'company_culture', label: '社風・文化' },
  { key: 'career_plan', label: 'キャリアパス' },
];

export default function CompanyAnalysisPage({
  onLoginRequired,
}: CompanyAnalysisPageProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [personalMemo, setPersonalMemo] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [newFieldName, setNewFieldName] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const loadCustomFields = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_analysis_fields')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('order_index');

    if (!error && data) {
      setCustomFields(data);
    }
  }, []);

  const loadCustomFieldValues = useCallback(async () => {
    if (!company) return;

    const { data, error } = await supabase
      .from('company_custom_fields')
      .select('*')
      .eq('company_id', company.id);

    if (!error && data) {
      const values: Record<string, string> = {};
      data.forEach((item: CompanyCustomField) => {
        values[item.field_key] = item.value;
      });
      setCustomFieldValues(values);
    }
  }, [company]);

  const loadHiddenFields = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('hidden_analysis_fields')
      .select('field_key')
      .eq('user_id', user.id);

    if (!error && data) {
      setHiddenFields(new Set(data.map((item: any) => item.field_key)));
    }
  }, []);

  const initializeFormData = useCallback(() => {
    if (!company) return;

    const initialData: Record<string, string> = {};
    const allFields = [...basicInfoFields, ...businessFields, ...cultureFields];

    allFields.forEach(field => {
      const value = company[field.key as keyof Company];
      initialData[field.key] = (typeof value === 'string' ? value : '') || '';
    });

    setFormData(initialData);
    setPersonalMemo((company as any).personal_analysis_memo || '');
  }, [company]);

  useEffect(() => {
    loadCustomFields();
    loadCustomFieldValues();
    loadHiddenFields();
    initializeFormData();
  }, [loadCustomFields, loadCustomFieldValues, loadHiddenFields, initializeFormData]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const toggleFieldVisibility = async (fieldKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (hiddenFields.has(fieldKey)) {
      await supabase
        .from('hidden_analysis_fields')
        .delete()
        .eq('user_id', user.id)
        .eq('field_key', fieldKey);

      setHiddenFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    } else {
      await supabase
        .from('hidden_analysis_fields')
        .insert({ user_id: user.id, field_key: fieldKey });

      setHiddenFields(prev => new Set(prev).add(fieldKey));
    }
  };

  const addCustomField = async () => {
    if (!newFieldName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fieldKey = `custom_${Date.now()}`;
    const { error } = await supabase
      .from('custom_analysis_fields')
      .insert({
        user_id: user.id,
        field_name: newFieldName,
        field_key: fieldKey,
        order_index: customFields.length,
        is_active: true,
        tab_category: activeTab,
      });

    if (!error) {
      await loadCustomFields();
      setNewFieldName('');
      setIsAddingField(false);
    }
  };

  const deleteCustomField = async (fieldId: string) => {
    await supabase
      .from('custom_analysis_fields')
      .delete()
      .eq('id', fieldId);

    await loadCustomFields();
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    setIsSaving(true);

    const updateData: any = {
      ...formData,
      personal_analysis_memo: personalMemo,
    };

    if (!company) return;

    const { error: companyError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', company.id);

    if (companyError) {
      console.error('Error updating company:', companyError);
      alert('保存に失敗しました');
      setIsSaving(false);
      return;
    }

    for (const [fieldKey, value] of Object.entries(customFieldValues)) {
      const { data: existing } = await supabase
        .from('company_custom_fields')
        .select('id')
        .eq('company_id', company.id)
        .eq('field_key', fieldKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('company_custom_fields')
          .update({ value })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('company_custom_fields')
          .insert({
            company_id: company.id,
            field_key: fieldKey,
            value,
          });
      }
    }

    const { data: updated } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company.id)
      .maybeSingle();

    if (updated) {
      setCompany(updated as Company);
    }

    setIsSaving(false);
    alert('保存しました');
  };

  const renderFields = (fields: typeof basicInfoFields, category: TabType) => {
    const categoryCustomFields = customFields.filter(f => f.tab_category === category);
    const visibleFields = fields.filter(f => !hiddenFields.has(f.key));
    const allFields = [...visibleFields, ...categoryCustomFields];

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {visibleFields.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {field.label}
                </label>
                <button
                  onClick={() => toggleFieldVisibility(field.key)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[80px]"
                placeholder={`${field.label}を入力...`}
              />
            </div>
          ))}

          {categoryCustomFields.map((field) => (
            <div key={field.id}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {field.field_name}
                </label>
                <button
                  onClick={() => deleteCustomField(field.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={customFieldValues[field.field_key] || ''}
                onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[80px]"
                placeholder={`${field.field_name}を入力...`}
              />
            </div>
          ))}
        </div>

        {isAddingField && activeTab === category && (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="新しいフィールド名"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingField(false);
                  setNewFieldName('');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {!isAddingField && (
          <button
            onClick={() => setIsAddingField(true)}
            className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            カスタムフィールドを追加
          </button>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'basic' as TabType, label: '基礎情報' },
    { id: 'business' as TabType, label: '事業と製品' },
    { id: 'culture' as TabType, label: '企業文化・理念' },
    { id: 'memo' as TabType, label: '個人メモ・分析' },
  ];

  if (isLoadingCompany || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
            <Link
              to={`/companies/${company.id}`}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-3 sm:mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              戻る
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">{company.name}</h1>
            <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">企業分析</p>
            <Link
              to={`/companies/${company.id}`}
              className="sr-only"
            >
              {company.name}の基本情報・企業詳細ページを見る
            </Link>
          </div>

          <div className="border-b border-slate-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap transition-colors text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'basic' && renderFields(basicInfoFields, 'basic')}
            {activeTab === 'business' && renderFields(businessFields, 'business')}
            {activeTab === 'culture' && renderFields(cultureFields, 'culture')}

            {activeTab === 'memo' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  個人メモ・分析
                </label>
                <textarea
                  value={personalMemo}
                  onChange={(e) => setPersonalMemo(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[400px]"
                  placeholder="この企業に対する個人的な分析やメモを自由に記入してください..."
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {hiddenFields.size > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <EyeOff className="w-5 h-5" />
              非表示フィールド
            </h3>
            <div className="space-y-2">
              {[...basicInfoFields, ...businessFields, ...cultureFields]
                .filter(f => hiddenFields.has(f.key))
                .map((field) => (
                  <button
                    key={field.key}
                    onClick={() => toggleFieldVisibility(field.key)}
                    className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>{field.label}</span>
                    <Eye className="w-4 h-4" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
