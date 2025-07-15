import { useEffect, useRef } from 'react';
import { useCustomProviderStore } from '../store/provider';
import { decryptProviderConfigClient } from '../utils/encryption';

export function useSilentAutoImport() {
  const providerStore = useCustomProviderStore();
  const hasImported = useRef(false); // 防止重复导入

  useEffect(() => {
    // 只在需要自动导入且没有导入过时执行
    if (providerStore.needsAutoImport() && !hasImported.current) {
      
      hasImported.current = true; // 标记为已尝试导入
      
      const performAutoImport = async () => {
        try {
          const configData = await decryptProviderConfigClient();
          
          if (configData && Array.isArray(configData) && configData.length > 0) {
            // 静默导入配置
            providerStore.importFromTemplate(configData);
            console.log(`[Auto Import] Successfully imported ${configData.length} providers silently`);
          } else {
            console.log('[Auto Import] No encrypted config available');
            // 即使没有配置也要标记为已尝试导入，避免重复请求
            providerStore.markNotFirstTime();
          }
        } catch (error) {
          // 静默失败，不显示任何错误信息
          console.log('[Auto Import] Silent import failed, will use manual configuration');
          // 标记为已尝试导入，避免重复请求
          providerStore.markNotFirstTime();
        }
      };

      // 延迟一点执行，确保应用完全加载
      setTimeout(performAutoImport, 1000);
    }
  }, [providerStore]);
}