import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import TopNav from './components/TopNav';
import HomePage from './pages/Home';
import WallPage from './pages/Wall';
import EchoPage from './pages/Echo';
import ArchivePage from './pages/Archive';
import TodosPage from './pages/Todos';
import SettingsPage from './pages/Settings';
import { ToastProvider } from './hooks/useToast';

// Animation intensity type
export type AnimationIntensity = 'off' | 'low' | 'medium' | 'high';

// Animation context for global animation control
interface AnimationContextValue {
  animationIntensity: AnimationIntensity;
  motionEnabled: boolean; // true = animations allowed, false = disabled
}
const AnimationContext = createContext<AnimationContextValue>({
  animationIntensity: 'medium',
  motionEnabled: true,
});

// Hook to consume animation context
export const useAnimation = () => useContext(AnimationContext);

const AppContent: React.FC = () => {
  const location = useLocation();
  
  // 静默模式状态 - 简化的静默开关
  const [silentMode, setSilentMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('silentMode') === 'true';
    }
    return false;
  });
  
  // 主题偏好状态 - 强制默认为 'auto'，忽略 localStorage
  const [themePreference, setThemePreference] = useState<'day' | 'night' | 'auto'>('auto');

  // 组件挂载时强制重置为 'auto'（使用 ref 确保只执行一次）
  const initRef = React.useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    // 强制设为 'auto'
    localStorage.setItem('themePreference', 'auto');
    setThemePreference('auto');
  }, []);

  // 有效主题：根据偏好或系统时间计算
  const effectiveTheme = useMemo(() => {
    if (themePreference === 'auto') {
      const hour = new Date().getHours();
      return hour >= 6 && hour < 18 ? 'day' : 'night';
    }
    return themePreference;
  }, [themePreference]);

  // 是否为白天（用于UI装饰）
  const isDay = effectiveTheme === 'day';

  // 动画强度状态 - 默认为中
  const [animationIntensity, setAnimationIntensity] = useState<AnimationIntensity>(() => {
    const saved = localStorage.getItem('animationIntensity');
    return (saved as AnimationIntensity) || 'medium';
  });

  // Framer Motion 的 reduced motion hook - 尊重系统偏好
  const prefersReducedMotion = useReducedMotion();

  // 计算动画是否启用：系统偏好关闭 OR 动画强度为off OR 静默模式 则禁用
  const motionEnabled = useMemo(() => {
    if (prefersReducedMotion) return false;
    if (animationIntensity === 'off') return false;
    if (silentMode) return false;
    return true;
  }, [prefersReducedMotion, animationIntensity, silentMode]);

  // 静默模式变化时同步到 localStorage
  useEffect(() => {
    localStorage.setItem('silentMode', String(silentMode));
  }, [silentMode]);

  // 持久化主题偏好
  useEffect(() => {
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference]);

  // 同步主题到 document.documentElement（供 CSS 选择器和 BaseMapView 自动检测使用）
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // 当处于自动模式时，每分钟检测一次系统时间以更新主题
  useEffect(() => {
    if (themePreference !== 'auto') return;

    const checkTheme = () => {
      // effectiveTheme 会在 themePreference === 'auto' 时根据时间计算
      // 这里只需要触发一次重新渲染即可
    };
    checkTheme();
    const interval = setInterval(checkTheme, 60000);
    return () => clearInterval(interval);
  }, [themePreference]);

  // 持久化动画强度设置
  useEffect(() => {
    localStorage.setItem('animationIntensity', animationIntensity);
  }, [animationIntensity]);

  // 动画上下文值
  const animationContext = useMemo(() => ({
    animationIntensity,
    motionEnabled,
  }), [animationIntensity, motionEnabled]);

  // 主题模式变更处理函数（用于直接设置特定模式）
  const handleThemeModeChange = (mode: 'day' | 'night' | 'auto') => {
    setThemePreference(mode);
  };

  // 无动画时的过渡配置
  const instantTransition = { duration: 0 };
  const pageTransition = motionEnabled 
    ? { duration: 0.25 } 
    : instantTransition;

  return (
    <ToastProvider isSilent={silentMode}>
      <AnimationContext.Provider value={animationContext}>
        <div
        data-silent={silentMode ? "true" : "false"}
        data-animation-intensity={animationIntensity}
        data-motion-enabled={motionEnabled ? "true" : "false"}
        className="relative w-full h-screen text-[var(--color-base-text)] overflow-hidden flex flex-col"
        >
        {/* Top Navigation - 固定在顶部 */}
        <TopNav
          silentMode={silentMode}
          onToggleSilent={() => setSilentMode(s => !s)}
          themeMode={themePreference}
          effectiveTheme={effectiveTheme}
          onThemeModeChange={handleThemeModeChange}
          isLANConnected={!silentMode}
        />

        {/* 主内容区 - 在TopNav下方，自动填满剩余空间 */}
        <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <HomePage />
                </motion.div>
              } />
              <Route path="/wall" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <WallPage />
                </motion.div>
              } />
              <Route path="/echo" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <EchoPage />
                </motion.div>
              } />
              <Route path="/archive" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <ArchivePage />
                </motion.div>
              } />
              <Route path="/todos" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <TodosPage />
                </motion.div>
              } />
              <Route path="/settings" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={pageTransition}
                  className="w-full flex-1 flex flex-col min-h-0"
                >
                  <SettingsPage
                    themeMode={themePreference}
                    effectiveTheme={effectiveTheme}
                    onThemeModeChange={handleThemeModeChange}
                    animationIntensity={animationIntensity}
                    onAnimationIntensityChange={setAnimationIntensity}
                  />
                </motion.div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* 背景网格 */}
        <div className="absolute inset-0 pointer-events-none bg-grid"></div>

        {/* 顶部和底部渐变光晕 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-0 left-1/4 right-1/4 h-[300px] rounded-full blur-[150px] transition-all ${motionEnabled ? 'duration-1000' : 'duration-0'} ${
            isDay 
              ? 'bg-gradient-to-b from-amber-200/20 to-transparent' 
              : 'bg-gradient-to-b from-blue-900/15 to-transparent'
          }`}></div>
          <div className={`absolute bottom-0 left-1/3 right-1/3 h-[200px] rounded-full blur-[120px] transition-all ${motionEnabled ? 'duration-1000' : 'duration-0'} ${
            isDay 
              ? 'bg-gradient-to-t from-orange-100/15 to-transparent' 
              : 'bg-gradient-to-t from-purple-950/10 to-transparent'
          }`}></div>
        </div>
      </div>
      </AnimationContext.Provider>
    </ToastProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;