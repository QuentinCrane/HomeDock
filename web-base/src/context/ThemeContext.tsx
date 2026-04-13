/**
 * ThemeContext.tsx - 主题定制上下文
 * 
 * 提供自定义颜色和圆角定制功能
 * - Primary/Secondary/Background/Surface 颜色
 * - Border radius 统一圆角设置
 * 
 * 使用方式：
 *   const { theme, setPrimaryColor, ... } = useTheme();
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// 主题定制配置接口
export interface ThemeCustomization {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderRadius: string; // '4px' | '8px' | '12px' | '16px'
}

interface ThemeContextValue {
  // 当前定制配置
  customization: ThemeCustomization;
  // 设置器
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setSurfaceColor: (color: string) => void;
  setBorderRadius: (radius: '4px' | '8px' | '12px' | '16px') => void;
  // 重置为默认值
  resetToDefaults: () => void;
}

// 默认定制配置
const defaultCustomization: ThemeCustomization = {
  primaryColor: '#4a7a9b',    // 默认夜间accent
  secondaryColor: '#3d8b7a', // 默认success
  backgroundColor: '#0b0e14', // 默认夜间bg
  surfaceColor: '#0d1117',    // 默认夜间panel
  borderRadius: '8px',
};

// localStorage key
const STORAGE_KEY = 'themeCustomization';

// 读取保存的定制配置
const loadCustomization = (): ThemeCustomization => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultCustomization, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load theme customization:', e);
  }
  return defaultCustomization;
};

// 创建 Context
const ThemeContext = createContext<ThemeContextValue>({
  customization: defaultCustomization,
  setPrimaryColor: () => {},
  setSecondaryColor: () => {},
  setBackgroundColor: () => {},
  setSurfaceColor: () => {},
  setBorderRadius: () => {},
  resetToDefaults: () => {},
});

// Provider 组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<ThemeCustomization>(loadCustomization);

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
    } catch (e) {
      console.warn('Failed to save theme customization:', e);
    }
  }, [customization]);

  // 应用 CSS 变量到根元素
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-custom-primary', customization.primaryColor);
    root.style.setProperty('--color-custom-secondary', customization.secondaryColor);
    root.style.setProperty('--color-custom-bg', customization.backgroundColor);
    root.style.setProperty('--color-custom-surface', customization.surfaceColor);
    root.style.setProperty('--border-radius', customization.borderRadius);
    
    // 检查是否使用了自定义颜色（不同于默认值）
    const hasCustomColors = 
      customization.primaryColor !== defaultCustomization.primaryColor ||
      customization.secondaryColor !== defaultCustomization.secondaryColor ||
      customization.backgroundColor !== defaultCustomization.backgroundColor ||
      customization.surfaceColor !== defaultCustomization.surfaceColor ||
      customization.borderRadius !== defaultCustomization.borderRadius;
    
    root.setAttribute('data-custom-colors', hasCustomColors ? 'true' : 'false');
  }, [customization]);

  // 设置函数
  const setPrimaryColor = useCallback((color: string) => {
    setCustomization(prev => ({ ...prev, primaryColor: color }));
  }, []);

  const setSecondaryColor = useCallback((color: string) => {
    setCustomization(prev => ({ ...prev, secondaryColor: color }));
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    setCustomization(prev => ({ ...prev, backgroundColor: color }));
  }, []);

  const setSurfaceColor = useCallback((color: string) => {
    setCustomization(prev => ({ ...prev, surfaceColor: color }));
  }, []);

  const setBorderRadius = useCallback((radius: '4px' | '8px' | '12px' | '16px') => {
    setCustomization(prev => ({ ...prev, borderRadius: radius }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setCustomization(defaultCustomization);
  }, []);

  const value = useMemo(() => ({
    customization,
    setPrimaryColor,
    setSecondaryColor,
    setBackgroundColor,
    setSurfaceColor,
    setBorderRadius,
    resetToDefaults,
  }), [customization, setPrimaryColor, setSecondaryColor, setBackgroundColor, setSurfaceColor, setBorderRadius, resetToDefaults]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
