import { useState, useEffect } from 'react';
import { supabase, EntrySheet, Template, Company } from '../lib/supabase';
import { ChevronDown, ChevronUp, Copy, Check, Save, FileText, Trash2, ArrowUpDown, Filter } from 'lucide-react';

type EntrySheetWithCompany = EntrySheet & {
  company_name: string;
};

type ExpandedItem = {
  type: 'template' | 'es';
  id: string;
};

type SortOption = 'created_at' | 'motivation_level' | 'es_deadline';

export default function ESListPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [entrySheets, setEntrySheets] = useState<EntrySheetWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedItem, setExpandedItem] = useState<ExpandedItem | null>(null);
  const [editingItem, setEditingItem] = useState<ExpandedItem | null>(null);
  const [editTheme, setEditTheme] = useState('');
  const [editContent, setEditContent] = useState('');
  const [charLimit, setCharLimit] = useState(400);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const [templatesResult, entrySheetsResult, companiesResult] = await Promise.all([
      supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'es')
        .order('created_at', { ascending: false }),
      supabase
        .from('entry_sheets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
    ]);

    if (templatesResult.data) {
      setTemplates(templatesResult.data);
    }

    if (entrySheetsResult.data && companiesResult.data) {
      const companyMap = new Map(companiesResult.data.map(c => [c.id, c.name]));
      const esWithCompany = entrySheetsResult.data.map(es => ({
        ...es,
        company_name: companyMap.get(es.company_id) || '不明な企業'
      }));
      setEntrySheets(esWithCompany);
      setCompanies(companiesResult.data);
    }

    setIsLoading(false);
  };

  const toggleExpand = (type: 'template' | 'es', id: string) => {
    if (expandedItem?.type === type && expandedItem?.id === id) {
      setExpandedItem(null);
      setEditingItem(null);
    } else {
      setExpandedItem({ type, id });
      setEditingItem(null);
    }
  };

  const startEdit = (type: 'template' | 'es', id: string, theme: string, content: string) => {
    setEditingItem({ type, id });
    setEditTheme(theme);
    setEditContent(content);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditTheme('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingItem.type === 'template') {
      const { error } = await supabase
        .from('templates')
        .update({
          theme: editTheme,
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (!error) {
        await loadData();
        setEditingItem(null);
      }
    } else {
      const { error } = await supabase
        .from('entry_sheets')
        .update({
          theme: editTheme,
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (!error) {
        await loadData();
        setEditingItem(null);
      }
    }
  };

  const deleteItem = async (type: 'template' | 'es', id: string) => {
    if (!confirm('本当に削除しますか？')) return;

    const table = type === 'template' ? 'templates' : 'entry_sheets';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (!error) {
      await loadData();
      setExpandedItem(null);
      setEditingItem(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))).sort();

  const filteredCompanies = selectedIndustry === 'all'
    ? companies
    : companies.filter(c => c.industry === selectedIndustry);

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'motivation_level') {
      return b.motivation_level - a.motivation_level;
    } else if (sortBy === 'es_deadline') {
      const aDate = a.es_deadline ? new Date(a.es_deadline).getTime() : Infinity;
      const bDate = b.es_deadline ? new Date(b.es_deadline).getTime() : Infinity;
      return aDate - bDate;
    }
    return 0;
  });

  const groupedES = sortedCompanies.reduce((acc, company) => {
    const companyES = entrySheets.filter(es => es.company_id === company.id);
    if (companyES.length > 0) {
      acc[company.id] = {
        company,
        entries: companyES
      };
    }
    return acc;
  }, {} as Record<string, { company: Company; entries: EntrySheetWithCompany[] }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">ログインしてES一覧を表示</p>
        </div>
      </div>
    );
  }

  const renderESItem = (
    type: 'template' | 'es',
    id: string,
    theme: string,
    content: string,
    companyName?: string
  ) => {
    const isExpanded = expandedItem?.type === type && expandedItem?.id === id;
    const isEditing = editingItem?.type === type && editingItem?.id === id;
    const displayContent = isEditing ? editContent : content;
    const displayTheme = isEditing ? editTheme : theme;
    const charCount = displayContent.length;

    return (
      <div key={id} className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => toggleExpand(type, id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{displayTheme || '(タイトルなし)'}</h3>
            {companyName && (
              <p className="text-sm text-slate-500 mt-1">{companyName}</p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-200">
            <div className="mt-4 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={editTheme}
                      onChange={(e) => setEditTheme(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      文字数制限
                    </label>
                    <input
                      type="number"
                      value={charLimit}
                      onChange={(e) => setCharLimit(parseInt(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        内容
                      </label>
                      <span className={`text-sm ${charCount > charLimit ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        {charCount} / {charLimit}文字
                      </span>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        内容
                      </label>
                      <span className="text-sm text-slate-500">
                        {charCount}文字
                      </span>
                    </div>
                    <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 whitespace-pre-wrap min-h-[200px]">
                      {content || '(内容なし)'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(type, id, theme, content)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => copyToClipboard(content)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          コピー済み
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          コピー
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteItem(type, id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">ES一覧</h1>
          </div>
          <p className="text-slate-600">
            テンプレートと各企業のES台本を管理します
          </p>
        </div>

        {Object.keys(groupedES).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Filter className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="flex-1 sm:flex-initial px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="all">全ての業界</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <ArrowUpDown className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="flex-1 sm:flex-initial px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="created_at">登録日順</option>
                  <option value="motivation_level">志望度順</option>
                  <option value="es_deadline">ES締切順</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {templates.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                テンプレート
              </h2>
              <div className="space-y-3">
                {templates.map(template =>
                  renderESItem('template', template.id, template.theme, template.content)
                )}
              </div>
            </div>
          )}

          {Object.keys(groupedES).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-600 rounded"></span>
                企業別ES
              </h2>
              <div className="space-y-6">
                {Object.values(groupedES).map(({ company, entries }) => (
                  <div key={company.id}>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3 pl-2">
                      {company.name}
                    </h3>
                    <div className="space-y-3 ml-4">
                      {entries.map(entry =>
                        renderESItem('es', entry.id, entry.theme, entry.content, entry.company_name)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && Object.keys(groupedES).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                まだESが登録されていません
              </p>
              <p className="text-slate-500 text-sm mt-2">
                企業ページからESを作成してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
