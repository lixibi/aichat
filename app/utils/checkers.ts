import { useAccessStore } from "../store/access";
import { useAppConfig } from "../store/config";
import { collectModels } from "./model";

export function identifyDefaultClaudeModel(modelName: string) {
  const accessStore = useAccessStore.getState();
  const configStore = useAppConfig.getState();

  const allModals = collectModels(
    configStore.models,
    [configStore.customModels, accessStore.customModels].join(","),
    accessStore,
  );

  const modelMeta = allModals.find((m) => m.name === modelName);

  return (
    modelName.startsWith("claude") &&
    modelMeta &&
    modelMeta.provider?.providerType === "anthropic"
  );
}
