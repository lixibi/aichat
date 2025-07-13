import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 从环境变量获取加密密钥
const getEncryptionKey = (): Buffer => {
  const key = process.env.PROVIDER_CONFIG_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PROVIDER_CONFIG_ENCRYPTION_KEY environment variable is required');
  }
  // 使用SHA-256创建32字节密钥
  return createHash('sha256').update(key).digest();
};

/**
 * 加密JSON数据
 * @param data - 要加密的数据对象
 * @returns 加密后的base64字符串
 */
export function encryptProviderConfig(data: any): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16); // 16字节初始化向量
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    const jsonString = JSON.stringify(data);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // 组合IV + AuthTag + 加密数据
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt provider configuration');
  }
}

/**
 * 解密JSON数据
 * @param encryptedData - base64加密字符串
 * @returns 解密后的数据对象
 */
export function decryptProviderConfig(encryptedData: string): any {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // 提取IV (前16字节)
    const iv = combined.subarray(0, 16);
    
    // 提取AuthTag (17-32字节)
    const authTag = combined.subarray(16, 32);
    
    // 提取加密数据 (33字节之后)
    const encrypted = combined.subarray(32);
    
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt provider configuration');
  }
}

/**
 * 客户端安全解密（浏览器端）
 * 注意：这个函数在客户端运行，密钥通过服务端API获取
 */
export async function decryptProviderConfigClient(): Promise<any> {
  try {
    // 从服务端API获取解密后的配置
    const response = await fetch('/api/provider-config');
    if (!response.ok) {
      throw new Error('Failed to fetch provider configuration');
    }
    return await response.json();
  } catch (error) {
    console.error('Client decryption failed:', error);
    return null;
  }
}