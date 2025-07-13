import { getClientConfig } from "../config/client";
import { ApiPath, STORAGE_KEY, StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  AppState,
  getLocalAppState,
  GetStoreState,
  mergeAppState,
  setLocalAppState,
} from "../utils/sync";
import { downloadAs, readFromFile } from "../utils";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";
import { createSyncClient, ProviderType } from "../utils/cloud";
import { corsPath } from "../utils/cors";
import { isEqual } from "lodash-es";

export interface WebDavConfig {
  server: string;
  username: string;
  password: string;
}

const isApp = !!getClientConfig()?.isApp;
export type SyncStore = GetStoreState<typeof useSyncStore>;

const DEFAULT_SYNC_STATE = {
  provider: ProviderType.WebDAV,
  useProxy: true,
  proxyUrl: corsPath(ApiPath.Cors),

  webdav: {
    endpoint: "",
    username: "",
    password: "",
  },

  upstash: {
    endpoint: "",
    username: STORAGE_KEY,
    apiKey: "",
  },

  lastSyncTime: 0,
  lastProvider: "",
  syncState: "idle", // 同步状态: idle, fetching, merging, uploading, success, error
  syncStateSize: -1,
};

export const useSyncStore = createPersistStore(
  DEFAULT_SYNC_STATE,
  (set, get) => ({
    cloudSync() {
      const config = get()[get().provider];
      return Object.values(config).every((c) => c.toString().length > 0);
    },

    markSyncTime() {
      set({ lastSyncTime: Date.now(), lastProvider: get().provider });
    },

    export() {
      const state = getLocalAppState();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `Backup-${datePart}.json`;
      downloadAs(JSON.stringify(state), fileName);
    },

    async import() {
      const rawContent = await readFromFile();

      try {
        const remoteState = JSON.parse(rawContent) as AppState;
        const localState = getLocalAppState();
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
        // location.reload();
      } catch (e) {
        console.error("[Import]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },

    getClient() {
      const provider = get().provider;
      const client = createSyncClient(provider, get());
      return client;
    },

    async sync() {
      const localState = getLocalAppState();
      const provider = get().provider;
      const config = get()[provider];
      const client = this.getClient();

      // 第一阶段：从远程获取数据
      set({ syncState: "fetching" });
      try {
        const remoteState = await client.get(config.username);
        if (!remoteState || remoteState === "") {
          // 如果远程状态为空，直接上传本地状态
          set({ syncState: "uploading" });
          await client.set(config.username, JSON.stringify(localState));
          console.log(
            "[Sync] Remote state is empty, using local state instead.",
          );
          set({ syncState: "success" });
          // setTimeout(() => this.resetSyncState(), 10000);
          // return;
        } else {
          const parsedRemoteState = JSON.parse(remoteState) as AppState;
          // 合并数据
          set({ syncState: "merging" });
          mergeAppState(localState, parsedRemoteState);
          setLocalAppState(localState);

          // 检查合并后的本地状态是否与远程状态相同
          // 跳过对 mask-store 的语言字段判断
          if (
            parsedRemoteState["mask-store"] &&
            parsedRemoteState["mask-store"].language === undefined
          ) {
            parsedRemoteState["mask-store"].language = undefined;
          }
          const isSame = isEqual(localState, parsedRemoteState);
          if (isSame) {
            console.log(
              "[Sync] Local and remote states are identical, no upload needed.",
            );
            set({ syncState: "success" });
            this.markSyncTime();
            setTimeout(() => this.resetSyncState(), 10000);
            return;
          }
        }
      } catch (e) {
        console.log("[Sync] failed to get remote state", e);
        set({ syncState: "error" });
        throw e;
      }

      // 第二阶段：上传合并后的状态
      try {
        const localStateStr = JSON.stringify(localState);
        const localSize = new Blob([localStateStr]).size;
        set({ syncState: "uploading", syncStateSize: localSize });

        await client.set(config.username, localStateStr);
        set({ syncState: "success" }); // Set status to success
        this.markSyncTime();
      } catch (e) {
        console.log("[Sync] failed to set remote state", e);
        set({ syncState: "error" }); // Set status to error
        throw e;
      }
      setTimeout(() => this.resetSyncState(), 10000);
    },
    resetSyncState() {
      set({ syncState: "idle", syncStateSize: -1 });
    },

    async check() {
      const client = this.getClient();
      return await client.check();
    },
  }),
  {
    name: StoreKey.Sync,
    version: 1.2,

    migrate(persistedState, version) {
      const newState = persistedState as typeof DEFAULT_SYNC_STATE;

      if (version < 1.1) {
        newState.upstash.username = STORAGE_KEY;
      }

      if (version < 1.2) {
        if (
          (persistedState as typeof DEFAULT_SYNC_STATE).proxyUrl ===
          "/api/cors/"
        ) {
          newState.proxyUrl = "";
        }
      }

      return newState as any;
    },
  },
);
