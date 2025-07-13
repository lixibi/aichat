import { useMemo, useState } from "react";
import { useAccessStore, useAppConfig, useCustomProviderStore } from "../store";
import { collectModelsWithDefaultModel } from "./model";
import { Model, userCustomProvider } from "../client/api";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    return collectModelsWithDefaultModel(
      configStore.models,
      [
        configStore.customModels,
        accessStore.customModels,
        // accessStore.defaultModel,
        // accessStore.compressModel,
        // accessStore.translateModel,
        // accessStore.textProcessModel,
        // accessStore.ocrModel,
      ].join(","),
      accessStore,
    );
  }, [
    accessStore.customModels,
    // accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
    accessStore,
  ]);
  return models;
}

// New hook that combines built-in models with custom provider models
export function useAllModelsWithCustomProviders() {
  const builtInModels = useAllModels();
  const customProviderStore = useCustomProviderStore();
  const [customProviderModels, setCustomProviderModels] = useState<Model[]>(
    () => {
      try {
        const providers = customProviderStore.providers;
        const activeProviders = providers.filter((p) => p.status === "active");
        return activeProviders.flatMap((provider) => {
          return (provider.models || [])
            .filter((model) => model.available)
            .map((model) => ({
              name: model.name,
              available: true,
              displayName: `${model.displayName || model.name} | ${
                provider.name
              }`,
              provider: {
                id: provider.id,
                providerName: provider.name,
                providerType: "custom-provider",
              },
              isCustom: true as const,
              enableVision: model?.enableVision,
              description: model?.description,
            }));
        });
      } catch (e) {
        console.error("Failed to parse custom providers:", e);
        return [];
      }
    },
  );
  // }, []);
  // Combine built-in models with custom provider models
  return useMemo(() => {
    return [...customProviderModels, ...builtInModels];
  }, [builtInModels, customProviderModels]);
}
