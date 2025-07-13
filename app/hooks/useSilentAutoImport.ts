import { useEffect } from 'react';
import { useCustomProviderStore } from '../store/provider';
import { decryptProviderConfigClient } from '../utils/encryption';

export function useSilentAutoImport() {
  const providerStore = useCustomProviderStore();

  useEffect(() => {
    // 只在首次使用且没有任何提供商时自动导入
    if (providerStore.isFirstTimeUser() && providerStore.providers.length === 0) {
      const performAutoImport = async () => {
        try {
          const configData = await decryptProviderConfigClient();
          
          if (configData && Array.isArray(configData) && configData.length > 0) {
            // 静默导入配置
            providerStore.importFromTemplate(configData);
            console.log(`[Auto Import] Successfully imported ${configData.length} providers silently`);
          }
        } catch (error) {
          // 静默失败，不显示任何错误信息
          console.log('[Auto Import] Silent import failed, will use manual configuration');
        }
      };

      // 延迟一点执行，确保应用完全加载
      setTimeout(performAutoImport, 1000);
    }
  }, [providerStore]);
}