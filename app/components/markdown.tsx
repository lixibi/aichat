import hljs from "highlight.js";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeRaw from "rehype-raw";
import RehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "rehype-sanitize";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { copyToClipboard, downloadAs } from "../utils";
import mermaid from "mermaid";
import Locale from "../locales";
import LoadingIcon from "../icons/three-dots.svg";
// import ReloadButtonIcon from "../icons/reload.svg";
import React from "react";
// import { useDebouncedCallback } from "use-debounce";
import { showImageModal, FullScreen } from "./ui-lib";
import { HTMLPreview, HTMLPreviewHander } from "./artifacts";
import { useChatStore } from "../store";
// import { IconButton } from "./button";

import { useAppConfig } from "../store/config";

import { Collapse } from "antd";
import styles from "./markdown.module.scss";

interface SearchCollapseProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SearchCollapse = ({
  title,
  children,
  className,
}: SearchCollapseProps) => {
  const defaultActive = title === Locale.NewChat.Searching ? ["1"] : [];
  const [activeKeys, setActiveKeys] = useState(defaultActive);

  useEffect(() => {
    if (typeof title === "string" && title.includes(Locale.NewChat.Search)) {
      setActiveKeys([]);
    } else if (title === Locale.NewChat.Searching) {
      setActiveKeys(["1"]);
    }
  }, [title]);

  const toggleCollapse = () => {
    setActiveKeys(activeKeys.length ? [] : ["1"]);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCollapse();
  };

  const handleDoubleClick = () => {
    toggleCollapse();
  };

  return (
    <div
      onContextMenu={handleRightClick}
      onDoubleClick={handleDoubleClick}
      className={`${styles["search-collapse"]} ${className || ""}`}
    >
      <Collapse
        size="small"
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        bordered={false}
        items={[
          {
            key: "1",
            label: title,
            children: children,
          },
        ]}
      ></Collapse>
    </div>
  );
};

interface ThinkCollapseProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fontSize?: number;
}
const ThinkCollapse = ({
  title,
  children,
  className,
  fontSize,
}: ThinkCollapseProps) => {
  // 如果是 Thinking 状态，默认展开，否则折叠
  const defaultActive = title === Locale.NewChat.Thinking ? ["1"] : [];
  // 如果是 NoThink 状态，禁用
  const disabled = title === Locale.NewChat.NoThink;
  const [activeKeys, setActiveKeys] = useState(defaultActive);

  // 当标题从 Thinking 变为 Think 或 NoThink 时自动折叠
  useEffect(() => {
    if (
      (typeof title === "string" && title.includes(Locale.NewChat.Think)) ||
      title === Locale.NewChat.NoThink
    ) {
      setActiveKeys([]);
    } else if (title === Locale.NewChat.Thinking) {
      setActiveKeys(["1"]);
    }
  }, [title]);

  const toggleCollapse = () => {
    if (!disabled) {
      setActiveKeys(activeKeys.length ? [] : ["1"]);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCollapse();
  };

  const handleDoubleClick = () => {
    toggleCollapse();
  };

  // Recursive function to extract text from children
  const extractText = (node: any): string => {
    if (!node) return "";

    // Direct string
    if (typeof node === "string") return node;

    // Array of nodes
    if (Array.isArray(node)) {
      return node.map(extractText).join("");
    }

    // React element
    if (node.props && node.props.children) {
      return extractText(node.props.children);
    }

    return "";
  };

  const handleCopyContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = extractText(children);
      copyToClipboard(`<think>${text}</think>`);
    } catch (err) {
      console.error("Failed to copy thinking content:", err);
    }
  };

  return (
    <div
      onContextMenu={handleRightClick}
      onDoubleClick={handleDoubleClick}
      className={`${styles["think-collapse"]} ${
        disabled ? styles.disabled : ""
      } ${className || ""}`}
      // style={{ fontSize: `${fontSize}px` }}
    >
      <Collapse
        className={`${disabled ? "disabled" : ""}`}
        size="small"
        activeKey={activeKeys}
        onChange={(keys) => !disabled && setActiveKeys(keys as string[])}
        bordered={false}
        items={[
          {
            key: "1",
            label: (
              <div className={styles["think-collapse-header"]}>
                <span>{title}</span>
                {!disabled && (
                  <span
                    className={styles["copy-think-button"]}
                    onClick={handleCopyContent}
                    title={Locale.Chat.Actions.Copy}
                  >
                    📋
                  </span>
                )}
              </div>
            ),
            children: children,
          },
        ]}
      ></Collapse>
    </div>
  );
};

// 配置安全策略，允许 thinkcollapse 标签，防止html注入造成页面崩溃
const sanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div || []),
      ["className", "math", "math-display"],
    ],
    img: [
      ...(defaultSchema.attributes?.img || []),
      ["src", ["http:", "https:", "data"]],
    ],
    math: [["xmlns", "http://www.w3.org/1998/Math/MathML"], "display"],
    annotation: ["encoding"],
    span: ["className", "style"],
    svg: [
      ["xmlns", "http://www.w3.org/2000/svg"],
      "width",
      "height",
      "viewBox",
      "preserveAspectRatio",
    ],
    path: ["d"],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "searchcollapse",
    "thinkcollapse",
    "math",
    "semantics",
    "annotation",
    "mrow",
    "mi",
    "mo",
    "mfrac",
    "mn",
    "msup",
    "msub",
    "svg",
    "path",
  ],
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"], // 允许的协议列表
  },
};

function Details(props: { children: React.ReactNode }) {
  return <details>{props.children}</details>;
}

function Summary(props: { children: React.ReactNode }) {
  return <summary>{props.children}</summary>;
}

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className="no-dark mermaid"
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const previewRef = useRef<HTMLPreviewHander>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [language, setLanguage] = useState("");
  const [contentType, setContentType] = useState<
    "html" | "mermaid" | "svg" | null
  >(null);

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;

  useEffect(() => {
    if (ref.current) {
      const codeElement = ref.current.querySelector("code");
      if (codeElement) {
        // 获取语言
        const code = codeElement.innerText;
        setOriginalCode(code);

        const langClass = codeElement.className.match(/language-(\w+)/);
        let lang = langClass ? langClass[1] : "";
        if (code.startsWith("<!DOCTYPE") || code.startsWith("<?xml")) {
          lang = "html";
        }
        setLanguage(lang);

        if (lang === "mermaid") {
          setContentType("mermaid");
          setPreviewContent(code);
        } else if (code.startsWith("<svg") || lang === "svg") {
          setContentType("svg");
          setPreviewContent(code);
          setLanguage("svg");
        } else if (lang === "html") {
          setLanguage("html");
          setContentType("html");
          setPreviewContent(code);
        }
        if (
          enableArtifacts &&
          (lang === "mermaid" || lang === "svg" || lang === "html")
        ) {
          setShowPreview(true);
        }
      }
    }
  }, [enableArtifacts]);
  const copyCode = () => {
    copyToClipboard(originalCode);
  };
  const downloadCode = async () => {
    let extension = language || "txt";
    if (contentType === "html") extension = "html";
    else if (contentType === "svg") extension = "svg";
    else if (contentType === "mermaid") extension = "md";

    const filename = `code-${Date.now()}.${extension}`;
    await downloadAs(originalCode, filename);
  };
  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (contentType === "svg") {
      const blob = new Blob([previewContent], { type: "image/svg+xml" });
      showImageModal(URL.createObjectURL(blob));
    } else if (contentType === "html") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(previewContent);
        win.document.title = "HTML Preview";
        win.document.close();
      }
    }
  };
  const renderPreview = () => {
    if (!previewContent) return null;

    switch (contentType) {
      case "mermaid":
        return <Mermaid code={previewContent} />;
      case "svg":
        return (
          <div
            dangerouslySetInnerHTML={{ __html: previewContent }}
            style={{ maxWidth: "100%", overflow: "auto" }}
          />
        );
      case "html":
        return (
          <HTMLPreview
            ref={previewRef}
            code={previewContent}
            autoHeight={true}
            height={400}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles["code-block-wrapper"]}>
      <div className={styles["code-header"]}>
        <div className={styles["code-header-left"]}>
          {language && (
            <span className={styles["code-language"]}>{language}</span>
          )}
        </div>
        <div className={styles["code-header-right"]}>
          <button className={styles["code-header-btn"]} onClick={copyCode}>
            {Locale.Chat.Actions.Copy}
          </button>
          <button className={styles["code-header-btn"]} onClick={downloadCode}>
            {Locale.Chat.Actions.Download}
          </button>
          <button
            className={`${styles["code-header-btn"]} ${
              !contentType ? styles["btn-disabled"] : ""
            }`}
            onClick={() => contentType && setShowPreview(!showPreview)}
            disabled={!contentType}
          >
            {showPreview
              ? Locale.Chat.Actions.ShowCode
              : Locale.Chat.Actions.Preview}
          </button>
        </div>
      </div>
      <div className={styles["code-content"]}>
        {showPreview ? (
          <div
            className={styles["preview-container"]}
            onClick={handlePreviewClick}
          >
            {renderPreview()}
          </div>
        ) : (
          <pre ref={ref}>{props.children}</pre>
        )}
      </div>
    </div>
  );
}

function CustomCode(props: { children: any; className?: string }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableCodeFold =
    session.mask?.enableCodeFold !== false && config.enableCodeFold;

  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };
  const renderShowMoreButton = () => {
    if (showToggle && enableCodeFold) {
      return (
        <div
          className={`show-hide-button ${collapsed ? "collapsed" : "expanded"}`}
          style={{
            position: "absolute",
            right: "12px",
            bottom: "12px",
            zIndex: 1,
          }}
        >
          <button onClick={toggleCollapsed} className="code-fold-btn">
            {collapsed ? Locale.NewChat.More : Locale.NewChat.Less}
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <code
        className={props?.className}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: enableCodeFold && collapsed ? "auto" : "visible",
        }}
      >
        {props.children}
      </code>
      {renderShowMoreButton()}
    </>
  );
}

function escapeDollarNumber(text: string) {
  let escapedText = "";
  let isInMathExpression = false;
  let isInCodeBlock = false;
  let isInInlineCode = false;
  let isInLatexBlock = false;

  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    const prevChar = text[i - 1] || " ";
    const nextChar = text[i + 1] || " ";

    // Toggle the isInCodeBlock flag when encountering a code block start or end indicator
    if (text.substring(i, i + 3) === "```") {
      isInCodeBlock = !isInCodeBlock;
      escapedText += "```";
      i += 2; // Skip the next two characters since we have already included them
      continue;
    }

    // Toggle the isInInlineCode flag when encountering a single backtick
    if (char === "`" && !isInCodeBlock) {
      isInInlineCode = !isInInlineCode;
      escapedText += "`";
      continue;
    }

    // Toggle the isInLatexBlock flag when encountering \[ or \]
    if (char === "\\" && nextChar === "[" && !isInLatexBlock) {
      isInLatexBlock = true;
      escapedText += "\\[";
      i++; // Skip the next character since we have already included it
      continue;
    } else if (char === "\\" && nextChar === "]" && isInLatexBlock) {
      isInLatexBlock = false;
      escapedText += "\\]";
      i++; // Skip the next character since we have already included it
      continue;
    }

    // If inside a code block, preserve the character as is
    if (isInCodeBlock || isInInlineCode || isInLatexBlock) {
      escapedText += char;
      continue;
    }

    // Toggle the isInMathExpression flag when encountering a dollar sign
    if (char === "$" && nextChar !== "$" && !isInMathExpression) {
      isInMathExpression = true;
    } else if (char === "$" && nextChar !== "$" && isInMathExpression) {
      isInMathExpression = false;
    }

    // Preserve the double dollar sign in math expressions
    if (char === "$" && nextChar === "$") {
      escapedText += "$$"; // Preserve the double dollar sign
      i++; // Skip the next dollar sign since we have already included it
      continue;
    }

    // Escape a single dollar sign followed by a number outside of math expressions
    if (
      char === "$" &&
      nextChar >= "0" &&
      nextChar <= "9" &&
      !isInMathExpression &&
      !isInLatexBlock
    ) {
      escapedText += "&#36;"; // Use HTML entity &#36; to represent the dollar sign
      continue;
    }
    // Process single tildes only if not in code block or inline code
    if (char === "~" && prevChar !== "~" && nextChar !== "~") {
      escapedText += "\\~"; // Escape single tilde
      continue;
    }

    escapedText += char; // Add the character as is
  }

  return escapedText;
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}
function formatBoldText(text: string) {
  const pattern = /\*\*(.*?)([:：])\*\*/g;
  return text.replace(pattern, (match, boldText, colon) => {
    return `**${boldText}**${colon}`;
  });
}

function formatSearchText(
  text: string,
  searchingTime?: number,
): {
  searchText: string;
  remainText: string;
} {
  text = text.trimStart();

  // 检查是否以 <search> 开头但没有结束标签
  if (text.startsWith("<search>") && !text.includes("</search>")) {
    // 获取 <search> 后的所有内容
    const searchContent = text.slice("<search>".length);
    // 渲染为"搜索中"状态
    const searchText = `<searchcollapse title="${Locale.NewChat.Searching}">\n${searchContent}\n\n</searchcollapse>\n`;
    const remainText = ""; // 剩余文本为空
    return { searchText, remainText };
  }
  const pattern = /^<search>([\s\S]*?)<\/search>/;
  const match = text.match(pattern);

  if (match) {
    const searchContent = match[1];
    let searchText = "";
    if (searchContent.trim() === "") {
      searchText = `<searchcollapse title="${Locale.NewChat.NoSearch}">\n\n</searchcollapse>\n`;
    } else {
      searchText = `<searchcollapse title="${
        Locale.NewChat.Search
      }${Locale.NewChat.ThinkFormat(
        searchingTime,
      )}">\n${searchContent}\n\n</searchcollapse>\n`;
    }
    const remainText = text.substring(match[0].length); // 提取剩余文本
    return { searchText, remainText };
  }

  // 没有找到 search 标签
  return { searchText: "", remainText: text };
}

function formatThinkText(
  text: string,
  thinkingTime?: number,
): {
  thinkText: string;
  remainText: string;
} {
  text = text.trimStart();
  // 检查是否以 <think> 开头但没有结束标签
  if (text.startsWith("<think>") && !text.includes("</think>")) {
    // 获取 <think> 后的所有内容
    const thinkContent = text.slice("<think>".length);
    // 渲染为"思考中"状态
    const thinkText = `<thinkcollapse title="${Locale.NewChat.Thinking}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    const remainText = ""; // 剩余文本为空
    return { thinkText, remainText };
  }

  // 处理完整的 think 标签
  const pattern = /^<think>([\s\S]*?)<\/think>/;
  const match = text.match(pattern);
  if (match) {
    const thinkContent = match[1];
    let thinkText = "";
    if (thinkContent.trim() === "") {
      thinkText = `<thinkcollapse title="${Locale.NewChat.NoThink}">\n\n</thinkcollapse>\n`;
    } else {
      thinkText = `<thinkcollapse title="${
        Locale.NewChat.Think
      }${Locale.NewChat.ThinkFormat(
        thinkingTime,
      )}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    }
    const remainText = text.substring(match[0].length); // 提取剩余文本
    return { thinkText, remainText };
  }

  // 没有找到 think 标签
  return { thinkText: "", remainText: text };
}

function tryWrapHtmlCode(text: string) {
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

function ImagePreview({ src }: { src: string }) {
  const handleClick = () => {
    showImageModal(src); // 使用现有的 showImageModal 函数显示图片
  };

  return (
    <img
      src={src}
      alt="Preview"
      onClick={handleClick}
      style={{
        cursor: "zoom-in",
        maxWidth: "200px",
        maxHeight: "200px",
        objectFit: "contain", // 保持图片比例
        borderRadius: "8px", // 添加圆角
        transition: "transform 0.2s ease",
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")} // 悬停时轻微放大
      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} // 鼠标离开时恢复
    />
  );
}
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string; // 强制 src 为 string
};
function R_MarkDownContent(props: {
  content: string;
  searchingTime?: number;
  thinkingTime?: number;
  fontSize?: number;
}) {
  const escapedContent = useMemo(() => {
    const originalContent = formatBoldText(
      escapeBrackets(escapeDollarNumber(props.content)),
    );
    const { searchText, remainText: searchRemainText } = formatSearchText(
      originalContent,
      props.searchingTime,
    );
    const { thinkText, remainText } = formatThinkText(
      searchRemainText,
      props.thinkingTime,
    );
    const content = searchText + thinkText + remainText;
    return tryWrapHtmlCode(content);
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeRaw,
        RehypeKatex,
        [rehypeSanitize, sanitizeOptions],
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={
        {
          pre: PreCode,
          code: CustomCode,
          p: (pProps: any) => <p {...pProps} dir="auto" />,
          searchcollapse: ({
            title,
            children,
          }: {
            title?: string;
            children: React.ReactNode;
          }) => <SearchCollapse title={title}>{children}</SearchCollapse>,
          thinkcollapse: ({
            title,
            children,
          }: {
            title: string;
            children: React.ReactNode;
          }) => (
            <ThinkCollapse title={title} fontSize={props.fontSize}>
              {children}
            </ThinkCollapse>
          ),
          a: (aProps: any) => {
            const href = aProps.href || "";
            if (/\.(aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure>
                  <audio controls src={href}></audio>
                </figure>
              );
            }
            if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
              return (
                <video controls width="99.9%">
                  <source src={href} />
                </video>
              );
            }
            const isInternal = /^\/#/i.test(href);
            const target = isInternal ? "_self" : aProps.target ?? "_blank";
            return <a {...aProps} target={target} />;
          },
          details: Details,
          summary: Summary,
          img: ({ src, ...props }: ImgProps) => <ImagePreview src={src} />,
        } as any
      }
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(R_MarkDownContent);

function detectCodeLanguage(code: string): string {
  try {
    const result = hljs.highlightAuto(code, [
      "python",
      "java",
      "c",
      "cpp",
      "javascript",
      "typescript",
      "go",
      "rust",
      "html",
      "css",
      "sql",
      "bash",
      "json",
      "yaml",
      "xml",
      "r",
      "php",
      "ruby",
      "swift",
      "kotlin",
      "shell",
      "perl",
      "haskell",
      "matlab",
    ]);
    return result.language || "text";
  } catch (e) {
    console.warn("Language detection failed:", e);
    return "text";
  }
}
function preprocessContent(content: string): string {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let result: string[] = [];
  let hasLanguageTag = false; // 标记当前代码块是否有语言标注

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        // 开始新的代码块
        inCodeBlock = true;
        codeBlockLines = [];
        hasLanguageTag = line.trim().length > 3;

        if (hasLanguageTag) {
          // 有语言标注，直接添加这一行
          result.push(line);
        }
        // 无语言标注时不添加这一行，等待语言检测
      } else {
        // 代码块结束
        inCodeBlock = false;
        if (!hasLanguageTag && codeBlockLines.length > 0) {
          // 只有在没有语言标注时才进行语言检测
          const detectedLang = detectCodeLanguage(codeBlockLines.join("\n"));
          result.push("```" + detectedLang);
          result.push(...codeBlockLines);
        }
        result.push(line); // 添加结束标记
      }
    } else if (inCodeBlock) {
      if (hasLanguageTag) {
        // 有语言标注的代码块直接添加内容
        result.push(line);
      } else {
        // 无语言标注的代码块先收集内容
        codeBlockLines.push(line);
      }
    } else {
      // 非代码块内容直接添加
      result.push(line);
    }
  }

  // 处理未闭合的代码块
  if (inCodeBlock && !hasLanguageTag && codeBlockLines.length > 0) {
    console.warn("Unclosed code block detected");
    const detectedLang = detectCodeLanguage(codeBlockLines.join("\n"));
    result.push("```" + detectedLang);
    result.push(...codeBlockLines);
    result.push("```");
  }

  return result.join("\n");
}

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
    searchingTime?: number;
    thinkingTime?: number;
    status?: boolean | undefined;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  // 使用 useMemo 缓存处理结果
  const processedContent = useMemo(() => {
    // 只在 key 为 "done" 时进行语言检测
    if (!props.status) {
      return preprocessContent(props.content);
    }
    // 其他情况直接返回原始内容
    return props.content;
  }, [props.content, props.status]);

  return (
    <div
      className="markdown-body"
      // style={{
      //   fontSize: `${props.fontSize ?? 14}px`,
      // }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <LoadingIcon />
      ) : (
        <MarkdownContent
          content={processedContent}
          searchingTime={props.searchingTime}
          thinkingTime={props.thinkingTime}
          fontSize={props.fontSize}
        />
      )}
    </div>
  );
}
