/* eslint-disable @next/next/no-img-element */
import styles from "./ui-lib.module.scss";
import LoadingIcon from "../icons/three-dots.svg";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";
import DownIcon from "../icons/down.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import { Avatar } from "./emoji";

import Locale from "../locales";

import { createRoot } from "react-dom/client";
import React, {
  HTMLProps,
  MouseEvent,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { IconButton } from "./button";
import { useAccessStore } from "../store";

export function Popover(props: {
  children: JSX.Element;
  content: JSX.Element;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={styles.popover}>
      {props.children}
      {props.open && (
        <div className={styles["popover-mask"]} onClick={props.onClose}></div>
      )}
      {props.open && (
        <div className={styles["popover-content"]}>{props.content}</div>
      )}
    </div>
  );
}

export function Card(props: { children: JSX.Element[]; className?: string }) {
  return (
    <div className={styles.card + " " + props.className}>{props.children}</div>
  );
}

export function ListItem(props: {
  title: string;
  subTitle?: string;
  children?: JSX.Element | JSX.Element[];
  icon?: JSX.Element;
  className?: string;
  onClick?: (e: MouseEvent) => void;
  vertical?: boolean;
}) {
  return (
    <div
      className={
        styles["list-item"] +
        ` ${props.vertical ? styles["vertical"] : ""} ` +
        ` ${props.className || ""}`
      }
      onClick={props.onClick}
    >
      <div className={styles["list-header"]}>
        {props.icon && <div className={styles["list-icon"]}>{props.icon}</div>}
        <div className={styles["list-item-title"]}>
          <div>{props.title}</div>
          {props.subTitle && (
            <div className={styles["list-item-sub-title"]}>
              {props.subTitle}
            </div>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}

export function List(props: { children: React.ReactNode; id?: string }) {
  return (
    <div className={styles.list} id={props.id}>
      {props.children}
    </div>
  );
}

export function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingIcon />
    </div>
  );
}

interface ModalProps {
  title: string;
  children?: any;
  actions?: React.ReactNode[];
  defaultMax?: boolean;
  footer?: React.ReactNode;
  onClose?: () => void;
}
export function Modal(props: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isMax, setMax] = useState(!!props.defaultMax);

  return (
    <div
      className={
        styles["modal-container"] + ` ${isMax && styles["modal-container-max"]}`
      }
    >
      <div className={styles["modal-header"]}>
        <div className={styles["modal-title"]}>{props.title}</div>

        <div className={styles["modal-header-actions"]}>
          <div
            className={styles["modal-header-action"]}
            onClick={() => setMax(!isMax)}
          >
            {isMax ? <MinIcon /> : <MaxIcon />}
          </div>
          <div
            className={styles["modal-header-action"]}
            onClick={props.onClose}
          >
            <CloseIcon />
          </div>
        </div>
      </div>

      <div className={styles["modal-content"]}>{props.children}</div>

      <div className={styles["modal-footer"]}>
        {props.footer}
        <div className={styles["modal-actions"]}>
          {props.actions?.map((action, i) => (
            <div key={i} className={styles["modal-action"]}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function showModal(props: ModalProps) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    props.onClose?.();
    root.unmount();
    div.remove();
  };

  div.onclick = (e) => {
    if (e.target === div) {
      closeModal();
    }
  };

  root.render(<Modal {...props} onClose={closeModal}></Modal>);
}

export type ToastProps = {
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
};

export function Toast(props: ToastProps) {
  return (
    <div className={styles["toast-container"]}>
      <div className={styles["toast-content"]}>
        <span>{props.content}</span>
        {props.action && (
          <button
            onClick={() => {
              props.action?.onClick?.();
              props.onClose?.();
            }}
            className={styles["toast-action"]}
          >
            {props.action.text}
          </button>
        )}
      </div>
    </div>
  );
}

export function showToast(
  content: string,
  action?: ToastProps["action"],
  delay = 3000,
) {
  const div = document.createElement("div");
  div.className = styles.show;
  document.body.appendChild(div);

  const root = createRoot(div);
  const close = () => {
    div.classList.add(styles.hide);

    setTimeout(() => {
      root.unmount();
      div.remove();
    }, 300);
  };

  setTimeout(() => {
    close();
  }, delay);

  root.render(<Toast content={content} action={action} onClose={close} />);
}

export type InputProps = React.HTMLProps<HTMLTextAreaElement> & {
  autoHeight?: boolean;
  rows?: number;
};

export function Input(props: InputProps) {
  return (
    <textarea
      {...props}
      className={`${styles["input"]} ${props.className}`}
    ></textarea>
  );
}

export function PasswordInput(
  props: HTMLProps<HTMLInputElement> & { aria?: string },
) {
  const [visible, setVisible] = useState(false);

  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={"password-input-container"}>
      <IconButton
        aria={props.aria}
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={"password-eye"}
      />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={"password-input"}
      />
    </div>
  );
}

export function Select(
  props: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      align?: "left" | "center";
    },
    HTMLSelectElement
  >,
) {
  const { className, children, align, ...otherProps } = props;
  return (
    <div
      className={`${styles["select-with-icon"]} ${
        align === "left" ? styles["left-align-option"] : ""
      } ${className}`}
    >
      <select className={styles["select-with-icon-select"]} {...otherProps}>
        {children}
      </select>
      <DownIcon className={styles["select-with-icon-icon"]} />
    </div>
  );
}

export function showConfirm(content: any) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<boolean>((resolve) => {
    root.render(
      <Modal
        title={Locale.UI.Confirm}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              resolve(false);
              closeModal();
            }}
            icon={<CancelIcon />}
            tabIndex={0}
            bordered
            shadow
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(true);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            tabIndex={0}
            autoFocus
            bordered
            shadow
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        {content}
      </Modal>,
    );
  });
}

function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [input, setInput] = useState(props.value);
  const onInput = (value: string) => {
    props.onChange(value);
    setInput(value);
  };

  return (
    <textarea
      className={styles["modal-input"]}
      autoFocus
      value={input}
      onInput={(e) => onInput(e.currentTarget.value)}
      rows={props.rows ?? 3}
    ></textarea>
  );
}

export function showPrompt(content: any, value = "", rows = 3) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<string>((resolve) => {
    let userInput = value;

    root.render(
      <Modal
        title={content}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              closeModal();
            }}
            icon={<CancelIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(userInput);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        <PromptInput
          onChange={(val) => (userInput = val)}
          value={value}
          rows={rows}
        ></PromptInput>
      </Modal>,
    );
  });
}

function ImageModalContent({ img }: { img: string }) {
  const [rotation, setRotation] = useState(0); // 旋转角度
  const [scale, setScale] = useState(1); // 缩放比例
  const [isAdaptive, setIsAdaptive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90); // 向左旋转 90 度
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90); // 向右旋转 90 度
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3)); // 放大，最大 3 倍
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.1)); // 缩小，最小 0.1 倍
  };

  const handleResetToOriginal = () => {
    setScale(1);
    setRotation(0);
    setIsAdaptive(false);
  };

  const handleToggleAdaptive = () => {
    if (!isAdaptive) {
      fitImageToContainer(); // Apply adaptive scaling
      setIsAdaptive(true);
    }
  };

  const fitImageToContainer = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;

    // Get natural dimensions of image
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;

    // Get available space (accounting for padding)
    const availWidth = container.clientWidth - 40; // 20px padding on each side
    const availHeight = container.clientHeight - 40;

    // Calculate required scale to fit
    const scaleX = availWidth / imgWidth;
    const scaleY = availHeight / imgHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1:1

    setScale(newScale);
  }, []);

  const handleDownload = async () => {
    try {
      // 生成带时间戳的文件名
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "")
        .replace("T", "_");
      // 假设 img 是完整的 URL 字符串
      const fileExt = getFileExtension(img) || "jpg"; // img 是你图片 URL 的变量
      const fileName = `image_${timestamp}.${fileExt}`;

      // 创建一个临时的下载链接
      const link = document.createElement("a");
      link.href = img; // 直接使用原始图片 URL
      link.download = fileName; // 浏览器会尝试使用这个文件名

      // 对于某些浏览器和服务器配置，可能需要设置 target="_blank" 来确保下载行为
      // link.target = "_blank";
      // link.rel = "noopener noreferrer"; // 安全考虑

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert(
        "Failed to initiate download. The browser will handle the download. If it doesn't start, please check your browser settings or try right-clicking the image to save.",
      );
    }
  };

  // getFileExtension 函数保持不变
  const getFileExtension = (url: string): string | null => {
    // 移除查询参数和哈希，以正确匹配扩展名
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : null;
  };

  useEffect(() => {
    if (isAdaptive) {
      fitImageToContainer();
    }

    const handleResize = () => {
      if (isAdaptive) {
        fitImageToContainer();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isAdaptive, fitImageToContainer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 处理缩放逻辑
      if (e.deltaY > 0) {
        setScale((prev) => Math.max(prev - 0.1, 0.1));
      } else {
        setScale((prev) => Math.min(prev + 0.1, 3));
      }
    };

    container.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventScroll);
    };
  }, []);
  const scalePercentage = Math.round(scale * 100);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%", // 确保填充模态框高度
        overflow: "hidden", // 防止内容溢出
      }}
    >
      {/* 图片内容区域 */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        // onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={img}
          alt="preview"
          style={{
            maxWidth: "100%",
            transform: `rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: "center",
            transition: "transform 0.3s ease",
          }}
          onLoad={() => {
            if (isAdaptive) {
              fitImageToContainer();
            }
          }}
        />
      </div>

      {/* 底部横栏 */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#fff",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          boxShadow: "0 -2px 4px rgba(0,0,0,0.1)", // 可选：添加阴影
        }}
      >
        <div className={styles["image-buttons-container"]}>
          <button
            className={styles["image-button"]}
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            ➖
          </button>
          <span
            className={styles["image-button"]}
            style={{ cursor: "default" }}
            title="Current Zoom Level"
          >
            {scalePercentage}%
          </span>
          <button
            className={styles["image-button"]}
            onClick={handleZoomIn}
            title="Zoom In"
          >
            ➕
          </button>
          {!isAdaptive ? (
            <button
              className={styles["image-button"]}
              onClick={handleToggleAdaptive}
              title="Adaptive Scaling"
            >
              Fit
            </button>
          ) : (
            <button
              className={styles["image-button"]}
              onClick={handleResetToOriginal}
              title="Original Size"
            >
              1:1
            </button>
          )}
          <button
            className={styles["image-button"]}
            onClick={handleRotateLeft}
            title="Rotate Left"
          >
            ↺
          </button>
          <button
            className={styles["image-button"]}
            onClick={handleRotateRight}
            title="Rotate Right"
          >
            ↻
          </button>
          <button
            className={styles["image-button"]}
            onClick={handleDownload}
            title="Download Image"
          >
            💾
          </button>
        </div>
      </div>
    </div>
  );
}

export function showImageModal(img: string) {
  showModal({
    title: Locale.Export.Image.Modal,
    defaultMax: true,
    children: <ImageModalContent img={img} />,
  });
}
export function SearchSelector<T>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
  defaultSelectedValue?: T[] | T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    Array.isArray(props.defaultSelectedValue)
      ? props.defaultSelectedValue
      : props.defaultSelectedValue !== undefined
      ? [props.defaultSelectedValue]
      : [],
  );

  // 添加搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const accessStore = useAccessStore();

  const [presetRules, setPresetRules] = useState<string[]>(
    accessStore.selectLabels.split(",").filter((label) => label.trim() !== ""),
  );
  const [selectedRule, setSelectedRule] = useState<string>("");

  // 当组件加载时自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSelection = (e: MouseEvent, value: T) => {
    if (props.multiple) {
      e.stopPropagation();
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      props.onSelection?.(newSelectedValues);
    } else {
      setSelectedValues([value]);
      props.onSelection?.([value]);
      props.onClose?.();
    }
  };
  // 过滤列表项
  const filteredItems = props.items
    .filter((item) => {
      // 检查是否匹配搜索框
      const searchMatch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subTitle &&
          item.subTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof item.value === "string" &&
          item.value.toLowerCase().includes(searchQuery.toLowerCase()));

      // 检查是否匹配下拉列表规则，仅匹配模型描述中的文本
      const ruleMatch =
        selectedRule === "" || // 如果未选择规则，则规则匹配为 true
        (typeof item.subTitle === "string" &&
          item.subTitle.toLowerCase().includes(selectedRule.toLowerCase()));

      return searchMatch && ruleMatch; // 两者都匹配才返回 true
    })
    .sort((a, b) => {
      // 将选中的项目排在前面
      const aSelected = selectedValues.includes(a.value);
      const bSelected = selectedValues.includes(b.value);
      if (aSelected && !bSelected) {
        return -1;
      }
      if (!aSelected && bSelected) {
        return 1;
      }
      return 0;
    });

  return (
    <div className={styles["selector"]} onClick={() => props.onClose?.()}>
      <div
        className={styles["selector-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <List>
          {/* 搜索框 */}
          <div className={styles["selector-search"]}>
            <input
              ref={inputRef}
              type="text"
              className={styles["selector-search-input"]}
              placeholder={Locale.UI.SearchModel}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <select
              className={styles["selector-rule-select"]}
              value={selectedRule}
              onChange={(e) => {
                setSelectedRule(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {presetRules.length === 0 ? (
                <>
                  <option value="">{Locale.UI.SelectALL}</option>
                  <option value="" disabled>
                    <option key="0" value={Locale.UI.NoPresetRule}>
                      {Locale.UI.NoPresetRule}
                    </option>
                  </option>
                </>
              ) : (
                <>
                  <option value="">{Locale.UI.SelectALL}</option>
                  {presetRules.map((rule, index) => (
                    <option key={index} value={rule}>
                      {rule}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          {filteredItems.map((item, i) => {
            const selected = selectedValues.includes(item.value);
            return (
              <ListItem
                className={`${styles["selector-item"]} ${
                  item.disable && styles["selector-item-disabled"]
                }`}
                key={i}
                icon={<Avatar model={item.title as string} />}
                title={item.title}
                subTitle={item.subTitle}
                onClick={(e) => {
                  if (item.disable) {
                    e.stopPropagation();
                  } else {
                    handleSelection(e, item.value);
                  }
                }}
              >
                {selected ? (
                  <div
                    style={{
                      height: 16,
                      width: 16,
                      backgroundColor: "var(--primary)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg // 白色对勾图标
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 5L4 7L8 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : (
                  <></>
                )}
              </ListItem>
            );
          })}
        </List>
      </div>
    </div>
  );
}
export function Selector<T>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
  defaultSelectedValue?: T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    Array.isArray(props.defaultSelectedValue)
      ? props.defaultSelectedValue
      : props.defaultSelectedValue !== undefined
      ? [props.defaultSelectedValue]
      : [],
  );

  const handleSelection = (e: MouseEvent, value: T) => {
    if (props.multiple) {
      e.stopPropagation();
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      props.onSelection?.(newSelectedValues);
    } else {
      setSelectedValues([value]);
      props.onSelection?.([value]);
      props.onClose?.();
    }
  };

  return (
    <div className={styles["selector"]} onClick={() => props.onClose?.()}>
      <div className={styles["selector-content"]}>
        <List>
          {props.items.map((item, i) => {
            const selected = selectedValues.includes(item.value);
            return (
              <ListItem
                className={styles["selector-item"]}
                key={i}
                title={item.title}
                subTitle={item.subTitle}
                onClick={(e) => {
                  if (item.disable) {
                    e.stopPropagation();
                  } else {
                    handleSelection(e, item.value);
                  }
                }}
              >
                {selected ? (
                  <div
                    style={{
                      height: 10,
                      width: 10,
                      backgroundColor: "var(--primary)",
                      borderRadius: 10,
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </ListItem>
            );
          })}
        </List>
      </div>
    </div>
  );
}

export function FullScreen(props: any) {
  const { children, right = 10, top = 10, ...rest } = props;
  const ref = useRef<HTMLDivElement>();
  const [fullScreen, setFullScreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  useEffect(() => {
    const handleScreenChange = (e: any) => {
      if (e.target === ref.current) {
        setFullScreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener("fullscreenchange", handleScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleScreenChange);
    };
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }} {...rest}>
      <div style={{ position: "absolute", right, top }}>
        <IconButton
          icon={fullScreen ? <MinIcon /> : <MaxIcon />}
          onClick={toggleFullscreen}
          bordered
        />
      </div>
      {children}
    </div>
  );
}
