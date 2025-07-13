import { DEFAULT_MODELS } from "../constant";
import { LLMModel } from "../client/api";

const customProvider = (providerName: string) => ({
  id: providerName.toLowerCase(),
  providerName: providerName,
  providerType: "custom",
});

export function collectModelTable(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable: Record<
    string,
    {
      available: boolean;
      name: string;
      displayName: string;
      description?: string;
      provider?: LLMModel["provider"]; // Marked as optional
      isDefault?: boolean;
    }
  > = {};

  // default models
  models.forEach((m) => {
    // using <modelName>@<providerType> as fullName
    modelTable[`${m.name}@${m?.provider?.providerType}`] = {
      ...m,
      displayName: m.name, // 'provider' is copied over if it exists
      description: "",
    };
  });

  // server custom models
  customModels
    .split(",")
    .filter((v) => !!v && v.length > 0)
    .forEach((m) => {
      const available = !m.startsWith("-");
      const nameConfig =
        m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
      // const [name, displayName] = nameConfig.split("=");
      let name, displayName, description;
      const regex = /([^=<>]+)(?:=([^<>]*)?)?(?:<([^>]*)>)?/;
      const match = nameConfig.match(regex);

      if (match) {
        [, name, displayName, description] = match;
      } else {
        name = nameConfig;
      }

      // enable or disable all models
      if (name === "all") {
        Object.values(modelTable).forEach(
          (model) => (model.available = available),
        );
      } else if (name.startsWith("*")) {
        const modelId = name.substring(1).toLowerCase();
        Object.values(modelTable).forEach((model) => {
          if (model?.provider?.id === modelId) {
            model.available = available;
          }
        });
      } else {
        // 1. find model by name, and set available value
        const [customModelName, customProviderName] = name.split(/@(?=[^@]*$)/);
        let count = 0;
        for (const fullName in modelTable) {
          const [modelName, providerName] = fullName.split(/@(?=[^@]*$)/);
          if (
            customModelName == modelName &&
            (customProviderName === undefined ||
              customProviderName === providerName)
          ) {
            count += 1;
            modelTable[fullName]["available"] = available;
            if (displayName) {
              modelTable[fullName]["displayName"] = displayName;
            }
            if (description) {
              modelTable[fullName]["description"] = description;
            }
          }
        }
        // 2. if model not exists, create new model with available value
        if (count === 0) {
          let [customModelName, customProviderName] = name.split(/@(?=[^@]*$)/);
          const provider = customProvider(
            customProviderName || customModelName,
          );
          modelTable[`${customModelName}@${provider?.providerType}`] = {
            name: customModelName,
            displayName: displayName || customModelName,
            description: description || "",
            available,
            provider, // Use optional chaining
          };
        }
      }
    });
  return modelTable;
}

export function collectModelTableWithDefaultModel(
  models: readonly LLMModel[],
  customModels: string,
  defaultModel: string,
) {
  let modelTable = collectModelTable(models, customModels);
  if (defaultModel && defaultModel !== "") {
    if (defaultModel.includes("@")) {
      if (defaultModel in modelTable) {
        modelTable[defaultModel].isDefault = true;
      }
    } else {
      for (const key of Object.keys(modelTable)) {
        if (
          modelTable[key].available &&
          key.split("@").shift() == defaultModel
        ) {
          modelTable[key].isDefault = true;
          break;
        }
      }
    }
  }
  return modelTable;
}

/**
 * Generate full model table.
 */
export function collectModels(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable = collectModelTable(models, customModels);
  const allModels = Object.values(modelTable);

  return allModels;
}

export function collectModelsWithDefaultModel(
  models: readonly LLMModel[],
  customModels: string,
  defaultModel: string,
) {
  const modelTable = collectModelTableWithDefaultModel(
    models,
    customModels,
    defaultModel,
  );
  const allModels = Object.values(modelTable);
  return allModels;
}

export function isModelAvailableInServer(
  customModels: string,
  modelName: string,
  providerNames: string | string[],
) {
  const modelTable = collectModelTable(DEFAULT_MODELS, customModels);
  const providerNamesArray = Array.isArray(providerNames)
    ? providerNames
    : [providerNames];
  for (const providerName of providerNamesArray) {
    const fullName = `${modelName}@${providerName.toLowerCase()}`;
    if (modelTable[fullName]?.available === true) {
      return true;
    }
  }
  return false;
}
