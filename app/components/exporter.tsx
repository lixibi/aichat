/* eslint-disable @next/next/no-img-element */
import { ChatMessage, useAppConfig, useChatStore } from "../store";
import Locale from "../locales";
import styles from "./exporter.module.scss";
import chatStyles from "./chat.module.scss";
import {
  List,
  ListItem,
  Modal,
  Select,
  showImageModal,
  showModal,
  showToast,
} from "./ui-lib";
import { IconButton } from "./button";
import {
  copyToClipboard,
  downloadAs,
  getMessageFiles,
  getMessageImages,
  useMobileScreen,
} from "../utils";

import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import ChatGptIcon from "../icons/chatgpt.png";
import ShareIcon from "../icons/share.svg";
import BotIcon from "../icons/bot.png";

import DownloadIcon from "../icons/download.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSelector, useMessageSelector } from "./message-selector";
import { Avatar } from "./emoji";
import dynamic from "next/dynamic";
import NextImage from "next/image";

import { toBlob, toPng } from "html-to-image";
import { DEFAULT_MASK_AVATAR } from "../store/mask";

import { prettyObject } from "../utils/format";
import {
  EXPORT_MESSAGE_CLASS_NAME,
  ModelProvider,
  REPO_URL,
} from "../constant";
import { getClientConfig } from "../config/client";
import { ClientApi } from "../client/api";
import { getMessageTextContent } from "../utils";
import { identifyDefaultClaudeModel } from "../utils/checkers";
import { useAllModels } from "../utils/hooks";

import { FileIcon, defaultStyles } from "react-file-icon";
import type { DefaultExtensionType } from "react-file-icon";
import { estimateMessageTokenInLLM } from "../store/chat";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function ExportMessageModal(props: { onClose: () => void }) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Export.Title}
        onClose={props.onClose}
        footer={
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 14,
              opacity: 0.5,
            }}
          >
            {Locale.Exporter.Description.Title}
          </div>
        }
      >
        <div style={{ minHeight: "40vh" }}>
          <MessageExporter />
        </div>
      </Modal>
    </div>
  );
}

function useSteps(
  steps: Array<{
    name: string;
    value: string;
  }>,
) {
  const stepCount = steps.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const nextStep = () =>
    setCurrentStepIndex((currentStepIndex + 1) % stepCount);
  const prevStep = () =>
    setCurrentStepIndex((currentStepIndex - 1 + stepCount) % stepCount);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    currentStep: steps[currentStepIndex],
  };
}

function Steps<
  T extends {
    name: string;
    value: string;
  }[],
>(props: { steps: T; onStepChange?: (index: number) => void; index: number }) {
  const steps = props.steps;
  const stepCount = steps.length;

  return (
    <div className={styles["steps"]}>
      <div className={styles["steps-progress"]}>
        <div
          className={styles["steps-progress-inner"]}
          style={{
            width: `${((props.index + 1) / stepCount) * 100}%`,
          }}
        ></div>
      </div>
      <div className={styles["steps-inner"]}>
        {steps.map((step, i) => {
          return (
            <div
              key={i}
              className={`${styles["step"]} ${
                styles[i <= props.index ? "step-finished" : ""]
              } ${i === props.index && styles["step-current"]} clickable`}
              onClick={() => {
                props.onStepChange?.(i);
              }}
              role="button"
            >
              <span className={styles["step-index"]}>{i + 1}</span>
              <span className={styles["step-name"]}>{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageExporter() {
  const steps = [
    {
      name: Locale.Export.Steps.Select,
      value: "select",
    },
    {
      name: Locale.Export.Steps.Preview,
      value: "preview",
    },
  ];
  const { currentStep, setCurrentStepIndex, currentStepIndex } =
    useSteps(steps);
  const formats = ["text", "image", "json"] as const;
  type ExportFormat = (typeof formats)[number];

  const [exportConfig, setExportConfig] = useState({
    format: "image" as ExportFormat,
    includeContext: true,
    useDisplayName: true,
    shareSessionTitle: "",
  });

  function updateExportConfig(updater: (config: typeof exportConfig) => void) {
    const config = { ...exportConfig };
    updater(config);
    setExportConfig(config);
  }

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const { selection, updateSelection } = useMessageSelector();
  const selectedMessages = useMemo(() => {
    const ret: ChatMessage[] = [];
    if (exportConfig.includeContext) {
      ret.push(...session.mask.context);
    }
    ret.push(...session.messages.filter((m) => selection.has(m.id)));
    return ret;
  }, [
    exportConfig.includeContext,
    session.messages,
    session.mask.context,
    selection,
  ]);
  function preview() {
    if (exportConfig.format === "text") {
      return (
        <MarkdownPreviewer
          messages={selectedMessages}
          topic={exportConfig.shareSessionTitle || session.topic}
          useDisplayName={exportConfig.useDisplayName}
        />
      );
    } else if (exportConfig.format === "json") {
      return (
        <JsonPreviewer
          messages={selectedMessages}
          topic={exportConfig.shareSessionTitle || session.topic}
          useDisplayName={exportConfig.useDisplayName}
        />
      );
    } else {
      return (
        <ImagePreviewer
          messages={selectedMessages}
          topic={exportConfig.shareSessionTitle || session.topic}
          useDisplayName={exportConfig.useDisplayName}
        />
      );
    }
  }
  return (
    <>
      <Steps
        steps={steps}
        index={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />
      <div
        className={styles["message-exporter-body"]}
        style={currentStep.value !== "select" ? { display: "none" } : {}}
      >
        <List>
          <ListItem
            title={Locale.Export.Format.Title}
            subTitle={Locale.Export.Format.SubTitle}
          >
            <Select
              value={exportConfig.format}
              onChange={(e) =>
                updateExportConfig(
                  (config) =>
                    (config.format = e.currentTarget.value as ExportFormat),
                )
              }
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Export.IncludeContext.Title}
            subTitle={Locale.Export.IncludeContext.SubTitle}
          >
            <input
              type="checkbox"
              checked={exportConfig.includeContext}
              onChange={(e) => {
                updateExportConfig(
                  (config) => (config.includeContext = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          <ListItem
            title={Locale.Export.UseDisplayName.Title}
            subTitle={Locale.Export.UseDisplayName.SubTitle}
          >
            <input
              type="checkbox"
              checked={exportConfig.useDisplayName}
              onChange={(e) => {
                updateExportConfig(
                  (config) => (config.useDisplayName = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          <ListItem
            title={Locale.Export.ShareSessionTitle.Title}
            subTitle={Locale.Export.ShareSessionTitle.SubTitle}
          >
            <input
              type="text"
              style={{ width: "100%" }}
              value={exportConfig.shareSessionTitle || session.topic}
              onChange={(e) => {
                updateExportConfig(
                  (config) =>
                    (config.shareSessionTitle = e.currentTarget.value),
                );
              }}
            ></input>
          </ListItem>
        </List>
        <MessageSelector
          selection={selection}
          updateSelection={updateSelection}
          defaultSelectAll
        />
      </div>
      {currentStep.value === "preview" && (
        <div className={styles["message-exporter-body"]}>{preview()}</div>
      )}
    </>
  );
}

export function RenderExport(props: {
  messages: ChatMessage[];
  onRender: (messages: ChatMessage[]) => void;
}) {
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domRef.current) return;
    const dom = domRef.current;
    const messages = Array.from(
      dom.getElementsByClassName(EXPORT_MESSAGE_CLASS_NAME),
    );

    if (messages.length !== props.messages.length) {
      return;
    }

    const renderMsgs = messages.map((v, i) => {
      const [role, _] = v.id.split(":");
      return {
        id: i.toString(),
        role: role as any,
        content: role === "user" ? v.textContent ?? "" : v.innerHTML,
        date: "",
      };
    });

    props.onRender(renderMsgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={domRef}>
      {props.messages.map((m, i) => (
        <div
          key={i}
          id={`${m.role}:${i}`}
          className={EXPORT_MESSAGE_CLASS_NAME}
        >
          <Markdown content={getMessageTextContent(m)} defaultShow />
        </div>
      ))}
    </div>
  );
}

export function PreviewActions(props: {
  download: () => void;
  copy: () => void;
  showCopy?: boolean;
  messages?: ChatMessage[];
}) {
  const [loading, setLoading] = useState(false);
  const [shouldExport, setShouldExport] = useState(false);
  const config = useAppConfig();
  const onRenderMsgs = (msgs: ChatMessage[]) => {
    setShouldExport(false);

    var api: ClientApi;
    if (config.modelConfig.model.startsWith("gemini")) {
      api = new ClientApi(ModelProvider.GeminiPro);
    } else if (identifyDefaultClaudeModel(config.modelConfig.model)) {
      api = new ClientApi(ModelProvider.Claude);
    } else {
      api = new ClientApi(ModelProvider.GPT);
    }

    api
      .share(msgs)
      .then((res) => {
        if (!res) return;
        showModal({
          title: Locale.Export.Share,
          children: [
            <input
              type="text"
              value={res}
              key="input"
              style={{
                width: "100%",
                maxWidth: "unset",
              }}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            ></input>,
          ],
          actions: [
            <IconButton
              icon={<CopyIcon />}
              text={Locale.Chat.Actions.Copy}
              key="copy"
              onClick={() => copyToClipboard(res)}
            />,
          ],
        });
        setTimeout(() => {
          window.open(res, "_blank");
        }, 800);
      })
      .catch((e) => {
        console.error("[Share]", e);
        showToast(prettyObject(e));
      })
      .finally(() => setLoading(false));
  };

  const share = async () => {
    if (props.messages?.length) {
      setLoading(true);
      setShouldExport(true);
    }
  };

  return (
    <>
      <div className={styles["preview-actions"]}>
        {props.showCopy && (
          <IconButton
            text={Locale.Export.Copy}
            bordered
            shadow
            icon={<CopyIcon />}
            onClick={props.copy}
          ></IconButton>
        )}
        <IconButton
          text={Locale.Export.Download}
          bordered
          shadow
          icon={<DownloadIcon />}
          onClick={props.download}
        ></IconButton>
        {/* <IconButton
          text={Locale.Export.Share}
          bordered
          shadow
          icon={loading ? <LoadingIcon /> : <ShareIcon />}
          onClick={share}
        ></IconButton> */}
      </div>
      <div
        style={{
          position: "fixed",
          right: "200vw",
          pointerEvents: "none",
        }}
      >
        {shouldExport && (
          <RenderExport
            messages={props.messages ?? []}
            onRender={onRenderMsgs}
          />
        )}
      </div>
    </>
  );
}

interface ExportAvatarProps {
  avatar?: string;
  model?: string;
}
function ExportAvatar(props: ExportAvatarProps) {
  const { avatar, model } = props;

  if (!model && avatar && avatar === DEFAULT_MASK_AVATAR) {
    return (
      <img
        src={BotIcon.src}
        width={30}
        height={30}
        alt="bot"
        className="user-avatar"
      />
    );
  }
  return <Avatar model={model} avatar={avatar} />;
}

export function ImagePreviewer(props: {
  messages: ChatMessage[];
  topic: string;
  useDisplayName: boolean;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const mask = session.mask;
  const config = useAppConfig();

  const previewRef = useRef<HTMLDivElement>(null);

  const copy = () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;
    toBlob(dom).then((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard
          .write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])
          .then(() => {
            showToast(Locale.Copy.Success);
            refreshPreview();
          });
      } catch (e) {
        console.error("[Copy Image] ", e);
        showToast(Locale.Copy.Failed);
      }
    });
  };

  const isMobile = useMobileScreen();

  const download = async () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;

    const isApp = getClientConfig()?.isApp;

    try {
      const blob = await toPng(dom);
      if (!blob) return;

      if (isMobile || (isApp && window.__TAURI__)) {
        if (isApp && window.__TAURI__) {
          const result = await window.__TAURI__.dialog.save({
            defaultPath: `${props.topic}.png`,
            filters: [
              {
                name: "PNG Files",
                extensions: ["png"],
              },
              {
                name: "All Files",
                extensions: ["*"],
              },
            ],
          });

          if (result !== null) {
            const response = await fetch(blob);
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            await window.__TAURI__.fs.writeBinaryFile(result, uint8Array);
            showToast(Locale.Download.Success);
          } else {
            showToast(Locale.Download.Failed);
          }
        } else {
          showImageModal(blob);
        }
      } else {
        const link = document.createElement("a");
        link.download = `${props.topic}.png`;
        link.href = blob;
        link.click();
        refreshPreview();
      }
    } catch (error) {
      showToast(Locale.Download.Failed);
    }
  };

  const refreshPreview = () => {
    const dom = previewRef.current;
    if (dom) {
      dom.innerHTML = dom.innerHTML; // Refresh the content of the preview by resetting its HTML for fix a bug glitching
    }
  };
  const allModels = useAllModels();
  const currentModelName = useMemo(() => {
    if (props.useDisplayName) {
      const model = allModels.find(
        (m) =>
          m.name == mask.modelConfig.model &&
          m?.provider?.providerName == mask.modelConfig.providerName,
      );
      return model?.displayName ?? mask.modelConfig.model;
    } else {
      return mask.modelConfig.model;
    }
  }, [allModels, mask.modelConfig.model, mask.modelConfig.providerName]);

  const estimateMessagesToken = (messages: ChatMessage[]): number => {
    let total = 0;

    for (const message of messages) {
      if (message.role === "assistant") {
        // 处理 assistant 消息的 completionTokens
        total +=
          message.statistic?.completionTokens ??
          estimateMessageTokenInLLM(message);
      } else {
        total +=
          message.statistic?.singlePromptTokens ??
          estimateMessageTokenInLLM(message);
      }
    }
    return total;
  };
  return (
    <div className={styles["image-previewer"]}>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={!isMobile}
        messages={props.messages}
      />
      <div
        className={`${styles["preview-body"]} ${styles["default-theme"]}`}
        ref={previewRef}
      >
        <div className={styles["chat-info"]}>
          <div className={styles["logo"] + " no-dark"}>
            <NextImage
              src={ChatGptIcon.src}
              alt="logo"
              width={50}
              height={50}
            />
          </div>

          <div>
            <div className={styles["main-title"]}>NextChat</div>
            <div className={styles["sub-title"]}>{REPO_URL}</div>
            <div className={styles["icons"]}>
              <ExportAvatar avatar={config.avatar} />
              <span className={styles["icon-space"]}>&</span>
              <ExportAvatar model={currentModelName} />
            </div>
          </div>
          <div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Model}: {currentModelName}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Messages}: {props.messages.length} (
              {estimateMessagesToken(props.messages)} Tokens)
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Topic}: {props.topic}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Time}:{" "}
              {new Date(
                props.messages.at(-1)?.date ?? Date.now(),
              ).toLocaleString()}
            </div>
            <div className={styles["chat-info-item"]}>
              {[
                `temp=${
                  mask.modelConfig.temperature_enabled
                    ? mask.modelConfig.temperature
                    : "X"
                }`,
                `top_p=${
                  mask.modelConfig.top_p_enabled ? mask.modelConfig.top_p : "X"
                }`,
                `P.P=${
                  mask.modelConfig.presence_penalty_enabled
                    ? mask.modelConfig.presence_penalty
                    : "X"
                }`,
                `F.P=${
                  mask.modelConfig.frequency_penalty_enabled
                    ? mask.modelConfig.frequency_penalty
                    : "X"
                }`,
              ].join(", ")}
            </div>
          </div>
        </div>
        {props.messages.map((m, i) => {
          return (
            <div
              className={styles["message"] + " " + styles["message-" + m.role]}
              key={i}
            >
              <div className={styles["avatar"]}>
                <ExportAvatar
                  avatar={m.role === "user" ? config.avatar : mask.avatar}
                  model={
                    m.role === "user"
                      ? undefined
                      : props.useDisplayName
                      ? m.displayName || m.model
                      : m.model
                  }
                />
              </div>

              <div className={styles["body"]}>
                <Markdown
                  content={getMessageTextContent(m)}
                  fontSize={config.fontSize}
                  defaultShow
                  searchingTime={m.statistic?.searchingLatency}
                  thinkingTime={m.statistic?.reasoningLatency}
                />
                {getMessageImages(m).length == 1 && (
                  <img
                    key={i}
                    src={getMessageImages(m)[0]}
                    alt="message"
                    className={styles["message-image"]}
                  />
                )}
                {getMessageImages(m).length > 1 && (
                  <div
                    className={styles["message-images"]}
                    style={
                      {
                        "--image-count": getMessageImages(m).length,
                      } as React.CSSProperties
                    }
                  >
                    {getMessageImages(m).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="message"
                        className={styles["message-image-multi"]}
                      />
                    ))}
                  </div>
                )}
                {getMessageFiles(m).length > 0 && (
                  <div className={chatStyles["chat-message-item-files"]}>
                    {getMessageFiles(m).map((file, index) => {
                      const extension: DefaultExtensionType = file.name
                        .split(".")
                        .pop()
                        ?.toLowerCase() as DefaultExtensionType;
                      const style = defaultStyles[extension];
                      return (
                        <a
                          // href={file.url}
                          // target="_blank"
                          key={index}
                          className={chatStyles["chat-message-item-file"]}
                        >
                          <div
                            className={
                              chatStyles["chat-message-item-file-icon"] +
                              " no-dark"
                            }
                          >
                            <FileIcon {...style} glyphColor="#303030" />
                          </div>
                          <div
                            className={
                              chatStyles["chat-message-item-file-name"]
                            }
                          >
                            {file.name}{" "}
                            {file?.size !== undefined
                              ? `(${file.size}K, ${file.tokenCount}Tokens)`
                              : `(${file.tokenCount}K)`}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarkdownPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
  useDisplayName: boolean;
}) {
  const mdText =
    `# ${props.topic}\n\n` +
    props.messages
      .map((m) => {
        const textContent = getMessageTextContent(m);
        const images = getMessageImages(m);
        const files = getMessageFiles(m);
        let messageContent = "";
        // 添加角色和文本内容
        messageContent +=
          m.role === "user"
            ? `## ${Locale.Export.MessageFromYou}:\n${textContent}`
            : `## ${m.model}:\n${textContent.trim()}`;

        // 添加图像内容
        if (images && images.length > 0) {
          messageContent += "\n\n### 图像附件:\n";
          images.forEach((image, index) => {
            messageContent += `\n![图像 ${index + 1}](${image})`;
          });
        }

        // 添加文件内容
        if (files && files.length > 0) {
          messageContent += "\n\n### 文件附件:\n";
          files.forEach((file, index) => {
            const fileInfo =
              file.size !== undefined
                ? `(${file.size}K, ${file.tokenCount}Tokens)`
                : `(${file.tokenCount}Tokens)`;
            messageContent += `\n- [${file.name}](${file.url}) ${fileInfo}`;
          });
        }

        return messageContent;
      })
      .join("\n\n");

  const copy = () => {
    copyToClipboard(mdText);
  };
  const download = () => {
    downloadAs(mdText, `${props.topic}.md`);
  };
  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={true}
        messages={props.messages}
      />
      <div className="markdown-body">
        <pre className={styles["export-content"]}>{mdText}</pre>
      </div>
    </>
  );
}

export function JsonPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
  useDisplayName: boolean;
}) {
  const msgs = {
    sessionTitle: props.topic.trim(),
    messages: [
      {
        role: "system",
        content: `${Locale.FineTuned.Sysmessage}`,
      },
      ...props.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  };
  const mdText = "```json\n" + JSON.stringify(msgs, null, 2) + "\n```";
  const minifiedJson = JSON.stringify(msgs);

  const copy = () => {
    copyToClipboard(minifiedJson);
  };
  const download = () => {
    downloadAs(JSON.stringify(msgs), `${props.topic}.json`);
  };

  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={false}
        messages={props.messages}
      />
      <div className="markdown-body" onClick={copy}>
        <Markdown content={mdText} />
      </div>
    </>
  );
}
