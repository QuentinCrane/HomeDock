/**
 * TodoPreview.tsx - 待办预览组件
 * 
 * 功能说明：
 *   - 首页右侧边栏的待办事项预览
 *   - 显示前3条未完成的待办
 *   - 提供快速查看全部的链接
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Todo } from '../api';
import { fetchTodos } from '../api';

const TodoPreview: React.FC = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);

  // Fetch top 3 incomplete todos
  useEffect(() => {
    fetchTodos({ completed: false })
      .then(data => {
        const incomplete = data
          .filter((t: Todo) => !t.completed)
          .slice(0, 3);
        setTodos(incomplete);
      })
      .catch(err => {
        console.error('Failed to fetch todos:', err);
      });
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono opacity-60">待办</span>
        <button 
          onClick={() => navigate('/todos')}
          className="text-[10px] font-mono text-[var(--color-base-accent)] hover:underline"
        >
          查看全部
        </button>
      </div>
      
      {todos.length === 0 ? (
        <div className="text-xs font-mono opacity-40">暂无待办</div>
      ) : (
        todos.map(todo => (
          <div 
            key={todo.id}
            className="text-xs font-mono p-2 bg-[var(--color-base-panel)] rounded"
          >
            <span className="opacity-60 mr-2">○</span>
            {todo.title}
          </div>
        ))
      )}
    </div>
  );
};

export default TodoPreview;
