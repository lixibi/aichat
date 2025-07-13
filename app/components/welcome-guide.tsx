import React, { useState, useEffect } from "react";
import { IconButton } from "./button";
import { Modal, showToast, showConfirm } from "./ui-lib";
import { useCustomProviderStore } from "../store/provider";
import { downloadAs, readFromFile } from "../utils";
import { userCustomProvider } from "../client/api";
import styles from "./welcome-guide.module.scss";

import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import CloseIcon from "../icons/close.svg";

export function WelcomeGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const providerStore = useCustomProviderStore();

  useEffect(() => {
    // Check if user is first time and hasn't seen welcome
    if (providerStore.isFirstTimeUser() && !providerStore.hasShownWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/default-providers-template.json");
      const template = await response.text();
      downloadAs(template, "provider-config-template.json");
      showToast("配置模板已下载，请编辑后导入");
    } catch (error) {
      console.error("Failed to download template:", error);
      showToast("下载模板失败");
    }
  };

  const handleImportConfig = async () => {
    try {
      const rawContent = await readFromFile();
      if (!rawContent) return;

      const importedProviders = JSON.parse(rawContent) as userCustomProvider[];
      
      if (!Array.isArray(importedProviders)) {
        throw new Error("配置文件格式不正确");
      }

      // Check for template placeholders
      const hasPlaceholders = importedProviders.some(
        (provider) => 
          provider.apiKey === "YOUR_API_KEY_HERE" || 
          provider.apiKey.includes("YOUR_") ||
          !provider.apiKey.trim()
      );

      if (hasPlaceholders) {
        const shouldContinue = await showConfirm(
          "检测到配置文件中包含模板占位符，请确保已填入真实的API密钥。是否继续导入？"
        );
        if (!shouldContinue) return;
      }

      providerStore.importFromTemplate(importedProviders);
      setIsVisible(false);
      showToast(`成功导入 ${importedProviders.length} 个AI提供商配置`);
    } catch (error) {
      console.error("Import failed:", error);
      showToast("导入失败：" + (error as Error).message);
    }
  };

  const handleSkip = () => {
    providerStore.markWelcomeShown();
    setIsVisible(false);
  };

  const handleLater = () => {
    setIsVisible(false);
    // Don't mark as shown, will show again next time
  };

  if (!isVisible) return null;

  return (
    <Modal title="🎉 欢迎使用李希宁AI" onClose={handleLater}>
      <div className={styles["welcome-content"]}>
        <div className={styles["welcome-text"]}>
          <h3>🚀 快速开始使用</h3>
          <p>为了更好地使用AI助手，建议您先配置AI提供商。</p>
          
          <div className={styles["guide-steps"]}>
            <div className={styles["step"]}>
              <span className={styles["step-number"]}>1</span>
              <div className={styles["step-content"]}>
                <strong>下载配置模板</strong>
                <p>获取预配置的提供商模板文件</p>
              </div>
            </div>
            
            <div className={styles["step"]}>
              <span className={styles["step-number"]}>2</span>
              <div className={styles["step-content"]}>
                <strong>编辑配置文件</strong>
                <p>将模板中的 "YOUR_API_KEY_HERE" 替换为真实的API密钥</p>
              </div>
            </div>
            
            <div className={styles["step"]}>
              <span className={styles["step-number"]}>3</span>
              <div className={styles["step-content"]}>
                <strong>导入配置</strong>
                <p>将编辑好的配置文件导入到应用中</p>
              </div>
            </div>
          </div>

          <div className={styles["security-note"]}>
            <strong>🔒 安全提示：</strong>
            <p>API密钥仅存储在您的本地设备中，不会上传到任何服务器。</p>
          </div>
        </div>

        <div className={styles["action-buttons"]}>
          <IconButton
            icon={<DownloadIcon />}
            text="下载配置模板"
            onClick={handleDownloadTemplate}
            className={styles["primary-btn"]}
          />
          
          <IconButton
            icon={<UploadIcon />}
            text="导入配置文件"
            onClick={handleImportConfig}
            className={styles["primary-btn"]}
          />
          
          <div className={styles["secondary-actions"]}>
            <button 
              className={styles["text-btn"]} 
              onClick={handleSkip}
            >
              跳过，稍后配置
            </button>
            
            <button 
              className={styles["text-btn"]} 
              onClick={handleLater}
            >
              稍后提醒
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}