/**
 * Todos.tsx - 待办清单页面
 * 
 * 功能说明：
 *   - 管理个人待办事项
 *   - 支持创建、编辑、删除、完成待办
 *   - 支持截止日期设置
 *   - 可链接到 Google 日历
 *   - 支持与 Android 端同步
 * 
 * 状态管理：
 *   - activeTab: 当前标签页（进行中/已完成）
 *   - selectedTodo: 当前选中的待办
 *   - isEditing: 是否处于编辑模式
 *   - showCreateModal: 是否显示创建模态框
 * 
 * CRUD 操作：
 *   - handleCreate: 创建新待办
 *   - handleSaveEdit: 保存编辑
 *   - handleDelete: 删除待办
 *   - handleToggleComplete: 切换完成状态
 * 
 * 数据流：
 *   - 加载：fetchTodos 获取所有待办
 *   - 同步：useTodoSync 监听 SSE 推送
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Todo } from '../api';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Link2
} from 'lucide-react';
import dayjs from 'dayjs';
import { useTodoSync } from '../hooks/useSSE';

/// 标签页类型
type TabFilter = 'active' | 'completed';

/// 加载中旋转动画组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-8 h-8 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
    />
  </div>
);

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void; onRetry?: () => void }> = ({ 
  message, 
  onDismiss, 
  onRetry 
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mb-4 p-3 bg-[var(--color-base-error)]/20 border border-[var(--color-base-error)]/40 flex items-center justify-between"
  >
    <div className="flex items-center gap-2 text-[var(--color-base-error)]">
      <AlertCircle size={14} />
      <span className="text-xs font-mono">{message}</span>
    </div>
    <div className="flex items-center gap-2">
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-[10px] font-mono text-[var(--color-base-error)] hover:underline"
        >
          重试
        </button>
      )}
      <button onClick={onDismiss} className="text-[var(--color-base-error)] hover:opacity-70">
        <X size={12} />
      </button>
    </div>
  </motion.div>
);

const TodosPage: React.FC = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError('加载失败，请重试');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTodos();
  }, []);

  // Listen for real-time todo updates
  useTodoSync(() => {
    loadTodos();
  });

  const filteredTodos = todos.filter(t => 
    activeTab === 'active' ? !t.completed : t.completed
  );

  const handleSelectTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditDueDate(todo.dueDate ? dayjs(todo.dueDate).format('YYYY-MM-DD') : '');
    setIsEditing(false);
  };

  const handleToggleComplete = async (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      loadTodos();
      if (selectedTodo?.id === todo.id) {
        setSelectedTodo({ ...selectedTodo, completed: !todo.completed });
      }
    } catch (err) {
      setError('更新失败，请重试');
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTodo) return;
    try {
      await updateTodo(selectedTodo.id, {
        title: editTitle,
        description: editDescription || undefined,
        dueDate: editDueDate ? new Date(editDueDate).getTime() : undefined,
      });
      setIsEditing(false);
      loadTodos();
    } catch (err) {
      setError('保存失败，请重试');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedTodo || !confirm('确定要删除这个待办吗？')) return;
    try {
      await deleteTodo(selectedTodo.id);
      setSelectedTodo(null);
      loadTodos();
    } catch (err) {
      setError('删除失败，请重试');
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await createTodo({
        title: newTitle,
        description: newDescription || undefined,
        dueDate: newDueDate ? new Date(newDueDate).getTime() : undefined,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      loadTodos();
    } catch (err) {
      setError('创建失败，请重试');
      console.error(err);
    }
    setIsCreating(false);
  };

  const handleCalendarLink = (todo: Todo) => {
    if (!todo.dueDate) return;
    const date = dayjs(todo.dueDate);
    const startDate = date.format('YYYYMMDD');
    const endDate = date.format('YYYYMMDD');
    const title = encodeURIComponent(todo.title);
    const details = encodeURIComponent(todo.description || '');
    // Create calendar URL (works on Android and iOS)
    const calendarUrl = `intent://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}#Intent;scheme=https;package=com.google.android.gm;end`;
    window.open(calendarUrl, '_blank');
  };

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative max-w-6xl mx-auto">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--color-base-border)] pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors font-mono text-sm tracking-widest uppercase group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          [ 返回基地 ]
        </button>

        <h2 className="text-xl font-bold text-[var(--color-base-text-bright)] tracking-[0.2em]">
          待办清单
        </h2>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-base-accent)]/20 text-[var(--color-base-accent)] font-mono text-xs hover:bg-[var(--color-base-accent)]/30 transition-colors"
        >
          <Plus size={14} />
          新建
        </button>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={loadTodos} />
        )}
      </AnimatePresence>

      {/* 主体：两栏布局 */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* ── 左栏：列表 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 标签页 */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 text-xs font-mono tracking-widest transition-colors flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'text-[var(--color-base-accent)] border-b-2 border-[var(--color-base-accent)]'
                  : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]'
              }`}
            >
              <Circle size={12} />
              进行中
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-base-border)] text-[10px]">
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 text-xs font-mono tracking-widest transition-colors flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'text-[var(--color-base-accent)] border-b-2 border-[var(--color-base-accent)]'
                  : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]'
              }`}
            >
              <CheckCircle2 size={12} />
              已完成
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-base-border)] text-[10px]">
                {completedCount}
              </span>
            </button>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
            {loading ? (
              <LoadingSpinner />
            ) : filteredTodos.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm font-mono text-[var(--color-base-text)] tracking-widest animate-pulse">
                  {activeTab === 'active' ? '暂无进行中事项' : '暂无已完成事项'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTodos.map((todo, idx) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handleSelectTodo(todo)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTodo?.id === todo.id
                        ? 'bg-[var(--color-base-border-highlight)]/30 border border-[var(--color-base-border-highlight)]'
                        : 'bg-[var(--color-base-panel)] border border-[var(--color-base-border)] hover:border-[var(--color-base-border-highlight)]'
                    } ${todo.completed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 完成状态按钮 */}
                      <button
                        onClick={(e) => handleToggleComplete(todo, e)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${
                          todo.completed 
                            ? 'text-[var(--color-base-success)]' 
                            : 'text-[var(--color-base-text)] hover:text-[var(--color-base-accent)]'
                        }`}
                      >
                        {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-sans leading-relaxed ${
                          todo.completed ? 'line-through text-[var(--color-base-text)]' : 'text-[var(--color-base-text-light)]'
                        }`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="text-xs text-[var(--color-base-text)] mt-1 line-clamp-1 opacity-70">
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {todo.dueDate && (
                            <span className={`text-[10px] font-mono flex items-center gap-1 ${
                              todo.dueDate < Date.now() && !todo.completed 
                                ? 'text-[var(--color-base-error)]' 
                                : 'text-[var(--color-base-text)] opacity-60'
                            }`}>
                              <Calendar size={10} />
                              {dayjs(todo.dueDate).format('MM-DD')}
                            </span>
                          )}
                          {todo.calendarEventId && (
                            <span className="text-[10px] font-mono text-[var(--color-base-accent)] opacity-60 flex items-center gap-1">
                              <Link2 size={10} />
                              已同步
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-[var(--color-base-text)] opacity-30 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 右栏：详情面板 ── */}
        <div className="w-[360px] flex-shrink-0 flex flex-col bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
          {selectedTodo ? (
            <>
              {/* 详情头部 */}
              <div className="p-4 border-b border-[var(--color-base-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                    selectedTodo.completed 
                      ? 'bg-[var(--color-base-success)]/20 text-[var(--color-base-success)]' 
                      : 'bg-[var(--color-base-accent)]/20 text-[var(--color-base-accent)]'
                  }`}>
                    {selectedTodo.completed ? '已完成' : '进行中'}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50">
                    #{selectedTodo.id.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>

              {/* 详情内容 */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                        标题
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-sans"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                        描述
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-sans resize-none"
                        placeholder="添加描述..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                        截止日期
                      </label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-sans text-[var(--color-base-text-bright)] leading-relaxed">
                      {selectedTodo.title}
                    </h3>
                    {selectedTodo.description && (
                      <p className="text-sm text-[var(--color-base-text-light)] font-sans leading-relaxed whitespace-pre-wrap">
                        {selectedTodo.description}
                      </p>
                    )}
                    {selectedTodo.dueDate && (
                      <div className={`p-3 border rounded ${
                        selectedTodo.dueDate < Date.now() && !selectedTodo.completed
                          ? 'border-[var(--color-base-error)]/40 bg-[var(--color-base-error)]/5'
                          : 'border-[var(--color-base-border)] bg-[var(--color-base-bg)]'
                      }`}>
                        <div className="flex items-center gap-2 text-[var(--color-base-text)]">
                          <Calendar size={14} />
                          <span className="text-sm font-mono">
                            {dayjs(selectedTodo.dueDate).format('YYYY 年 MM 月 DD 日')}
                          </span>
                        </div>
                        {selectedTodo.dueDate < Date.now() && !selectedTodo.completed && (
                          <p className="text-[10px] font-mono text-[var(--color-base-error)] mt-2">
                            已过期
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 元信息 */}
                <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] space-y-2 text-[10px] font-mono text-[var(--color-base-text)] opacity-70">
                  <div className="flex justify-between">
                    <span>创建时间</span>
                    <span>{dayjs(selectedTodo.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                  {selectedTodo.updatedAt && (
                    <div className="flex justify-between">
                      <span>更新时间</span>
                      <span>{dayjs(selectedTodo.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  )}
                  {selectedTodo.syncedAt && (
                    <div className="flex justify-between">
                      <span>同步时间</span>
                      <span>{dayjs(selectedTodo.syncedAt).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 详情操作 */}
              <div className="p-4 border-t border-[var(--color-base-border)] space-y-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 flex items-center justify-center gap-1 bg-[var(--color-base-border)] text-[var(--color-base-text-bright)] font-mono text-xs transition-colors"
                    >
                      <X size={12} /> 取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 flex items-center justify-center gap-1 bg-[var(--color-base-success)] text-[var(--color-base-bg)] font-mono text-xs transition-colors"
                    >
                      <Check size={12} /> 保存
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-xs tracking-widest transition-colors"
                  >
                    <Edit3 size={14} /> 编辑
                  </button>
                )}

                {/* 链接到日历 */}
                {selectedTodo.dueDate && !selectedTodo.calendarEventId && (
                  <button
                    onClick={() => handleCalendarLink(selectedTodo)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-[var(--color-base-accent)] hover:text-[var(--color-base-accent)]/80 font-mono text-xs tracking-widest transition-colors"
                  >
                    <Calendar size={14} /> 链接到日历
                  </button>
                )}

                {/* 切换完成状态 */}
                <button
                  onClick={(e) => handleToggleComplete(selectedTodo, e)}
                  className={`w-full py-2 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors ${
                    selectedTodo.completed
                      ? 'text-[var(--color-base-text)] hover:text-[var(--color-base-warning)]'
                      : 'text-[var(--color-base-success)] hover:text-[var(--color-base-success)]/80'
                  }`}
                >
                  {selectedTodo.completed ? (
                    <><Circle size={14} /> 标记为未完成</>
                  ) : (
                    <><CheckCircle2 size={14} /> 标记为已完成</>
                  )}
                </button>

                {/* 删除 */}
                <button
                  onClick={handleDelete}
                  className="w-full py-2 flex items-center justify-center gap-2 text-[var(--color-base-text)] hover:text-red-400 font-mono text-xs tracking-widest transition-colors"
                >
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-base-border)]/30 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-[var(--color-base-text)] opacity-30" />
                </div>
                <p className="text-sm font-mono text-[var(--color-base-text)] opacity-50 tracking-widest">
                  选择一个待办查看详情
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[var(--color-base-panel)] border border-[var(--color-base-border)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono text-[var(--color-base-text-bright)] tracking-widest">
                  新建待办
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                    标题 *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="输入待办事项..."
                    className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-sans"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                    描述
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    placeholder="添加详细描述..."
                    className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-sans resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase block mb-1.5">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] focus:outline-none focus:border-[var(--color-base-accent)] font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-1 bg-[var(--color-base-border)] text-[var(--color-base-text-bright)] font-mono text-xs transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || isCreating}
                  className="flex-1 py-2.5 flex items-center justify-center gap-1 bg-[var(--color-base-accent)] text-[var(--color-base-bg)] font-mono text-xs transition-colors disabled:opacity-40"
                >
                  {isCreating ? '创建中...' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodosPage;