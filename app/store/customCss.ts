// store/customCss.ts
import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";

export interface CustomCssConfig {
  enabled: boolean;
  content: string;
  lastUpdated: number;
}

export const DEFAULT_CUSTOM_CSS_CONFIG: CustomCssConfig = {
  enabled: false,
  content: "",
  lastUpdated: 0,
};

export const useCustomCssStore = createPersistStore(
  DEFAULT_CUSTOM_CSS_CONFIG,
  (set, get) => ({
    enable() {
      set((state) => ({ enabled: true }));
    },
    disable() {
      set((state) => ({ enabled: false }));
    },
    reset() {
      set(() => ({ ...DEFAULT_CUSTOM_CSS_CONFIG }));
    },
  }),
  {
    name: StoreKey.CustomCSS,
    version: 1,
  },
);
