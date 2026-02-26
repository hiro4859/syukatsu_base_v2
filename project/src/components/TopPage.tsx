import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, Plus, Calendar, CheckCircle, ArrowUpDown, Filter, Clock, Star, ChevronDown, ChevronUp, ListTodo } from 'lucide-react';
import { supabase, Company, Task } from '../lib/supabase';
import { demoCompanies, demoTasks } from '../lib/demoData';

type TopPageProps = {
  onAddCompany: () => void;
  onLoginRequired?: () => void;
};

type TaskWithCompany = Task & {
  company_name: string;
};

type DeadlineItem = {
  id: string;
  title: string;
  due_date: string;
  company_id: string;
  company_name: string;
  type: 'task' | 'es' | 'webtest';
  completed?: boolean;
};

type SortOption = 'created_at' | 'es_deadline' | 'motivation_level';

export default function TopPage({ onAddCompany, onLoginRequired }: TopPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDeadlineCollapsed, setIsDeadlineCollapsed] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [companyTasks, setCompanyTasks] = useState<{ [key: string]: DeadlineItem[] }>({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskCompanyId, setNewTaskCompanyId] = useState<string>('');

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading companies:', error);
      } else {
        setCompanies(data || []);
      }
    } else {
      setIsAuthenticated(false);
      setCompanies(demoCompanies);
    }

    setIsLoading(false);
  }, []);

  const loadUpcomingTasks = useCallback(async (showAll: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const demoDeadlines: DeadlineItem[] = (demoTasks as TaskWithCompany[]).map(task => ({
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        company_id: task.company_id,
        company_name: task.company_name,
        type: 'task' as const,
        completed: task.completed,
      }));
      setUpcomingTasks(demoDeadlines);
      return;
    }

    const today = new Date();
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const oneWeekLaterStr = oneWeekLater.toISOString().split('T')[0];
    const deadlines: DeadlineItem[] = [];

    let tasksQuery = supabase
      .from('tasks')
      .select('id, title, due_date, company_id, completed')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('due_date', todayStr)
      .order('due_date', { ascending: true });

    if (!showAll) {
      tasksQuery = tasksQuery.lte('due_date', oneWeekLaterStr);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('Error loading tasks:', tasksError);
    }

    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, es_deadline, webtest_deadline')
      .eq('user_id', user.id);

    if (companiesError) {
      console.error('Error loading companies:', companiesError);
    }

    const companyMap = new Map(companiesData?.map(c => [c.id, c]) || []);

    if (tasks) {
      tasks.forEach(task => {
        const company = companyMap.get(task.company_id);
        deadlines.push({
          id: `task-${task.id}`,
          title: task.title,
          due_date: task.due_date,
          company_id: task.company_id,
          company_name: company?.name || 'Unknown',
          type: 'task',
          completed: task.completed,
        });
      });
    }

    if (companiesData) {
      companiesData.forEach(company => {
        if (company.es_deadline && company.es_deadline >= todayStr) {
          if (showAll || company.es_deadline <= oneWeekLaterStr) {
            deadlines.push({
              id: `es-${company.id}`,
              title: 'ES締切',
              due_date: company.es_deadline,
              company_id: company.id,
              company_name: company.name,
              type: 'es',
            });
          }
        }
        if (company.webtest_deadline && company.webtest_deadline >= todayStr) {
          if (showAll || company.webtest_deadline <= oneWeekLaterStr) {
            deadlines.push({
              id: `webtest-${company.id}`,
              title: 'Webテスト締切',
              due_date: company.webtest_deadline,
              company_id: company.id,
              company_name: company.name,
              type: 'webtest',
            });
          }
        }
      });
    }

    deadlines.sort((a, b) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setUpcomingTasks(showAll ? deadlines : deadlines.slice(0, 5));
  }, []);

  const toggleTaskComplete = useCallback(async (deadlineId: string, type: string) => {
    if (type !== 'task') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const taskId = deadlineId.replace('task-', '');

    const { error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadUpcomingTasks(showAllDeadlines);
    }
  }, [loadUpcomingTasks, onLoginRequired, showAllDeadlines]);

  useEffect(() => {
    loadCompanies();
    loadUpcomingTasks(showAllDeadlines);
  }, [loadCompanies, loadUpcomingTasks, showAllDeadlines]);

  useEffect(() => {
    let filtered = [...companies];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.industry.toLowerCase().includes(query) ||
          (company.location && company.location.toLowerCase().includes(query))
      );
    }

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(
        (company) => company.industry === selectedIndustry
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'es_deadline') {
        const aDate = a.es_deadline ? new Date(a.es_deadline).getTime() : Infinity;
        const bDate = b.es_deadline ? new Date(b.es_deadline).getTime() : Infinity;
        return aDate - bDate;
      } else if (sortBy === 'motivation_level') {
        return b.motivation_level - a.motivation_level;
      }
      return 0;
    });

    setFilteredCompanies(filtered);
  }, [searchQuery, companies, sortBy, selectedIndustry]);

  const industries = useMemo(() =>
    ['all', ...Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))].sort(),
    [companies]
  );

  const loadCompanyTasks = async (companyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const deadlines: DeadlineItem[] = [];

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, completed')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error('Error loading tasks:', tasksError);
    }

    if (tasks) {
      tasks.forEach((task) => {
        deadlines.push({
          id: `task-${task.id}`,
          title: task.title,
          due_date: task.due_date,
          company_id: companyId,
          company_name: '',
          type: 'task',
          completed: task.completed,
        });
      });
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('es_deadline, webtest_deadline')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) {
      console.error('Error loading company:', companyError);
    }

    if (company) {
      if (company.es_deadline) {
        deadlines.push({
          id: `es-${companyId}`,
          title: 'ES締切',
          due_date: company.es_deadline,
          company_id: companyId,
          company_name: '',
          type: 'es',
        });
      }
      if (company.webtest_deadline) {
        deadlines.push({
          id: `webtest-${companyId}`,
          title: 'Webテスト締切',
          due_date: company.webtest_deadline,
          company_id: companyId,
          company_name: '',
          type: 'webtest',
        });
      }
    }

    deadlines.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setCompanyTasks(prev => ({ ...prev, [companyId]: deadlines }));
  };

  const toggleCompanyTasks = async (companyId: string) => {
    setExpandedCompanyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });

    if (!companyTasks[companyId]) {
      await loadCompanyTasks(companyId);
    }
  };

  const toggleCompanyTaskComplete = async (taskId: string, companyId: string) => {
    const realTaskId = taskId.replace('task-', '');

    const { error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', realTaskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      await loadCompanyTasks(companyId);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <ListTodo className="w-4 h-4" />;
      case 'es':
        return <Calendar className="w-4 h-4" />;
      case 'webtest':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'タスク';
      case 'es':
        return 'ES';
      case 'webtest':
        return 'Webテスト';
      default:
        return '';
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const taskData: {
      user_id: string;
      title: string;
      description: string;
      due_date: string | null;
      completed: boolean;
      company_id?: string;
    } = {
      user_id: user.id,
      title: newTaskTitle,
      description: '',
      due_date: newTaskDueDate || null,
      completed: false,
    };

    if (newTaskCompanyId) {
      taskData.company_id = newTaskCompanyId;
    }

    const { error } = await supabase
      .from('tasks')
      .insert(taskData);

    if (error) {
      console.error('Error adding task:', error);
      alert('タスクの追加に失敗しました');
    } else {
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskCompanyId('');
      setShowAddTask(false);
      loadUpcomingTasks(showAllDeadlines);
    }
  };

  const renderStars = (level: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= level ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {showAllDeadlines ? '全ての締切' : '直近の締切'}
                  </h2>
                  <button
                    onClick={() => setShowAllDeadlines(!showAllDeadlines)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    {showAllDeadlines ? '直近のみ' : '全て表示'}
                  </button>
                </div>
                <button
                  onClick={() => setIsDeadlineCollapsed(!isDeadlineCollapsed)}
                  className="text-slate-600 hover:text-slate-800 transition-colors p-1"
                  aria-label={isDeadlineCollapsed ? '展開する' : '折りたたむ'}
                >
                  {isDeadlineCollapsed ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!isDeadlineCollapsed && (
                <>
                  {!showAddTask ? (
                    <button
                      onClick={() => {
                        if (!isAuthenticated && onLoginRequired) {
                          onLoginRequired();
                        } else {
                          setShowAddTask(true);
                        }
                      }}
                      className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      タスクを追加
                    </button>
                  ) : (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border-2 border-blue-300">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="タスク名"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <select
                          value={newTaskCompanyId}
                          onChange={(e) => setNewTaskCompanyId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        >
                          <option value="">企業を選択（任意）</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddTask}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                          >
                            追加
                          </button>
                          <button
                            onClick={() => {
                              setShowAddTask(false);
                              setNewTaskTitle('');
                              setNewTaskDueDate('');
                              setNewTaskCompanyId('');
                            }}
                            className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {upcomingTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm">締切予定のタスクはありません</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map((deadline) => (
                        <Link
                          key={deadline.id}
                          to={`/companies/${deadline.company_id}`}
                          className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {deadline.title}
                              </p>
                              <p className="text-xs text-slate-600 truncate">
                                {deadline.company_name}
                              </p>
                            </div>
                            {deadline.type === 'task' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleTaskComplete(deadline.id, deadline.type);
                                }}
                                className="text-slate-400 hover:text-green-600 transition-colors flex-shrink-0"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(deadline.due_date)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2 sm:mb-3 px-4">
                就活基地
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg px-4 max-w-3xl mx-auto">
                企業研究からES作成、面接対策まで一元管理。志望企業の詳細情報を記録し、選考フローを可視化。ESのテーマ別管理や面接の振り返り機能で、内定獲得までの道のりをサポートします。企業分析シートで強み・弱みを整理し、効果的な自己PRを作成しましょう。
              </p>
              {!isAuthenticated && (
                <p className="text-blue-600 text-sm sm:text-base px-4 max-w-3xl mx-auto mt-3 font-medium">
                  現在はログイン前のため、企業カードをクリックして企業詳細ページ、ES、面接、企業分析ページの閲覧のみ可能です。
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="企業名、業界、場所で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={onAddCompany}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  企業を追加
                </button>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Filter className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  >
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry === 'all' ? '全ての業界' : industry}
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
                    <option value="es_deadline">ES締切順</option>
                    <option value="motivation_level">志望度順</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  {searchQuery || selectedIndustry !== 'all'
                    ? '該当する企業が見つかりませんでした'
                    : '企業を追加して始めましょう'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500"
                  >
                    <Link
                      to={`/companies/${company.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {company.image_url ? (
                          <img
                            src={company.image_url}
                            alt={company.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-1 truncate">
                            {company.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mb-2">{company.industry}</p>

                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(company.motivation_level)}
                          </div>

                          {company.current_status && (
                            <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                              {company.current_status}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            {company.es_deadline && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Calendar className="w-3 h-3" />
                                <span>ES: {formatDate(company.es_deadline)}</span>
                              </div>
                            )}
                            {company.next_selection_date && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3 h-3" />
                                <span>次回: {formatDate(company.next_selection_date)}</span>
                              </div>
                            )}
                          </div>

                          <span className="sr-only">
                            {company.name}の詳細情報を見る
                          </span>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleCompanyTasks(company.id);
                      }}
                      className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <ListTodo className="w-4 h-4" />
                      タスク
                      {expandedCompanyIds.has(company.id) ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>

                    {expandedCompanyIds.has(company.id) && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                        {companyTasks[company.id] && companyTasks[company.id].length > 0 ? (
                          companyTasks[company.id].map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-lg border transition-all ${
                                item.completed
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-slate-50 border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div
                                    className={`p-1.5 rounded ${
                                      item.type === 'task'
                                        ? 'bg-blue-100 text-blue-600'
                                        : item.type === 'es'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}
                                  >
                                    {getTaskIcon(item.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span
                                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                          item.type === 'task'
                                            ? 'bg-blue-100 text-blue-700'
                                            : item.type === 'es'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-purple-100 text-purple-700'
                                        }`}
                                      >
                                        {getTaskTypeLabel(item.type)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm font-medium mb-1 ${
                                        item.completed
                                          ? 'text-slate-400 line-through'
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      {item.title}
                                    </p>
                                    {item.due_date && (
                                      <div className="flex items-center gap-1 text-xs text-slate-600">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(item.due_date)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.type === 'task' && !item.completed && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleCompanyTaskComplete(item.id, company.id);
                                    }}
                                    className="text-slate-400 hover:text-green-600 transition-colors flex-shrink-0"
                                    title="完了にする"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">
                            タスクや締切はありません
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
