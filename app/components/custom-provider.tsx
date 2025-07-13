import { nanoid } from "nanoid";
import React, { useState, useEffect } from "react";
import { IconButton } from "./button";
import styles from "./custom-provider.module.scss";
import { useMatch, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { downloadAs, readFromFile } from "../utils";
import Locale from "../locales";
import { showToast, showConfirm } from "./ui-lib";
import { useAccessStore } from "../store";
import { Model, userCustomProvider } from "../client/api";
import { getClientConfig } from "../config/client";
import {
  API_CONCURRENCY_LIMIT,
  ProviderModal,
  providerTypeLabels,
  providerTypeDefaultUrls,
} from "./provider-modal";
import { useCustomProviderStore } from "../store/provider";
// 导入图标
import PlusIcon from "../icons/add.svg";
import EditIcon from "../icons/edit.svg";
import TrashIcon from "../icons/delete.svg";
import CloseIcon from "../icons/close.svg";
import LoadingIcon from "../icons/loading.svg";
import SearchIcon from "../icons/zoom.svg";
import EnableIcon from "../icons/light.svg";
import DisableIcon from "../icons/lightning.svg";
import ImportIcon from "../icons/download.svg";
import ExportIcon from "../icons/upload.svg";

const isApp = !!getClientConfig()?.isApp;

function getAvailableModelsTooltip(provider: userCustomProvider) {
  if (!provider.models || provider.models.length === 0)
    return "No available models";
  const availableModels = provider.models.filter((m) => m.available);
  if (availableModels.length === 0) return "No available models";
  return availableModels.map((m) => m.name).join("\n");
}

export function CustomProvider() {
  const match = useMatch(`${Path.CustomProvider}/:providerId`);
  const providerId = match?.params?.providerId;

  // const [providers, setProviders] = useState<userCustomProvider[]>([]);
  const providers = useCustomProviderStore((state) => state.providers);
  const storeActions = useCustomProviderStore.getState();

  // // 确保数据已从 localStorage 迁移
  // useEffect(() => {
  //   storeActions.migrateDataIfNeeded();
  // }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<userCustomProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // 在 CustomProvider 函数中添加状态
  const [providerBalances, setProviderBalances] = useState<
    Record<string, string>
  >({});
  // 已有的 isSumming 状态可以改为记录每个提供商的加载状态
  const [loadingBalances, setLoadingBalances] = useState<
    Record<string, boolean>
  >({});

  const navigate = useNavigate();

  // 导航到指定渠道编辑页
  useEffect(() => {
    if (providerId && providers.length > 0) {
      const providerToEdit = providers.find((p) => p.id === providerId);
      if (providerToEdit) {
        setCurrentProvider(providerToEdit);
        setIsModalOpen(true);
      }
    }
  }, [providerId, providers]);

  // // 从本地存储加载数据
  // useEffect(() => {
  //   const loadProviders = async () => {
  //     setIsLoading(true);
  //     // 从 localStorage 获取数据
  //     const storedProviders = safeLocalStorage().getItem(
  //       StoreKey.CustomProvider,
  //     );

  //     if (storedProviders) {
  //       try {
  //         setProviders(JSON.parse(storedProviders));
  //       } catch (e) {
  //         console.error("Failed to parse stored providers:", e);
  //         setProviders([]);
  //       }
  //     } else {
  //       setProviders([]);
  //     }

  //     setIsLoading(false);
  //   };

  //   loadProviders();
  // }, []);
  // // 保存提供商到本地存储
  // const saveProvidersToStorage = (updatedProviders: userCustomProvider[]) => {
  //   try {
  //     const jsonString = JSON.stringify(updatedProviders);
  //     safeLocalStorage().setItem(StoreKey.CustomProvider, jsonString);
  //   } catch (error) {
  //     console.error("保存到localStorage失败:", error);
  //   }
  // };

  // 导出服务提供商
  const handleExportProviders = () => {
    const datePart = isApp
      ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
          .toLocaleTimeString()
          .replace(/:/g, "_")}`
      : new Date().toLocaleString().replace(/[\/:\\]/g, "_");

    const fileName = `Providers-${datePart}.json`;

    // Export using the utility function
    downloadAs(JSON.stringify(providers, null, 2), fileName);

    showToast("供应商配置已导出");
  };

  // 从 JSON 文件导入服务提供商
  const handleImportProviders = async () => {
    // Create file input element
    try {
      // Read file content using the utility function
      const rawContent = await readFromFile();
      if (!rawContent) return; // User canceled or file was empty

      // Parse the imported data
      const importedProviders = JSON.parse(rawContent) as userCustomProvider[];

      // Validate imported data
      if (!Array.isArray(importedProviders)) {
        throw new Error("导入的文件格式不正确");
      }

      // Confirm import with user
      const confirmContent = (
        <div style={{ lineHeight: "1.4" }}>
          <div style={{ marginBottom: "8px" }}>
            确定要导入这些供应商配置吗？
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderLeft: "3px solid #3b82f6",
              backgroundColor: "#eff6ff",
              margin: "8px 0",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#1e40af",
                marginBottom: "4px",
              }}
            >
              将导入 {importedProviders.length} 个供应商配置:
            </div>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              {importedProviders.map((provider, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>
                    {index + 1}. {provider.name}
                  </span>
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      marginLeft: "8px",
                    }}
                  >
                    {provider.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ marginTop: "12px", fontSize: "14px", color: "#6b7280" }}
          >
            <p style={{ marginBottom: "8px" }}>选择导入方式:</p>
            <div>
              <input
                type="radio"
                id="merge"
                name="importOption"
                value="merge"
                defaultChecked
              />
              <label htmlFor="merge" style={{ marginLeft: "8px" }}>
                合并 - 添加新供应商，保留现有供应商
              </label>
            </div>
            <div style={{ marginTop: "6px" }}>
              <input
                type="radio"
                id="replace"
                name="importOption"
                value="replace"
              />
              <label htmlFor="replace" style={{ marginLeft: "8px" }}>
                替换 - 清除现有供应商，仅使用导入的供应商
              </label>
            </div>
          </div>
        </div>
      );

      if (await showConfirm(confirmContent)) {
        // Get selected import mode
        const selectedRadio = document.querySelector(
          'input[name="importOption"]:checked',
        ) as HTMLInputElement | null;
        const importMode = selectedRadio ? selectedRadio.value : "merge";

        // Process import based on selected mode
        if (importMode === "replace") {
          // Replace existing providers
          // setProviders(importedProviders);
          // saveProvidersToStorage(importedProviders);
          storeActions.setProviders(importedProviders);
          showToast(`已替换为 ${importedProviders.length} 个导入的供应商`);
        } else {
          // Merge with existing providers
          // Add unique ID to imported providers if missing
          const processedImports = importedProviders.map((provider) => ({
            ...provider,
            id: provider.id || `provider-${Date.now()}-${nanoid(7)}`,
          }));
          // Track stats for user feedback
          let mergedCount = 0;
          let renamedCount = 0;
          let addedCount = 0;
          const updatedProviders = [...providers];
          // Process each imported provider
          processedImports.forEach((importedProvider) => {
            // Find existing provider with same name
            const existingProviderIndex = updatedProviders.findIndex(
              (p) => p.name === importedProvider.name,
            );

            if (existingProviderIndex >= 0) {
              const existingProvider = updatedProviders[existingProviderIndex];

              // Check if baseUrl matches
              if (existingProvider.baseUrl === importedProvider.baseUrl) {
                // Merge providers - combine API keys
                const existingKeys = existingProvider.apiKey
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean);
                const importedKeys = importedProvider.apiKey
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean);

                // Combine keys and remove duplicates
                const combinedKeysSet = new Set([
                  ...existingKeys,
                  ...importedKeys,
                ]);
                const combinedKeys = Array.from(combinedKeysSet).join(",");

                // Update the existing provider with merged keys
                updatedProviders[existingProviderIndex] = {
                  ...existingProvider,
                  apiKey: combinedKeys,
                  // Optionally merge other fields if needed
                };

                mergedCount++;
              } else {
                // Same name but different baseUrl - rename and add as new
                let newName = `${importedProvider.name}-1`;
                let counter = 2;

                // Keep incrementing counter until we find a unique name
                while (updatedProviders.some((p) => p.name === newName)) {
                  newName = `${importedProvider.name}-${counter}`;
                  counter++;
                }

                // Add with new name
                updatedProviders.push({
                  ...importedProvider,
                  name: newName,
                  id: `provider-${Date.now()}-${renamedCount}`, // Ensure unique ID
                });

                renamedCount++;
              }
            } else {
              // No name conflict - add directly
              updatedProviders.push(importedProvider);
              addedCount++;
            }
          });
          // setProviders(updatedProviders);
          // saveProvidersToStorage(updatedProviders);
          storeActions.setProviders(updatedProviders);
          showToast(
            `导入完成: ${mergedCount}个合并, ${renamedCount}个重命名, ${addedCount}个新增`,
          );
        }
      }
    } catch (error) {
      console.error("导入失败:", error);
      showToast("导入失败: 文件格式不正确");
    }
  };

  // 过滤提供商
  const filteredProviders = providers.filter((provider) => {
    const search = searchTerm.toLowerCase();

    const hasModelMatch = provider.models?.some((m) =>
      m.name.toLowerCase().includes(search),
    );

    return (
      provider.name.toLowerCase().includes(search) ||
      provider.type.toLowerCase().includes(search) ||
      hasModelMatch
    );
  });

  // 更新添加提供商函数
  const handleAddProvider = () => {
    setCurrentProvider(null); // 设置为 null 表示添加新提供商
    setIsModalOpen(true); // 打开模态框
  };

  // 打开编辑提供商模态框
  const handleEditProvider = (provider: userCustomProvider) => {
    setCurrentProvider(provider);
    setIsModalOpen(true);
  };

  // 删除提供商
  const handleDeleteProvider = async (id: string) => {
    const providerToDelete = providers.find((provider) => provider.id === id);
    const confirmMessage = `${Locale.CustomProvider.ConfirmDeleteProvider}\n\nName: ${providerToDelete?.name}\n\nUrl: ${providerToDelete?.baseUrl}`;
    const confirmContent = (
      <div style={{ lineHeight: "1.4" }}>
        <div style={{ marginBottom: "8px" }}>
          {Locale.CustomProvider.ConfirmDeleteProvider}
        </div>
        <div
          style={{
            padding: "8px 10px",
            borderLeft: "3px solid #f87171",
            backgroundColor: "#fef2f2",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginBottom: "2px",
            }}
          >
            <span style={{ fontWeight: "500", minWidth: "60px" }}>Name: </span>
            <span style={{ color: "#ef4444", fontWeight: "600" }}>
              {providerToDelete?.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontWeight: "500", minWidth: "60px" }}>URL: </span>
            <span
              style={{
                color: "#3b82f6",
                fontWeight: "500",
                marginLeft: "4px",
                wordBreak: "break-all",
              }}
            >
              {providerToDelete?.baseUrl}
            </span>
          </div>
        </div>
        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          此操作不可撤销，请确认是否继续？
        </p>
      </div>
    );
    if (await showConfirm(confirmContent)) {
      const updatedProviders = providers.filter(
        (provider) => provider.id !== id,
      );
      // setProviders(updatedProviders);
      // // 保存到本地存储
      // saveProvidersToStorage(updatedProviders);
      storeActions.setProviders(updatedProviders);
    }
  };

  // 更新保存提供商函数
  const handleSaveProvider = (provider: userCustomProvider) => {
    // 检查数据完整性
    if (!provider.name || !provider.baseUrl || !provider.type) {
      showToast(Locale.CustomProvider.IncompleteData);
      return;
    }
    // 检查是否有重名
    const isDuplicate = providers.some(
      (p) => p.name === provider.name && p.id !== provider.id,
    );
    if (isDuplicate) {
      // 供应商重名: 自动添加后缀
      let newName = provider.name;
      let counter = 1;
      while (
        providers.some((p) => p.name === newName && p.id !== provider.id)
      ) {
        newName = `${provider.name}-${counter}`;
        counter++;
      }
      provider.name = newName;
    }

    let updatedProviders;
    let newProviderId;

    if (currentProvider) {
      // 更新现有提供商
      updatedProviders = providers.map((p) =>
        p.id === provider.id ? provider : p,
      );
      newProviderId = provider.id;
    } else {
      // 添加新提供商
      const newProvider = {
        ...provider,
        id: provider.id || `provider-${Date.now()}`, // 确保有ID
      };
      updatedProviders = [...providers, newProvider];
      newProviderId = newProvider.id;
    }
    storeActions.setProviders(updatedProviders);
    // 显示成功消息
    showToast(
      currentProvider
        ? Locale.CustomProvider.ProviderUpdated
        : Locale.CustomProvider.ProviderAdded,
    );
    return newProviderId; // 返回新提供商的ID
  };
  // 移除禁用渠道函数
  const handleRemoveDisabledProviders = async () => {
    const disabledProviders = providers.filter((p) => p.status === "inactive");

    if (disabledProviders.length === 0) {
      showToast("没有发现禁用的供应商");
      return;
    }

    // 创建确认对话框内容
    const confirmContent = (
      <div style={{ lineHeight: "1.4" }}>
        <div style={{ marginBottom: "8px" }}>
          确定要移除所有禁用的供应商吗？
        </div>

        <div
          style={{
            padding: "8px 10px",
            borderLeft: "3px solid #f87171",
            backgroundColor: "#fef2f2",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#b91c1c",
              marginBottom: "4px",
            }}
          >
            将移除以下供应商:
          </div>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {disabledProviders.map((provider, index) => (
              <div
                key={provider.id}
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {index + 1}. {provider.name}
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginLeft: "8px",
                  }}
                >
                  {provider.type}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "8px",
              color: "#b91c1c",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            共 {disabledProviders.length} 个供应商
          </div>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          此操作不可撤销，请确认是否继续？
        </div>
      </div>
    );

    // 显示确认对话框
    if (await showConfirm(confirmContent)) {
      // 过滤掉禁用的供应商
      const updatedProviders = providers.filter((p) => p.status !== "inactive");
      // setProviders(updatedProviders);
      // saveProvidersToStorage(updatedProviders);
      storeActions.setProviders(updatedProviders);

      showToast(`已成功移除 ${disabledProviders.length} 个禁用供应商`);
    }
  };
  // 移除搜索结果中的供应商函数
  const handleRemoveSearchedProviders = async () => {
    // 如果没有搜索关键词，提示用户
    if (!searchTerm.trim()) {
      showToast("请先输入搜索关键词");
      return;
    }

    // 获取符合搜索条件的供应商
    const searchedProviders = filteredProviders;

    if (searchedProviders.length === 0) {
      showToast("没有找到匹配的供应商");
      return;
    }

    // 创建确认对话框内容
    const confirmContent = (
      <div style={{ lineHeight: "1.4" }}>
        <div style={{ marginBottom: "8px" }}>
          确定要移除所有搜索结果中的供应商吗？
        </div>

        <div
          style={{
            padding: "8px 10px",
            borderLeft: "3px solid #f87171",
            backgroundColor: "#fef2f2",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#b91c1c",
              marginBottom: "4px",
            }}
          >
            搜索关键词: <span style={{ color: "#3b82f6" }}>{searchTerm}</span>
          </div>
          <div
            style={{
              fontWeight: "600",
              color: "#b91c1c",
              marginBottom: "4px",
            }}
          >
            将移除以下供应商:
          </div>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {searchedProviders.map((provider, index) => (
              <div
                key={provider.id}
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {index + 1}. {provider.name}
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginLeft: "8px",
                  }}
                >
                  {provider.type}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "8px",
              color: "#b91c1c",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            共 {searchedProviders.length} 个供应商
          </div>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          此操作不可撤销，请确认是否继续？
        </div>
      </div>
    );

    // 显示确认对话框
    if (await showConfirm(confirmContent)) {
      // 获取要保留的供应商ID列表
      const searchedProviderIds = new Set(searchedProviders.map((p) => p.id));

      // 过滤掉搜索结果中的供应商
      const updatedProviders = providers.filter(
        (p) => !searchedProviderIds.has(p.id),
      );
      // setProviders(updatedProviders);
      // saveProvidersToStorage(updatedProviders);
      storeActions.setProviders(updatedProviders);

      // 清空搜索框
      setSearchTerm("");

      showToast(`已成功移除 ${searchedProviders.length} 个供应商`);
    }
  };
  // 批量启用供应商函数
  const handleBatchEnableProviders = async () => {
    // 获取符合搜索条件的供应商
    const searchedProviders = filteredProviders;

    if (searchedProviders.length === 0) {
      showToast("没有禁用的供应商");
      return;
    }

    const confirmContent = (
      <div style={{ lineHeight: "1.4" }}>
        <div style={{ marginBottom: "8px" }}>确定要启用选中的供应商吗？</div>

        <div
          style={{
            padding: "8px 10px",
            borderLeft: "3px solid #34d399",
            backgroundColor: "#ecfdf5",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#059669",
              marginBottom: "4px",
            }}
          >
            将启用以下供应商:
          </div>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {searchedProviders.map((provider, index) => (
              <div
                key={provider.id}
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {index + 1}. {provider.name}
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginLeft: "8px",
                  }}
                >
                  {provider.type}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "8px",
              color: "#059669",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            共 {searchedProviders.length} 个供应商
          </div>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          确认是否继续？
        </div>
      </div>
    );

    if (await showConfirm(confirmContent)) {
      const updatedProviders = providers.map((p) =>
        p.status === "inactive" ? { ...p, status: "active" as const } : p,
      );
      // setProviders(updatedProviders);
      // saveProvidersToStorage(updatedProviders);
      storeActions.setProviders(updatedProviders);

      showToast(`已成功启用 ${searchedProviders.length} 个供应商`);
    }
  };

  // 批量禁用供应商函数
  const handleBatchDisableProviders = async () => {
    // 获取符合搜索条件的供应商
    const searchedProviders = filteredProviders;

    if (searchedProviders.length === 0) {
      showToast("没有启用的供应商");
      return;
    }

    const confirmContent = (
      <div style={{ lineHeight: "1.4" }}>
        <div style={{ marginBottom: "8px" }}>确定要禁用选中的供应商吗？</div>

        <div
          style={{
            padding: "8px 10px",
            borderLeft: "3px solid #f87171",
            backgroundColor: "#fef2f2",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#b91c1c",
              marginBottom: "4px",
            }}
          >
            将禁用以下供应商:
          </div>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {searchedProviders.map((provider, index) => (
              <div
                key={provider.id}
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {index + 1}. {provider.name}
                </span>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginLeft: "8px",
                  }}
                >
                  {provider.type}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "8px",
              color: "#b91c1c",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            共 {searchedProviders.length} 个供应商
          </div>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          确认是否继续？
        </div>
      </div>
    );

    if (await showConfirm(confirmContent)) {
      const updatedProviders = providers.map((p) =>
        p.status === "active" ? { ...p, status: "inactive" as const } : p,
      );
      // setProviders(updatedProviders);
      // saveProvidersToStorage(updatedProviders);
      storeActions.setProviders(updatedProviders);

      showToast(`已成功禁用 ${searchedProviders.length} 个供应商`);
    }
  };
  // 获取模型数量展示文本
  const getModelCountText = (provider: userCustomProvider) => {
    const count =
      provider.models?.filter((m: Model) => m.available).length || 0;
    return `${count} 个模型`;
  };
  const getKeyCountText = (provider: userCustomProvider) => {
    const allKeys = provider.apiKey
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);
    const total = allKeys.length;

    const enabledKeys = provider.enableKeyList?.length
      ? provider.enableKeyList.map((k) => k.trim()).filter((k) => k)
      : allKeys;
    const enabled = enabledKeys.length;

    return `key: ${enabled}/${total}`;
  };

  // 新增的统计余额函数
  const handleSumBalances = async (provider: userCustomProvider) => {
    const accessStore = useAccessStore.getState();
    const { id, apiKey, baseUrl, type } = provider;

    if (baseUrl.endsWith("#")) {
      showToast("当前渠道不支持余额查询");
      return;
    }

    const keys = apiKey
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length === 0) {
      showToast("没有可用的 API Key 来统计余额。");
      return;
    }

    // 设置当前提供商的加载状态
    setLoadingBalances((prev) => ({ ...prev, [id]: true }));

    try {
      let totalBalance = 0;
      let currency = "";
      const allKeyBalances: number[] = [];

      for (let i = 0; i < keys.length; i += API_CONCURRENCY_LIMIT) {
        // 1. 获取当前批次的 keys
        const batchKeys = keys.slice(i, i + API_CONCURRENCY_LIMIT);

        // 2. (可选) 进度提示 - 如果 keys 数量很大，可以考虑添加
        showToast(
          `正在查询第 ${i + 1} - ${Math.min(
            i + API_CONCURRENCY_LIMIT,
            keys.length,
          )} 个Key的余额...`,
        );

        // 3. 并行执行当前批次的余额查询
        const balancePromisesInBatch = batchKeys.map(async (key) => {
          try {
            let result = null;
            if (type === "openrouter") {
              result = await accessStore.checkOpenRouterBalance(key, baseUrl);
            } else if (type === "siliconflow") {
              result = await accessStore.checkSiliconFlowBalance(key, baseUrl);
            } else if (type === "deepseek") {
              result = await accessStore.checkDeepSeekBalance(key, baseUrl);
            } else if (
              type === "openai" &&
              baseUrl !== providerTypeDefaultUrls[type] // providerTypeDefaultUrls 也需要在此作用域可用
            ) {
              result = await accessStore.checkCustomOpenaiBalance(key, baseUrl);
            }

            if (result && result.isValid && result.totalBalance) {
              if (!currency && result.currency) {
                // 只设置一次 currency
                currency = result.currency;
              }
              return typeof result.totalBalance === "string"
                ? parseFloat(result.totalBalance) || 0
                : Number(result.totalBalance) || 0;
            } else {
              // 对于查询失败或不支持的情况，我们不抛出错误，而是返回0，避免中断整个批处理
              // 错误信息已在API调用层或单个查询中处理
              console.warn(
                `API Key ${key} 余额查询失败或不支持: ${
                  result?.error || "未知原因"
                }`,
              );
              return 0;
            }
          } catch (error) {
            console.error(`API Key ${key} 余额查询异常:`, error);
            return 0; // 确保即使单个key查询出错，Promise.all也能继续
          }
        });

        // 4. 等待当前批次的所有余额查询完成
        const balancesFromBatch = await Promise.all(balancePromisesInBatch);
        allKeyBalances.push(...balancesFromBatch); // 将当前批次的余额添加到总列表中
      }

      totalBalance = allKeyBalances.reduce((acc, curr) => acc + curr, 0);

      const updatedProviders = providers.map((p) =>
        p.id === provider.id
          ? {
              ...p,
              balance: {
                amount: totalBalance,
                currency,
                lastUpdated: new Date().toISOString(),
              },
            }
          : p,
      );
      storeActions.setProviders(updatedProviders);

      showToast(`总余额: ${currency} ${totalBalance.toFixed(2)}`);
    } catch (error) {
      console.error("统计余额时发生错误:", error);
      showToast("统计余额失败，请稍后再试。");
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [id]: false }));
    }
  };

  const getBalanceText = (provider: userCustomProvider) => {
    if (!provider.balance) return null;
    return `${provider.balance.currency} ${provider.balance.amount.toFixed(2)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1>{Locale.CustomProvider.Title}</h1>
            <div className={styles.providerCount}>
              {Locale.CustomProvider.Count.replace(
                "{count}",
                providers.length.toString(),
              )}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <IconButton
            icon={<ExportIcon />}
            text="导出配置"
            bordered
            onClick={handleExportProviders}
            title="导出供应商配置到文件"
          />
          <IconButton
            icon={<ImportIcon />}
            text="导入配置"
            bordered
            onClick={handleImportProviders}
            title="从文件导入供应商配置"
          />
          <IconButton
            icon={<PlusIcon />}
            text={Locale.CustomProvider.AddButton}
            bordered
            onClick={handleAddProvider}
          />
          <IconButton
            icon={<CloseIcon />}
            bordered
            onClick={() => navigate(Path.Home)}
            title={Locale.CustomProvider.Return}
          />
        </div>
      </div>
      <div className={styles["provider-filter"]}>
        <input
          type="text"
          placeholder={Locale.CustomProvider.SearchPlaceholder}
          className={styles["search-bar"]}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className={styles["actions"]}>
          <IconButton
            icon={<TrashIcon />}
            text="移除禁用"
            bordered
            onClick={handleRemoveDisabledProviders}
            title="移除所有禁用的供应商"
          />

          <IconButton
            icon={<TrashIcon />}
            text="移除选中"
            bordered
            onClick={handleRemoveSearchedProviders}
            title="移除搜索结果中的所有供应商"
            disabled={!searchTerm.trim()}
          />
          <IconButton
            icon={<EnableIcon />} // 需要一个启用图标
            text="批量启用"
            bordered
            onClick={handleBatchEnableProviders}
            title="批量启用供应商"
          />
          <IconButton
            icon={<DisableIcon />} // 需要一个禁用图标
            text="批量禁用"
            bordered
            onClick={handleBatchDisableProviders}
            title="批量禁用供应商"
          />
          {searchTerm && (
            <IconButton
              icon={<CloseIcon />}
              onClick={() => setSearchTerm("")}
              bordered
            />
          )}
        </div>
      </div>
      <div className={`${styles.providerList} ${styles.fadeIn}`}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <div>{Locale.CustomProvider.Loading}</div>
          </div>
        ) : filteredProviders.length > 0 ? (
          filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className={styles.providerItem}
              title={getAvailableModelsTooltip(provider)}
            >
              <div className={styles.providerInfo}>
                <div>
                  <div className={styles.providerName}>{provider.name}</div>
                  <div className={styles.providerMeta}>
                    <span
                      className={styles.metaItem}
                      style={{ backgroundColor: "#DAF1F4", color: "#004D5B" }}
                    >
                      {providerTypeLabels[provider.type]}
                    </span>
                    <span
                      className={styles.metaItem}
                      style={{ backgroundColor: "#D9E8FE", color: "#003D8F" }}
                      onClick={() => {
                        const modelNames = (
                          provider.models
                            ?.filter((m) => m.available)
                            .map((m) => m.name) || []
                        ).join(", ");
                        if (modelNames) {
                          navigator.clipboard
                            .writeText(modelNames)
                            .then(() => showToast("模型列表已复制到剪贴板"))
                            .catch(() => showToast("复制失败"));
                        } else {
                          showToast("无可复制的模型");
                        }
                      }}
                    >
                      {getModelCountText(provider)}
                    </span>
                    <span
                      className={`${styles.metaItem} ${styles.keyCountItem}`}
                      style={{ backgroundColor: "#FFEDD5", color: "#C2410C" }}
                      onClick={() => {
                        const keys = provider.apiKey;
                        if (keys) {
                          navigator.clipboard
                            .writeText(keys)
                            .then(() => showToast("密钥已复制到剪贴板"))
                            .catch(() => showToast("复制失败"));
                        } else {
                          showToast("无可复制的密钥");
                        }
                      }}
                    >
                      {getKeyCountText(provider)}
                    </span>
                    {provider.status && (
                      <span
                        className={styles.metaItem}
                        style={{
                          backgroundColor:
                            provider.status === "active"
                              ? "#d1fae5"
                              : "#fee2e2",
                          color:
                            provider.status === "active"
                              ? "#059669"
                              : "#dc2626",
                        }}
                      >
                        {provider.status === "active"
                          ? Locale.CustomProvider.Status.Enabled
                          : Locale.CustomProvider.Status.Disabled}
                      </span>
                    )}
                    {provider.balance && (
                      <span
                        className={styles.metaItem}
                        style={{ backgroundColor: "#FEEBC8", color: "#92400E" }}
                      >
                        {getBalanceText(provider)}
                      </span>
                    )}
                    {provider.baseUrl && (
                      <span
                        className={styles.metaItem}
                        style={{ backgroundColor: "#F0E6FF", color: "#5B21B6" }}
                        onClick={() => {
                          navigator.clipboard
                            .writeText(provider.baseUrl)
                            .then(() => showToast("URL 已复制到剪贴板"))
                            .catch(() => showToast("复制失败"));
                        }}
                      >
                        {provider.baseUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.providerActions}>
                <div className={styles.statusToggleContainer}>
                  <div
                    className={`${styles.toggleSwitch} ${
                      provider.status === "active" ? styles.active : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus: "active" | "inactive" =
                        provider.status === "active" ? "inactive" : "active";
                      const updatedProviders = providers.map((p) =>
                        p.id === provider.id ? { ...p, status: newStatus } : p,
                      );
                      // setProviders(updatedProviders);
                      // saveProvidersToStorage(updatedProviders);
                      storeActions.setProviders(updatedProviders);
                      showToast(
                        newStatus === "active"
                          ? Locale.CustomProvider.ProviderEnabled
                          : Locale.CustomProvider.ProviderDisabled,
                      );
                    }}
                    title={
                      provider.status === "active"
                        ? Locale.CustomProvider.ToggleDisable
                        : Locale.CustomProvider.ToggleEnable
                    }
                  >
                    <div className={styles.toggleSlider}></div>
                  </div>
                </div>
                <IconButton
                  icon={
                    loadingBalances[provider.id] ? (
                      <LoadingIcon />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  text={
                    loadingBalances[provider.id]
                      ? "查询中..."
                      : provider.balance
                      ? "更新余额"
                      : "查询余额"
                  }
                  onClick={() => handleSumBalances(provider)}
                  title={
                    provider.balance ? "点击更新余额信息" : "查询所有密钥余额"
                  }
                  bordered
                  className={
                    providerBalances[provider.id] ? styles.balanceButton : ""
                  }
                  disabled={loadingBalances[provider.id]}
                />
                <IconButton
                  icon={<EditIcon />}
                  onClick={() => handleEditProvider(provider)}
                  title={Locale.CustomProvider.Edit}
                  bordered
                />
                <IconButton
                  icon={<TrashIcon />}
                  onClick={() => handleDeleteProvider(provider.id)}
                  title={Locale.CustomProvider.Delete}
                  bordered
                />
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>
              {searchTerm
                ? Locale.CustomProvider.NoProviders
                : Locale.CustomProvider.EmptyTitle}
            </div>
            <div className={styles.emptyDescription}>
              {searchTerm
                ? Locale.CustomProvider.EmptySearchDescription
                : Locale.CustomProvider.EmptyDescription}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProviderModal
          provider={currentProvider}
          onSave={(provider) => {
            const newProviderId = handleSaveProvider(provider);
            if (newProviderId) {
              // 导航到新添加的 Provider 的详情页
              navigate(`${Path.CustomProvider}/${newProviderId}`);
            }
          }}
          onClose={() => {
            setIsModalOpen(false);
            navigate(Path.CustomProvider);
          }}
          providers={providers}
        />
      )}
    </div>
  );
}
