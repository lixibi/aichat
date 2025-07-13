import { StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store"; // Assuming this is your Zustand + persist wrapper
import { userCustomProvider } from "../client/api"; // Make sure this path is correct
import { safeLocalStorage } from "../utils";

// 1. Define the type for a single provider (already defined as userCustomProvider)
export type CustomProviderData = userCustomProvider;

// 2. Define the state structure for this store
export interface CustomProviderState {
  providers: CustomProviderData[];
  lastUpdateTime?: number;
  migrated?: boolean; // Add a flag to track migration status
}

// 3. Define the default/initial state
export const DEFAULT_CUSTOM_PROVIDER_STATE: CustomProviderState = {
  providers: [],
  lastUpdateTime: 0,
  migrated: false,
};

// Function to migrate data from localStorage to Zustand store
const migrateFromLocalStorage = (): Partial<CustomProviderState> => {
  try {
    // Check for data in old localStorage format
    const oldData = safeLocalStorage().getItem(StoreKey.CustomProvider);

    if (!oldData) {
      return { migrated: true }; // No old data to migrate
    }

    // Parse the old data
    const oldProviders = JSON.parse(oldData) as CustomProviderData[];

    if (!Array.isArray(oldProviders)) {
      console.warn("Invalid format in localStorage, skipping migration");
      return { migrated: true };
    }

    console.log(
      `Migrating ${oldProviders.length} providers from localStorage to Zustand store`,
    );

    // Return the migrated data
    return {
      providers: oldProviders,
      lastUpdateTime: Date.now(),
      migrated: true,
    };
  } catch (error) {
    console.error("Error migrating data from localStorage:", error);
    return { migrated: true }; // Mark as migrated even on error to avoid repeated attempts
  }
};

// 4. Create the store using createPersistStore
export const useCustomProviderStore = createPersistStore(
  { ...DEFAULT_CUSTOM_PROVIDER_STATE },
  (set, get) => ({
    // --- Getters ---
    getAll: () => get().providers,

    getById: (id: string) => get().providers.find((p) => p.id === id),

    getByName: (name: string) => get().providers.find((p) => p.name === name),

    // --- Actions ---
    setProviders: (newProviders: CustomProviderData[]) => {
      set(() => ({
        providers: newProviders,
        lastUpdateTime: Date.now(), // Update timestamp if using mergeWithUpdate
      }));
    },

    addProvider: (providerData: Omit<CustomProviderData, "id">) => {
      const newProvider: CustomProviderData = {
        ...providerData,
        id: `provider-${Date.now()}-${nanoid(7)}`, // Ensure ID logic matches component or is robust
      };
      set((state) => ({
        providers: [...state.providers, newProvider],
        lastUpdateTime: Date.now(),
      }));
      return newProvider;
    },

    updateProvider: (id: string, updates: Partial<CustomProviderData>) => {
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, ...updates, id } : p,
        ),
        lastUpdateTime: Date.now(),
      }));
    },

    removeProvider: (id: string) => {
      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
        lastUpdateTime: Date.now(),
      }));
    },

    // Add migration function that can be called from components if needed
    migrateDataIfNeeded: () => {
      const state = get();
      if (!state.migrated) {
        console.log("Migrating data from localStorage to Zustand store...");
        const migratedData = migrateFromLocalStorage();
        set((state) => ({
          ...state,
          ...migratedData,
        }));

        // Optionally clear the old data after successful migration
        // safeLocalStorage().removeItem(StoreKey.CustomProvider);
      }
    },
  }),
  {
    name: StoreKey.CustomProvider, // Use the same StoreKey as in your component
    version: 1.0, // Start with version 1 for your new store
    migrate: (persistedState, version) => {
      const state = persistedState as CustomProviderState; // Cast to your state type

      // If we need to run migration logic for different versions later

      // Check if we need to migrate from localStorage
      if (!state.migrated) {
        const migratedData = migrateFromLocalStorage();
        return { ...state, ...migratedData };
      }

      return state as any; // Zustand expects 'any' here for the migrated state
    },
    onRehydrateStorage: (state) => {
      return (rehydratedState, error) => {
        if (error) {
          console.error("Error rehydrating CustomProvider store:", error);
        } else if (rehydratedState && !rehydratedState.migrated) {
          // If we still need to migrate after rehydration, do it now
          const store = useCustomProviderStore.getState();
          store.migrateDataIfNeeded();
        }
      };
    },
  },
);

// Initialize migration when the store is first created
useCustomProviderStore.getState().migrateDataIfNeeded();

// Helper to get non-function fields, similar to sync.ts
// (Can also be imported from sync.ts if you export it from there)
// function getNonFunctionFields<T extends object>(obj: T) {
//   const ret: any = {};
//   Object.entries(obj).forEach(([k, v]) => {
//     if (typeof v !== "function") {
//       ret[k] = v;
//     }
//   });
//   return ret as Pick<T, { [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K }[keyof T]>;
// }

// Export a getter for the state's non-function fields, for sync.ts
// export const getCustomProviderStoreState = () => getNonFunctionFields(useCustomProviderStore.getState());
