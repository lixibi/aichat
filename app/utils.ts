import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
import { RequestMessage, UploadFile } from "./client/api";
import { useAccessStore } from "./store";
import {
  VISION_MODEL_REGEXES,
  EXCLUDE_VISION_MODEL_REGEXES,
  StoreKey,
} from "./constant";
import { estimateTokenLengthInLLM } from "./utils/token";

export const readFileContent = async (
  file: UploadFile,
): Promise<string | null> => {
  try {
    console.log("Reading file content for:", file.name);

    // 如果有明确的内容类型标记，直接使用
    if (file.contentType === "text") {
      console.log("Direct text content available");
      return file.url; // 直接返回文本内容
    }

    // 如果是 Data URL
    if (file.contentType === "dataUrl" || file.url.startsWith("data:")) {
      console.log("Processing as DataURL");
      // 从 Data URL 中提取内容类型
      const contentTypePart = file.url.split(",")[0];
      const contentType = contentTypePart.split(":")[1]?.split(";")[0];

      // 解码 Base64 内容
      const base64Content = file.url.split(",")[1];

      try {
        // 方法1: 使用fetch API和Blob (最现代的方法)
        const response = await fetch(`data:text/plain;base64,${base64Content}`);
        const content = await response.text();
        console.log("Used fetch API to decode the file");
        return content;
      } catch (e) {
        // 方法2: 如果fetch不支持data URL，回退到这个方法
        const binary = atob(base64Content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const content = new TextDecoder("utf-8").decode(bytes);
        console.log("Used TextDecoder to decode the file");
        return content;
      }
    }
    // 处理URL
    else {
      console.log("Processing as URL");
      try {
        // 处理普通 URL
        const host_url = new URL(window.location.href);
        const file_url = new URL(file.url);

        // 允许同源URL或特定的可信域名
        const allowedHosts = [
          host_url.host,
          // 添加其他可信的域名
        ];

        if (!allowedHosts.includes(file_url.host)) {
          console.warn(
            `URL host mismatch: ${
              file_url.host
            } vs allowed: ${allowedHosts.join(", ")}`,
          );
          showToast(Locale.Chat.InputActions.UploadFile.FailToRead);
          return null;
        }

        const response = await fetch(file.url);
        if (!response.ok) {
          showToast(Locale.Chat.InputActions.UploadFile.FailToRead);
          return null;
        }

        // 检查 Content-Type 头
        const contentType = response.headers.get("Content-Type");
        if (
          contentType &&
          !contentType.includes("text/") &&
          !contentType.includes("application/json")
        ) {
          showToast(Locale.Chat.InputActions.UploadFile.UnsupportedFileType);
          return null;
        }

        // 获取文本内容
        const content = await response.text();
        return content;
      } catch (error) {
        // 如果URL解析失败，可能是因为它实际上是文本内容，直接返回
        if (
          error instanceof TypeError &&
          error.message.includes("URL constructor")
        ) {
          console.log("URL parsing failed, treating as direct text content");
          return file.url;
        }

        console.error("Error reading file content:", error);
        showToast(
          `${Locale.Chat.InputActions.UploadFile.FailToRead}: ${error}`,
        );
        return null;
      }
    }
  } catch (error) {
    showToast(`${Locale.Chat.InputActions.UploadFile.FailToRead}: ${error}`);
    return null;
  }
};

/**
 * Estimates the token count of a text file using character-based weights.
 * Note: This is a rough estimation as standard tokenizers cannot be used due to environment constraints.
 * @param text - The file content
 * @returns Estimated token count in thousands (K)
 */
export const countTokens = (text: string | null) => {
  let totalTokens = 0;
  if (!text) return totalTokens;
  return estimateTokenLengthInLLM(text);
};

/**
 * Gets the file size in a readable format
 * @param file - The file object
 * @returns File size in the most appropriate unit (B, KB, MB, GB)
 */
export const getFileSize = (file: File | null): string => {
  if (!file) return "0 B";

  const bytes = file.size;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  if (bytes === 0) return "0 B";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return `${bytes} B`;

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the specified punctuation from the end of the string
  // and also trim quotes from both the start and end if they exist.
  return (
    topic
      // fix for gemini
      .replace(/^["“”*]+|["“”*]+$/g, "")
      .replace(/[，。！？”“"、,.!?*]*$/, "")
  );
}

export async function copyToClipboard(text: string) {
  try {
    if (window.__TAURI__) {
      window.__TAURI__.writeText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    showToast(Locale.Copy.Success);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(Locale.Copy.Success);
    } catch (error) {
      showToast(Locale.Copy.Failed);
    }
    document.body.removeChild(textArea);
  }
}

export async function downloadAs(text: string, filename: string) {
  if (window.__TAURI__) {
    const result = await window.__TAURI__.dialog.save({
      defaultPath: `${filename}`,
      filters: [
        {
          name: `${filename.split(".").pop()} files`,
          extensions: [`${filename.split(".").pop()}`],
        },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });

    if (result !== null) {
      try {
        await window.__TAURI__.fs.writeTextFile(result, text);
        showToast(Locale.Download.Success);
      } catch (error) {
        showToast(Locale.Download.Failed);
      }
    } else {
      showToast(Locale.Download.Failed);
    }
  } else {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

export function readFromFile() {
  return new Promise<string>((res, rej) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        res(e.target.result);
      };
      fileReader.onerror = (e) => rej(e);
      fileReader.readAsText(file);
    };

    fileInput.click();
  });
}

export function isIOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 600;
export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function isFirefox() {
  return (
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
  );
}

export function selectOrCopy(el: HTMLElement, content: string) {
  const currentSelection = window.getSelection();

  if (currentSelection?.type === "Range") {
    return false;
  }

  copyToClipboard(content);

  return true;
}

function getDomContentWidth(dom: HTMLElement) {
  const style = window.getComputedStyle(dom);
  const paddingWidth =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = dom.clientWidth - paddingWidth;
  return width;
}

function getOrCreateMeasureDom(id: string, init?: (dom: HTMLElement) => void) {
  let dom = document.getElementById(id);

  if (!dom) {
    dom = document.createElement("span");
    dom.style.position = "absolute";
    dom.style.wordBreak = "break-word";
    dom.style.fontSize = "14px";
    dom.style.transform = "translateY(-200vh)";
    dom.style.pointerEvents = "none";
    dom.style.opacity = "0";
    dom.id = id;
    document.body.appendChild(dom);
    init?.(dom);
  }

  return dom!;
}

export function autoGrowTextArea(dom: HTMLTextAreaElement) {
  const measureDom = getOrCreateMeasureDom("__measure");
  const singleLineDom = getOrCreateMeasureDom("__single_measure", (dom) => {
    dom.innerText = "TEXT_FOR_MEASURE";
  });

  const width = getDomContentWidth(dom);
  measureDom.style.width = width + "px";
  measureDom.innerText = dom.value !== "" ? dom.value : "1";
  measureDom.style.fontSize = dom.style.fontSize;
  const endWithEmptyLine = dom.value.endsWith("\n");
  const height = parseFloat(window.getComputedStyle(measureDom).height);
  const singleLineHeight = parseFloat(
    window.getComputedStyle(singleLineDom).height,
  );

  const rows =
    Math.round(height / singleLineHeight) + (endWithEmptyLine ? 1 : 0);

  return rows;
}

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

/**
 * Detects Macintosh
 */
export function isMacOS(): boolean {
  if (typeof window !== "undefined") {
    let userAgent = window.navigator.userAgent.toLocaleLowerCase();
    const macintosh = /iphone|ipad|ipod|macintosh/.test(userAgent);
    return !!macintosh;
  }
  return false;
}

export function getMessageTextContent(message: RequestMessage) {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}
export function getMessageTextContentWithoutThinking(message: RequestMessage) {
  let content = "";
  if (typeof message.content === "string") {
    content = message.content;
  } else {
    for (const c of message.content) {
      if (c.type === "text") {
        content = c.text ?? "";
        break;
      }
    }
  }
  return getMessageTextContentWithoutThinkingFromContent(content);
}

export function getMessageTextContentWithoutThinkingFromContent(
  content: string,
) {
  // 情况1: 开头为 <think>，移除至 </think> 之间的内容，如果没有闭合，则匹配至结尾
  // 对应标准的 <think>...</think> 标签，但是可能由于思考过度导致没有闭合标签
  if (content.startsWith("<think>")) {
    const pattern = /^<think>[\s\S]*?(<\/think>|$)/;
    return content.replace(pattern, "").trim();
  }

  // 情况2: 开头没有 <think>，但包含 </think>，移除开头至 </think> 之间的内容
  // 对应思考内容丢失<think>标签，部分模型 api 有此现象
  if (content.includes("</think>")) {
    const pattern = /[\s\S]*?<\/think>/;
    return content.replace(pattern, "").trim();
  }

  // 情况3: 开头为 >，移除以 > 开头的连续行（直到中断）
  // 对应逆向模型，使用 > 开头的引用式思考回复
  if (content.startsWith(">")) {
    const thinkingPattern = /(^>.*(\n(?:>.*|\s*$))*)/m;
    return content.replace(thinkingPattern, "").trim();
  }

  // 如果以上情况都不匹配，直接返回原内容
  return content.trim();
}

export function getMessageImages(message: RequestMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
}

export function getMessageFiles(message: RequestMessage): UploadFile[] {
  if (typeof message.content === "string") {
    return [];
  }
  const files: UploadFile[] = [];
  for (const c of message.content) {
    if (c.type === "file_url" && c.file_url) {
      files.push(c.file_url);
    }
  }
  return files;
}

export function isVisionModel(model: string) {
  const visionModels = useAccessStore.getState().visionModels;
  const envVisionModels = visionModels?.split(",").map((m) => m.trim());
  if (envVisionModels?.includes(model)) {
    return true;
  }
  return (
    !EXCLUDE_VISION_MODEL_REGEXES.some((regex) => regex.test(model)) &&
    VISION_MODEL_REGEXES.some((regex) => regex.test(model))
  );
}

export function isThinkingModel(model: string | undefined) {
  if (!model) {
    return false;
  }
  const model_name = model.toLowerCase();
  const thinkingRegex = [
    /thinking/,
    /reason/,
    /deepseek-r1/,
    /^o1/,
    /^gpt-o1/,
    /^o3/,
    /^gpt-o3/,
  ];

  return thinkingRegex.some((regex) => regex.test(model_name));
}
export function wrapThinkingPart(full_reply: string) {
  full_reply = full_reply.trimStart();

  const searchPattern = /^<search>([\s\S]*?)<\/search>/;
  const searchMatch = full_reply.match(searchPattern);

  let searchText = "";
  let remainText = full_reply;
  if (searchMatch) {
    searchText = `<search>\n${searchMatch[1]}\n</search>\n`;
    remainText = full_reply.substring(searchMatch[0].length); // 提取剩余文本
  }

  remainText = remainText.trimStart();

  // 处理无闭合<think>标签的情况
  if (remainText.includes("</think>") && !remainText.startsWith("<think>")) {
    return searchText + `<think>\n${remainText}`;
  }
  if (remainText.includes("<think>") && !remainText.includes("</think>")) {
    return searchText + `${remainText}\n</think>`;
  }
  // 处理引用式思考回复的情况
  if (!remainText.startsWith(">")) {
    return searchText + remainText;
  }
  // 使用正则表达式匹配以 > 开头的连续行
  const thinkingPattern = /(^>.*(\n(?:>.*|\s*$))*)/m;
  const match = remainText.match(thinkingPattern);

  if (match) {
    // 获取匹配到的 thinking part
    const thinkingPart = match[0];
    // 将 thinking part 包裹在 <think> 标签中
    const wrappedThinkingPart = `<think>\n${thinkingPart}\n</think>\n`;
    // 替换原字符串中的 thinking part
    const result = remainText.replace(thinkingPattern, wrappedThinkingPart);
    return searchText + result;
  }

  // 如果没有匹配到 thinking part，则返回原字符串
  return searchText + remainText;
}
export function safeLocalStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} {
  let storage: Storage | null;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      storage = window.localStorage;
    } else {
      storage = null;
    }
  } catch (e) {
    console.error("localStorage is not available:", e);
    storage = null;
  }

  return {
    getItem(key: string): string | null {
      if (storage) {
        return storage.getItem(key);
      } else {
        console.warn(
          `Attempted to get item "${key}" from localStorage, but localStorage is not available.`,
        );
        return null;
      }
    },
    setItem(key: string, value: string): void {
      if (storage) {
        storage.setItem(key, value);
      } else {
        console.warn(
          `Attempted to set item "${key}" in localStorage, but localStorage is not available.`,
        );
      }
    },
    removeItem(key: string): void {
      if (storage) {
        storage.removeItem(key);
      } else {
        console.warn(
          `Attempted to remove item "${key}" from localStorage, but localStorage is not available.`,
        );
      }
    },
    clear(): void {
      if (storage) {
        storage.clear();
      } else {
        console.warn(
          "Attempted to clear localStorage, but localStorage is not available.",
        );
      }
    },
  };
}

// 从localStorage获取模型配置
export function getStoredModelConfigs() {
  try {
    const configsStr = safeLocalStorage().getItem(StoreKey.TaskModelConfig);
    return configsStr ? JSON.parse(configsStr) : {};
  } catch (e) {
    console.error("Error parsing model configs:", e);
    return {};
  }
}
// 保存模型配置到localStorage
export function saveModelConfig(key: string, value: string) {
  try {
    const configs = getStoredModelConfigs();
    configs[key] = value;
    safeLocalStorage().setItem(
      StoreKey.TaskModelConfig,
      JSON.stringify(configs),
    );
  } catch (e) {
    console.error("Error saving model config:", e);
  }
}
