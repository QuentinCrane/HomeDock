/**
 * useConnectionStatus.tsx - 后端连接状态管理
 *
 * 功能说明：
 *   - 通过定期轮询 /api/health 检测后端连通性
 *   - 提供 useConnectionStatus hook 供组件使用
 *   - 连接状态变化时自动更新
 *
 * 轮询策略：
 *   - 每 10 秒检查一次 /api/health
 *   - 可通过 checkNow() 手动触发立即检查
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { healthCheck } from '../api';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number | null;
  isChecking: boolean;
  checkNow: () => Promise<boolean>;
}

const CONNECTION_CHECK_INTERVAL = 10000; // 10 seconds

/**
 * 后端连接状态 hook
 * @returns ConnectionStatus 对象
 *
 * 使用示例：
 * ```tsx
 * const { isConnected, checkNow } = useConnectionStatus();
 * // isConnected: boolean - 是否已连接
 * // checkNow: () => Promise<boolean> - 手动触发一次检查
 * ```
 */
export function useConnectionStatus(): ConnectionStatus {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  // 执行一次健康检查
  const performCheck = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) return false; // Guard - prevent concurrent checks
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const ok = await healthCheck();
      if (!isCheckingRef.current) return false; // Was cancelled
      setIsConnected(ok);
      setLastChecked(Date.now());
      return ok;
    } catch {
      if (!isCheckingRef.current) return false; // Was cancelled
      setIsConnected(false);
      setLastChecked(Date.now());
      return false;
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  // 手动触发检查
  const checkNow = useCallback(async (): Promise<boolean> => {
    return performCheck();
  }, [performCheck]);

  // 初始检查 + 定时轮询
  useEffect(() => {
    // 立即执行一次检查
    performCheck();

    // 设置定时轮询
    intervalRef.current = setInterval(() => {
      performCheck();
    }, CONNECTION_CHECK_INTERVAL);

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [performCheck]);

  return {
    isConnected,
    lastChecked,
    isChecking,
    checkNow,
  };
}