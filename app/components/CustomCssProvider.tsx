// app/components/CustomCssProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { useCustomCssStore } from "../store/customCss";
import { useAppConfig } from "../store";

export function CustomCssProvider() {
  const customCss = useCustomCssStore();
  const config = useAppConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (customCss.content.trim().length > 0 && !customCss.enabled) {
      customCss.enable();
    }
  }, []);

  // 将 fontSize 注入到 customCss.content 中的 :root 块，若无则前置创建
  const injectFontSize = (css: string): string => {
    const fontRule = `\nfont-size: ${config.fontSize}px;`;
    if (/(:root\s*\{)/.test(css)) {
      // 在第一个 :root { 后插入 font-size
      return css.replace(/(:root\s*\{)/, `$1 ${fontRule}`);
    }
    // 若没有 :root 定义，则新建一个
    return `:root { ${fontRule} }\n` + css;
  };

  useEffect(() => {
    if (mounted && customCss.enabled && customCss.content) {
      const customCssElem = document.getElementById("custom-css");
      if (customCssElem) {
        customCssElem.innerHTML = injectFontSize(customCss.content);
        customCssElem.setAttribute("data-theme", config.theme);
      }
    }
  }, [
    mounted,
    customCss.enabled,
    customCss.content,
    config.theme,
    config.fontSize,
  ]);

  if (!mounted || !customCss.enabled || !customCss.content) {
    return null;
  }

  const initialCss = injectFontSize(customCss.content);

  return (
    <style id="custom-css" dangerouslySetInnerHTML={{ __html: initialCss }} />
  );
}
