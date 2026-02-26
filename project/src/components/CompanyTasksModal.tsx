import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, ListTodo, FileText, Monitor } from 'lucide-react';
import { supabase, Task } from '../lib/supabase';

type CompanyTasksModalProps = {
  companyId: string;
  companyName: string;
  onClose: () => void;
};

type DeadlineItem = {
  id: string;
  title: string;
  due_date: string | null;
  type: 'task' | 'es' | 'webtest';
  completed?: boolean;
};

export default function CompanyTasksModal({
  companyId,
  companyName,
  onClose,
}: CompanyTasksModalProps) {
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompanyItems();
  }, [companyId]);

  const loadCompanyItems = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
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
      tasks.forEach((task: Task) => {
        deadlines.push({
          id: `task-${task.id}`,
          title: task.title,
          due_date: task.due_date,
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
          type: 'es',
        });
      }
      if (company.webtest_deadline) {
        deadlines.push({
          id: `webtest-${companyId}`,
          title: 'Webテスト締切',
          due_date: company.webtest_deadline,
          type: 'webtest',
        });
      }
    }

    deadlines.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setItems(deadlines);
    setIsLoading(false);
  };

  const toggleTaskComplete = async (deadlineId: string) => {
    const taskId = deadlineId.replace('task-', '');

    const { error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadCompanyItems();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <ListTodo className="w-4 h-4" />;
      case 'es':
        return <FileText className="w-4 h-4" />;
      case 'webtest':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{companyName}</h2>
            <p className="text-sm text-slate-600 mt-1">タスクと締切一覧</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">タスクや締切はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    item.completed
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          item.type === 'task'
                            ? 'bg-blue-100 text-blue-600'
                            : item.type === 'es'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              item.type === 'task'
                                ? 'bg-blue-100 text-blue-700'
                                : item.type === 'es'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        <p
                          className={`text-base font-semibold mb-2 ${
                            item.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.due_date && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>締切: {formatDate(item.due_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {item.type === 'task' && !item.completed && (
                      <button
                        onClick={() => toggleTaskComplete(item.id)}
                        className="text-slate-400 hover:text-green-600 transition-colors flex-shrink-0"
                        title="完了にする"
                      >
                        <CheckCircle className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
