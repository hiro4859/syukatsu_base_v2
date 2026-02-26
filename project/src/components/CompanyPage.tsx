import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Calendar, FileText, Clock, Star, BarChart3, Save, Plus, CheckCircle, Circle, Trash2, MessageSquare, Upload, ChevronDown, ChevronUp, MoveUp, MoveDown, Eye, EyeOff } from 'lucide-react';
import { supabase, Company, Task, SelectionStep } from '../lib/supabase';
import { useSeo } from '../hooks/useSeo';
import { demoCompanies, demoCompanyTasks, demoSelectionSteps } from '../lib/demoData';

type CompanyPageProps = {
  onLoginRequired?: () => void;
};

export default function CompanyPage({ onLoginRequired }: CompanyPageProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectionSteps, setSelectionSteps] = useState<SelectionStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [isCustomStep, setIsCustomStep] = useState(false);

  const presetSteps = [
    'ES提出',
    'Webテスト',
    '書類選考',
    '一次面接',
    '二次面接',
    '三次面接',
    '最終面接',
    'グループディスカッション',
    'インターンシップ',
    '内々定',
  ];

  const [isSaving, setIsSaving] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageResizer, setShowImageResizer] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    industry: '',
    image_url: '',
    website: '',
    mypage_id: '',
    mypage_password: '',
    selection_process: '',
    current_status: '',
    next_selection_date: '',
    es_deadline: '',
    webtest_deadline: '',
    webtest_format: '',
    memo: '',
    motivation_level: 3,
  });

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        navigate('/');
        return;
      }

      setIsLoadingCompany(true);

      const demoCompany = demoCompanies.find(c => c.id === companyId);
      if (demoCompany) {
        setCompany(demoCompany);
        setEditForm({
          name: demoCompany.name || '',
          industry: demoCompany.industry || '',
          image_url: demoCompany.image_url || '',
          website: demoCompany.website || '',
          mypage_id: demoCompany.mypage_id || '',
          mypage_password: demoCompany.mypage_password || '',
          selection_process: demoCompany.selection_process || '',
          current_status: demoCompany.current_status || '',
          next_selection_date: demoCompany.next_selection_date || '',
          es_deadline: demoCompany.es_deadline || '',
          webtest_deadline: demoCompany.webtest_deadline || '',
          webtest_format: demoCompany.webtest_format || '',
          memo: demoCompany.memo || '',
          motivation_level: demoCompany.motivation_level || 3,
        });
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
          setEditForm({
            name: data.name || '',
            industry: data.industry || '',
            image_url: data.image_url || '',
            website: data.website || '',
            mypage_id: data.mypage_id || '',
            mypage_password: data.mypage_password || '',
            selection_process: data.selection_process || '',
            current_status: data.current_status || '',
            next_selection_date: data.next_selection_date || '',
            es_deadline: data.es_deadline || '',
            webtest_deadline: data.webtest_deadline || '',
            webtest_format: data.webtest_format || '',
            memo: data.memo || '',
            motivation_level: data.motivation_level || 3,
          });
        }
      }

      setIsLoadingCompany(false);
    };

    loadCompany();
  }, [companyId, navigate]);

  useSeo(
    company ? `${company.name} - 詳細情報 | 就活基地` : '就活基地',
    company ? `${company.name}の基本情報、選考フロー、ES/Webテスト締切をまとめて確認。` : ''
  );

  const loadTasks = useCallback(async () => {
    if (!company) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const demoTasks = (demoCompanyTasks as any)[company.id] || [];
      setTasks(demoTasks as Task[]);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
  }, [company]);

  const loadSelectionSteps = useCallback(async () => {
    if (!company) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const demoSteps = (demoSelectionSteps as any)[company.id] || [];
      setSelectionSteps(demoSteps as SelectionStep[]);
      return;
    }

    const { data, error } = await supabase
      .from('selection_steps')
      .select('*')
      .eq('company_id', company.id)
      .order('order_index', { ascending: true});

    if (error) {
      console.error('Error loading selection steps:', error);
    } else {
      setSelectionSteps(data || []);
    }
  }, [company]);

  useEffect(() => {
    loadTasks();
    loadSelectionSteps();
  }, [loadTasks, loadSelectionSteps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const addSelectionStep = async (stepName?: string) => {
    const name = stepName || newStepName;
    if (!name.trim()) return;

    const maxOrder = selectionSteps.length > 0
      ? Math.max(...selectionSteps.map(s => s.order_index))
      : -1;

    const { error } = await supabase.from('selection_steps').insert({
      company_id: company.id,
      step_name: name,
      memo: '',
      order_index: maxOrder + 1,
    });

    if (error) {
      console.error('Error adding selection step:', error);
      alert('選考フローの追加に失敗しました');
    } else {
      setNewStepName('');
      setShowAddStep(false);
      setIsCustomStep(false);
      loadSelectionSteps();
    }
  };

  const moveStep = async (stepId: string, direction: 'up' | 'down') => {
    const stepIndex = selectionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    if (direction === 'up' && stepIndex === 0) return;
    if (direction === 'down' && stepIndex === selectionSteps.length - 1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    const currentStep = selectionSteps[stepIndex];
    const swapStep = selectionSteps[newIndex];

    const updates = [
      supabase.from('selection_steps').update({ order_index: swapStep.order_index }).eq('id', currentStep.id),
      supabase.from('selection_steps').update({ order_index: currentStep.order_index }).eq('id', swapStep.id),
    ];

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      console.error('Error moving step');
    } else {
      loadSelectionSteps();
    }
  };

  const handleStepMemoChange = (stepId: string, memo: string) => {
    setSelectionSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, memo } : step
      )
    );
  };

  const saveStepMemo = async (stepId: string, memo: string) => {
    const { error } = await supabase
      .from('selection_steps')
      .update({ memo })
      .eq('id', stepId);

    if (error) {
      console.error('Error updating step memo:', error);
    }
  };

  const deleteSelectionStep = async (stepId: string) => {
    const { error } = await supabase
      .from('selection_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      console.error('Error deleting selection step:', error);
    } else {
      loadSelectionSteps();
    }
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

    const { error } = await supabase
      .from('companies')
      .update({
        name: editForm.name,
        industry: editForm.industry,
        image_url: editForm.image_url,
        website: editForm.website,
        mypage_id: editForm.mypage_id,
        mypage_password: editForm.mypage_password,
        selection_process: editForm.selection_process,
        current_status: editForm.current_status,
        next_selection_date: editForm.next_selection_date || null,
        es_deadline: editForm.es_deadline || null,
        webtest_deadline: editForm.webtest_deadline || null,
        webtest_format: editForm.webtest_format,
        memo: editForm.memo,
        motivation_level: editForm.motivation_level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    if (error) {
      console.error('Error updating company:', error);
      alert('保存に失敗しました');
    } else {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .maybeSingle();

      if (data) {
        setCompany(data);
      }
    }

    setIsSaving(false);
  };


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setShowImageResizer(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.92
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleConfirmUpload = async () => {
    if (!selectedImageFile) return;

    setIsUploadingImage(true);
    setShowImageResizer(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('ログインが必要です');
        return;
      }

      const fileExt = selectedImageFile.name.split('.').pop();
      const fileName = `${company.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      if (company.image_url) {
        const oldPath = company.image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('company-images').remove([oldPath]);
      }

      const resizedFile = await resizeImage(selectedImageFile);

      const { error: uploadError } = await supabase.storage
        .from('company-images')
        .upload(filePath, resizedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      setEditForm({ ...editForm, image_url: publicUrl });
      setSelectedImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCancelUpload = () => {
    setShowImageResizer(false);
    setSelectedImageFile(null);
    setImagePreview('');
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('tasks').insert({
      company_id: company.id,
      user_id: user.id,
      title: newTaskTitle,
      due_date: newTaskDueDate || null,
      completed: false,
    });

    if (error) {
      console.error('Error adding task:', error);
      alert('タスクの追加に失敗しました');
    } else {
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setShowAddTask(false);
      loadTasks();
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      loadTasks();
    }
  };

  const deleteCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    if (!confirm(`「${company.name}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      return;
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (error) {
      console.error('Error deleting company:', error);
      alert('企業の削除に失敗しました');
    } else {
      navigate('/');
      window.location.reload();
    }
  };

  const renderStars = (level: number, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            onClick={() => onStarClick?.(i)}
            className={`w-7 h-7 transition-all ${
              i <= level ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
            } ${onStarClick ? 'cursor-pointer hover:scale-110 hover:text-yellow-500' : ''}`}
          />
        ))}
      </div>
    );
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
        <div className="flex flex-col gap-4 mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">戻る</span>
          </Link>
          <span className="sr-only">{company.name}の企業情報管理ページ</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <Link
              to={`/companies/${company.id}/es`}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              ES
            </Link>
            <Link
              to={`/companies/${company.id}/interview`}
              className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              面接
            </Link>
            <Link
              to={`/companies/${company.id}/analysis`}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              企業分析
            </Link>
            <button
              onClick={deleteCompany}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base col-span-2 sm:col-span-1"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              削除
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
              {company.name} - 詳細情報
            </h1>
          </div>
          <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 w-full sm:w-auto flex flex-col items-center sm:items-start">
                  {editForm.image_url ? (
                    <img src={editForm.image_url} alt={company.name} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl shadow-md" />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingImage ? 'アップロード中...' : '画像変更'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">企業名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">業界</label>
                      <input
                        type="text"
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">ウェブサイト</label>
                      <input
                        type="text"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">マイページID</label>
                  <input
                    type="text"
                    value={editForm.mypage_id}
                    onChange={(e) => setEditForm({ ...editForm, mypage_id: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">マイページパスワード</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editForm.mypage_password}
                      onChange={(e) => setEditForm({ ...editForm, mypage_password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">現在のステータス</label>
                  <input
                    type="text"
                    value={editForm.current_status}
                    onChange={(e) => setEditForm({ ...editForm, current_status: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="例: ES提出済み"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">次回選考日</label>
                  <input
                    type="date"
                    value={editForm.next_selection_date}
                    onChange={(e) => setEditForm({ ...editForm, next_selection_date: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ES締切</label>
                  <input
                    type="date"
                    value={editForm.es_deadline}
                    onChange={(e) => setEditForm({ ...editForm, es_deadline: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Webテスト締切</label>
                  <input
                    type="date"
                    value={editForm.webtest_deadline}
                    onChange={(e) => setEditForm({ ...editForm, webtest_deadline: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Webテスト形式</label>
                  <input
                    type="text"
                    value={editForm.webtest_format}
                    onChange={(e) => setEditForm({ ...editForm, webtest_format: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="例: 玉手箱"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">志望度</label>
                <div className="flex items-center gap-4">
                  {renderStars(editForm.motivation_level, (rating) => setEditForm({ ...editForm, motivation_level: rating }))}
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <span className="text-2xl font-bold text-blue-600">{editForm.motivation_level}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">メモ</label>
                <textarea
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={5}
                  placeholder="企業に関するメモを入力"
                />
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">採用フロー</h2>
              <button
                onClick={() => setShowAddStep(!showAddStep)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                追加
              </button>
            </div>

            {showAddStep && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setIsCustomStep(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      !isCustomStep ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    プリセット
                  </button>
                  <button
                    onClick={() => setIsCustomStep(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isCustomStep ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    カスタム
                  </button>
                </div>

                {isCustomStep ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStepName}
                      onChange={(e) => setNewStepName(e.target.value)}
                      placeholder="選考フロー名を入力"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && addSelectionStep()}
                    />
                    <button
                      onClick={() => addSelectionStep()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                    >
                      追加
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {presetSteps.map((step) => (
                      <button
                        key={step}
                        onClick={() => addSelectionStep(step)}
                        className="px-3 py-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {selectionSteps.length === 0 ? (
                <p className="text-center text-slate-400 py-8">採用フローを追加してください</p>
              ) : (
                selectionSteps.map((step, index) => (
                  <div key={step.id} className="bg-slate-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        {expandedSteps.has(step.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="font-semibold text-slate-800">{step.step_name}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === selectionSteps.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSelectionStep(step.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {expandedSteps.has(step.id) && (
                      <div className="px-4 pb-3">
                        <textarea
                          value={step.memo}
                          onChange={(e) => handleStepMemoChange(step.id, e.target.value)}
                          onBlur={(e) => saveStepMemo(step.id, e.target.value)}
                          placeholder="メモを入力"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">タスク</h2>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                追加
              </button>
            </div>

            {showAddTask && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="タスク名を入力"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={addTask}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                  >
                    追加
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-center text-slate-400 py-8">タスクを追加してください</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                    <button
                      onClick={() => toggleTaskComplete(task.id, task.completed)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-slate-500 mt-1">期限: {task.due_date}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showImageResizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4">画像プレビュー</h3>
            {imagePreview && (
              <div className="mb-4">
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg" />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                アップロード
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
