"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import styles from "./floating-button.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { Path } from "../constant";
import { useAppConfig, useChatStore } from "../store";
import { Theme } from "../store";
import Locale from "../locales";
import { estimateTokenLengthInLLM } from "../utils/token";

// 导入 SVG 图标
import PlusIcon from "../icons/bot-ai.svg";
import SettingsIcon from "../icons/settings.svg";
import MessageSquareIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import MoonIcon from "../icons/moon.svg";
import SunIcon from "../icons/sun.svg";
import HomeIcon from "../icons/home.svg";
import CollapseIcon from "../icons/collapse.svg";
import ExpandIcon from "../icons/expand.svg";
import EditIcon from "../icons/edit_input.svg";
import CustomProviderIcon from "../icons/custom-models.svg";

import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
} from "../utils";
import { Select } from "./ui-lib";

interface Position {
  x: number;
  y: number;
}

interface SessionInfo {
  modelName: string;
  providerName: string;
  contextWindow: number;
  temperature: number;
  temperatureEnabled: boolean;
  topP: number;
  topPEnabled: boolean;
  maxTokens: number;
  maxTokensEnabled: boolean;
  historyMessageCount: number;
  frequencyPenalty: number;
  frequencyPenaltyEnabled: boolean;
  presencePenalty: number;
  presencePenaltyEnabled: boolean;
  sendMemory: boolean;
  reasoning_effort: string;
}

export function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>(() => {
    // 从localStorage获取位置或默认位置
    const savedPosition = localStorage.getItem("floatingButtonPosition");
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      return { x: 0, y: pos.y }; // 忽略保存的x值，固定在右侧
    }
    return { x: 0, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isParamsCollapsed, setIsParamsCollapsed] = useState(false);
  const toggleParamsCollapse = () => {
    setIsParamsCollapsed(!isParamsCollapsed);
  };

  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // 处理参数编辑
  const startEditing = (param: string, value: number) => {
    // 防止冒泡触发paramItem的点击事件
    event?.stopPropagation();
    setEditingParam(param);
    setEditValue(value.toString());
  };
  const saveParamValue = () => {
    if (!editingParam) return;

    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      setEditingParam(null);
      return;
    }

    const modelConfig = { ...mask.modelConfig };

    switch (editingParam) {
      case "temperature":
        modelConfig.temperature = Math.max(0, Math.min(2, numValue));
        break;
      case "topP":
        modelConfig.top_p = Math.max(0, Math.min(1, numValue));
        break;
      case "frequencyPenalty":
        modelConfig.frequency_penalty = Math.max(-2, Math.min(2, numValue));
        break;
      case "presencePenalty":
        modelConfig.presence_penalty = Math.max(-2, Math.min(2, numValue));
        break;
      case "maxTokens":
        modelConfig.max_tokens = Math.max(1, Math.floor(numValue));
        break;
    }

    // 更新会话配置
    chatStore.updateCurrentSession((session) => {
      session.mask.modelConfig = modelConfig;
    });

    setEditingParam(null);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveParamValue();
    } else if (e.key === "Escape") {
      setEditingParam(null);
    }
  };
  const handleInputBlur = () => {
    saveParamValue();
  };
  // 渲染参数项
  const renderParamItem = (
    param: string,
    label: string,
    value: number,
    isEnabled: boolean,
    digits: number = 1,
    tooltip: string = "",
  ) => {
    const isEditing = editingParam === param;

    return (
      <div
        className={getParamItemClass(isEnabled)}
        onClick={() => toggleParamEnabled(param)}
      >
        {tooltip && <div className={styles.tooltip}>{tooltip}</div>}
        <div className={styles.paramLabel}>
          <span>{label}</span>
          <div className={styles.statusContainer}>
            {/* 将编辑图标放在状态灯的左侧 */}
            {isEnabled && (
              <span
                className={styles.editIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(param, value);
                }}
              >
                <EditIcon width={12} height={12} />
              </span>
            )}
            <span
              className={`${styles.enableIndicator} ${
                isEnabled ? styles.enabled : ""
              }`}
            ></span>
          </div>
        </div>
        <div className={styles.paramValueContainer}>
          {isEditing ? (
            <input
              type="text"
              className={styles.paramInput}
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div className={styles.paramValue}>
              {formatValue(value, digits)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const config = useAppConfig();
  const chatStore = useChatStore();
  const mask = chatStore.currentSession().mask;
  const navigate = useNavigate();
  const location = useLocation();
  const iconSize = 16;

  // 从配置中获取会话信息
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    modelName: mask.modelConfig.model,
    providerName: mask.modelConfig.providerName,
    contextWindow: mask.modelConfig.max_tokens,
    temperature: mask.modelConfig.temperature,
    temperatureEnabled: mask.modelConfig.temperature_enabled,
    topP: mask.modelConfig.top_p,
    topPEnabled: mask.modelConfig.top_p_enabled,
    maxTokens: mask.modelConfig.max_tokens,
    maxTokensEnabled: mask.modelConfig.max_tokens_enabled,
    historyMessageCount: mask.modelConfig.historyMessageCount,
    frequencyPenalty: mask.modelConfig.frequency_penalty,
    frequencyPenaltyEnabled: mask.modelConfig.frequency_penalty_enabled,
    presencePenalty: mask.modelConfig.presence_penalty,
    presencePenaltyEnabled: mask.modelConfig.presence_penalty_enabled,
    sendMemory: mask.modelConfig.sendMemory,
    reasoning_effort: mask.modelConfig?.reasoning_effort || "none",
  });

  // 当配置改变时更新会话信息
  useEffect(() => {
    setSessionInfo({
      modelName: mask.modelConfig.model,
      providerName: mask.modelConfig.providerName,
      contextWindow: mask.modelConfig.max_tokens,
      temperature: mask.modelConfig.temperature,
      temperatureEnabled: mask.modelConfig.temperature_enabled,
      topP: mask.modelConfig.top_p,
      topPEnabled: mask.modelConfig.top_p_enabled,
      maxTokens: mask.modelConfig.max_tokens,
      maxTokensEnabled: mask.modelConfig.max_tokens_enabled,
      historyMessageCount: mask.modelConfig.historyMessageCount,
      frequencyPenalty: mask.modelConfig.frequency_penalty,
      frequencyPenaltyEnabled: mask.modelConfig.frequency_penalty_enabled,
      presencePenalty: mask.modelConfig.presence_penalty,
      presencePenaltyEnabled: mask.modelConfig.presence_penalty_enabled,
      sendMemory: mask.modelConfig.sendMemory,
      reasoning_effort: mask.modelConfig.reasoning_effort,
    });
  }, [mask.modelConfig]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const containerHeight = containerRef.current?.offsetHeight || 60;
        const maxY = window.innerHeight - containerHeight;
        return {
          x: 0,
          y: Math.min(prev.y, maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetElement = e.target as Element;
    if (isOpen && targetElement.closest("button, a, input, select, textarea")) {
      // Don't start dragging if clicking on an interactive element inside the open menu
      return;
    }

    if (containerRef.current) {
      setIsDragging(true);
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: 0, // Keep x fixed
        y: e.clientY - rect.top,
      });
      // Prevent text selection only during drag start
      e.preventDefault();
    }
  };

  // 处理拖动过程
  const handleDrag = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      // Ensure containerRef exists
      const newY = e.clientY - dragOffset.y;

      // --- MODIFIED: Use containerRef for height calculation ---
      const containerHeight = containerRef.current.offsetHeight;
      const maxY = window.innerHeight - containerHeight;

      setPosition({
        x: 0, // Keep fixed to right
        y: Math.max(0, Math.min(newY, maxY)), // Ensure y stays within bounds
      });
    }
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    if (isDragging) {
      // Only save position if a drag actually occurred
      setIsDragging(false);
      // Use a functional update for setPosition to ensure we have the latest state
      setPosition((currentPos) => {
        localStorage.setItem(
          "floatingButtonPosition",
          JSON.stringify(currentPos),
        );
        return currentPos;
      });
    }
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const targetElement = e.target as Element;
    if (isOpen && targetElement.closest("button, a, input, select, textarea")) {
      return;
    }

    if (containerRef.current) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: 0,
        y: touch.clientY - rect.top,
      });
      // Don't preventDefault here for touchstart to allow clicks/taps on button
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && containerRef.current) {
      // Prevent scrolling while dragging
      e.preventDefault();
      const touch = e.touches[0];
      const newY = touch.clientY - dragOffset.y;
      const containerHeight = containerRef.current.offsetHeight;
      const maxY = window.innerHeight - containerHeight;
      setPosition({
        x: 0,
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd(); // Reuse the mouseup logic
  };

  // 添加和移除全局事件监听器
  useEffect(() => {
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleTouchMove as EventListener);
    window.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove as EventListener);
      window.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [isDragging, dragOffset]);

  // 保存位置到本地存储
  useEffect(() => {
    const savedPosition = localStorage.getItem("floatingButtonPosition");

    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
    }
  }, []);

  useEffect(() => {
    const savedPosition = localStorage.getItem("floatingButtonPosition");
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        // Validate loaded position
        if (typeof pos.y === "number") {
          // Use containerRef for initial positioning check if possible, otherwise estimate
          const initialHeight = containerRef.current?.offsetHeight || 60;
          const maxY = window.innerHeight - initialHeight;
          setPosition({ x: 0, y: Math.max(0, Math.min(pos.y, maxY)) });
        }
      } catch (error) {
        console.error("Failed to parse saved position:", error);
        // Optionally reset to default if parsing fails
        // localStorage.removeItem("floatingButtonPosition");
        // setPosition({ x: 0, y: 100 });
      }
    }
    // Ensure position is correct after initial render potentially changes height
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        const currentHeight = containerRef.current.offsetHeight;
        const maxY = window.innerHeight - currentHeight;
        setPosition((prev) => ({
          x: 0,
          y: Math.max(0, Math.min(prev.y, maxY)),
        }));
      }
    }, 100); // Small delay to allow rendering

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures this runs only once on mount

  // 切换主题
  const toggleTheme = () => {
    config.update(
      (config) =>
        (config.theme = config.theme === Theme.Dark ? Theme.Light : Theme.Dark),
    );
  };

  // 处理参数启用/禁用状态切换
  const toggleParamEnabled = (param: string) => {
    const modelConfig = { ...mask.modelConfig };

    switch (param) {
      case "temperature":
        modelConfig.temperature_enabled = !modelConfig.temperature_enabled;
        break;
      case "topP":
        modelConfig.top_p_enabled = !modelConfig.top_p_enabled;
        break;
      case "frequencyPenalty":
        modelConfig.frequency_penalty_enabled =
          !modelConfig.frequency_penalty_enabled;
        break;
      case "presencePenalty":
        modelConfig.presence_penalty_enabled =
          !modelConfig.presence_penalty_enabled;
        break;
      case "maxTokens":
        modelConfig.max_tokens_enabled = !modelConfig.max_tokens_enabled;
        break;
    }

    // 更新会话配置
    chatStore.updateCurrentSession((session) => {
      session.mask.modelConfig = modelConfig;
    });
  };

  // 格式化数值显示
  const formatValue = (value: number, digits: number = 1) => {
    return value.toFixed(digits);
  };

  // 根据参数是否启用返回CSS类名
  const getParamItemClass = (isEnabled: boolean) => {
    return isEnabled
      ? styles.paramItem
      : `${styles.paramItem} ${styles.paramItemDisabled}`;
  };

  // 上下文统计
  const getHistoryStat = () => {
    const session = chatStore.currentSession();
    const messages = session.messages;
    const modelConfig = session.mask.modelConfig;
    // Initialize counters
    let historyMessageCount = modelConfig.historyMessageCount;
    let historyMaxTokens = modelConfig.sendMemory
      ? modelConfig.compressMessageLengthThreshold
      : "∞";
    let validMsgCnt = 0;
    let totalTokens = 0;

    // 1. Handle cases where there's no session or no messages
    if (!session || !messages || messages.length === 0) {
      return `↑ 0 / 0`;
    }

    // 2. Iterate through messages in reverse order (from newest to oldest)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      // 3. Check if this message marks the context as expired.
      if (message.beClear === true) {
        break; // Exit the loop, stop processing older messages
      }

      validMsgCnt++;

      // 4. Count tokens based on role and available data
      if (message.role === "assistant") {
        if (message.statistic?.completionTokens !== undefined) {
          totalTokens += message.statistic.completionTokens;
        } else {
          // Estimate and update
          const tokens = estimateTokenLengthInLLM(
            getMessageTextContentWithoutThinking(message),
          ); // Assuming message.content is the text
          totalTokens += tokens;
          // Update session to avoid recalculation
          if (message) {
            // 再次检查确保消息存在
            if (!message.statistic) {
              message.statistic = {};
            }
            message.statistic.completionTokens = tokens;
          }
        }
      } else {
        if (message.statistic?.singlePromptTokens !== undefined) {
          totalTokens += message.statistic.singlePromptTokens;
        } else {
          // Estimate and update
          const tokens = estimateTokenLengthInLLM(
            getMessageTextContent(message),
          ); // Assuming message.content is the text
          totalTokens += tokens;
          // Update session to avoid recalculation
          if (!message.statistic) {
            message.statistic = {};
          }
          message.statistic.singlePromptTokens = tokens;
        }
      }
    }
    // 5. Return the formatted result
    return `${historyMessageCount}/${historyMaxTokens} : ${validMsgCnt} / ${totalTokens}`;
  };

  if (!config.enableFloatingButton) {
    return null;
  }
  const renderReasoningEffort = () => {
    const value = sessionInfo.reasoning_effort || "none";
    const isDisabled = value === "none";

    const handleReasoningEffortChange = (
      e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
      const newValue = e.currentTarget.value;
      chatStore.updateCurrentSession((session) => {
        session.mask.modelConfig.reasoning_effort = newValue;
      });

      // Manually update sessionInfo to force a re-render
      setSessionInfo((prev) => ({
        ...prev,
        reasoning_effort: newValue,
      }));
    };
    return (
      <div
        className={
          isDisabled
            ? `${styles.paramItem} ${styles.paramItemDisabled}`
            : styles.paramItem
        }
      >
        {Locale.Settings.Params.reasoning_effort.tip && (
          <div className={styles.tooltip}>
            {Locale.Settings.Params.reasoning_effort.tip}
          </div>
        )}
        <div className={styles.paramLabel}>
          <span>{Locale.Settings.Params.reasoning_effort.name}</span>
          <div className={styles.statusContainer}>
            <span
              className={`${styles.enableIndicator} ${
                !isDisabled ? styles.enabled : ""
              }`}
            ></span>
          </div>
        </div>
        <div className={styles.paramValueContainer}>
          <Select value={value} onChange={handleReasoningEffortChange}>
            <option value="low">low</option>
            <option value="high">high</option>
            <option value="none">none</option>
          </Select>
        </div>
      </div>
    );
  };
  return (
    <div
      // --- MODIFIED: Use containerRef and add touch handler ---
      ref={containerRef}
      className={`${styles.floatingContainer} ${
        isDragging ? styles.dragging : ""
      }`} // Optional: Add dragging class
      style={{
        top: `${position.y}px`,
        // Add touch-action to prevent browser scrolling interfering with drag
        touchAction: "none",
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleTouchStart} // Add touch handler
    >
      {isOpen ? (
        <div
          className={`${styles.menuContainer} ${styles.menuOpen} ${styles.menuLeft}`}
        >
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon width={iconSize} height={iconSize} />
          </button>

          <div className={styles.sessionInfoSection}>
            <div
              className={`${styles.sectionHeader} ${styles.collapsibleHeader}`}
              onClick={toggleParamsCollapse}
            >
              <span className={styles.headerTitleWrapper}>
                <span className={`${styles.collapseIndicator}`}>
                  {isParamsCollapsed ? <CollapseIcon /> : <ExpandIcon />}
                </span>
                <span className={styles.headerTitle}>
                  {Locale.Settings.Params.SessionInfo}
                </span>
              </span>
            </div>
            <div
              className={styles.paramItem}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className={styles.paramLabel}>
                {Locale.Settings.Params.current_history}
              </div>
              <div className={styles.paramValue}>{getHistoryStat()}</div>
            </div>
            <div className={styles.divider}></div>
            <div
              className={`${styles.collapsibleContent} ${
                isParamsCollapsed ? styles.collapsed : ""
              }`}
            >
              <div className={styles.paramGrid}>
                {renderParamItem(
                  "temperature",
                  Locale.Settings.Params.temperature.name,
                  sessionInfo.temperature,
                  sessionInfo.temperatureEnabled,
                  1,
                  Locale.Settings.Params.temperature.tip,
                )}
                {renderParamItem(
                  "topP",
                  Locale.Settings.Params.top_p.name,
                  sessionInfo.topP,
                  sessionInfo.topPEnabled,
                  2,
                  Locale.Settings.Params.top_p.tip,
                )}
                {renderParamItem(
                  "frequencyPenalty",
                  Locale.Settings.Params.frequency_penalty.name,
                  sessionInfo.frequencyPenalty,
                  sessionInfo.frequencyPenaltyEnabled,
                  1,
                  Locale.Settings.Params.frequency_penalty.tip,
                )}
                {renderParamItem(
                  "presencePenalty",
                  Locale.Settings.Params.presence_penalty.name,
                  sessionInfo.presencePenalty,
                  sessionInfo.presencePenaltyEnabled,
                  1,
                  Locale.Settings.Params.presence_penalty.tip,
                )}
                {renderParamItem(
                  "maxTokens",
                  Locale.Settings.Params.max_tokens.name,
                  sessionInfo.maxTokens,
                  sessionInfo.maxTokensEnabled,
                  0,
                  Locale.Settings.Params.max_tokens.tip,
                )}
                {renderReasoningEffort()}
              </div>
              <div className={styles.divider}></div>
            </div>
          </div>

          {/* 功能区 - 水平排列的按钮 */}
          <div className={styles.actionButtonsContainer}>
            <button
              className={styles.actionButton}
              onClick={() =>
                chatStore.newSession(chatStore.currentSession().mask)
              }
              title={Locale.Home.NewChat}
            >
              <MessageSquareIcon width={iconSize} height={iconSize} />
            </button>

            <button
              className={styles.actionButton}
              onClick={toggleTheme}
              title={config.theme}
            >
              {config.theme === Theme.Dark ? (
                <SunIcon width={iconSize} height={iconSize} />
              ) : (
                <MoonIcon width={iconSize} height={iconSize} />
              )}
            </button>

            {location.pathname === Path.Settings ? (
              <button
                className={styles.actionButton}
                onClick={() => navigate(Path.Home)}
                title={Locale.NewChat.Return}
              >
                <HomeIcon width={iconSize} height={iconSize} />
              </button>
            ) : (
              <button
                className={styles.actionButton}
                onClick={() => navigate(Path.Settings)}
                title={Locale.Settings.Title}
              >
                <SettingsIcon width={iconSize} height={iconSize} />
              </button>
            )}
            {location.pathname === Path.CustomProvider ? (
              <button
                className={styles.actionButton}
                onClick={() => navigate(Path.Home)}
                title={Locale.NewChat.Return}
              >
                <HomeIcon width={iconSize} height={iconSize} />
              </button>
            ) : (
              <button
                className={styles.actionButton}
                onClick={() => navigate(Path.CustomProvider)}
                title={Locale.CustomProvider.Title}
              >
                <CustomProviderIcon width={iconSize} height={iconSize} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          className={styles.floatingButton}
          onClick={() => setIsOpen(true)}
        >
          <div className={styles.buttonContent}>
            <PlusIcon width={iconSize} height={iconSize} />
          </div>
        </button>
      )}
    </div>
  );
}
