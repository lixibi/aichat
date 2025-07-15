const { createHash, createCipheriv, randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

// 设置加密密钥（与utils/encryption.ts中相同的逻辑）
const ENCRYPTION_KEY = '7K9mN3xR8vQ2jF5wP1nC6eT4yU0iO9sA3dG8hL2bV7zM5qW6rE1tY4uI8oP3aSdF';

const getEncryptionKey = () => {
  return createHash('sha256').update(ENCRYPTION_KEY).digest();
};

function encryptProviderConfig(data) {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    const jsonString = JSON.stringify(data, null, 2);
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

// 主执行函数
async function main() {
  const inputFile = path.join(__dirname, '../public/Providers-2025_7_15 14_07_51.json');
  const outputFile = path.join(__dirname, '../public/default-providers-encrypted.dat');
  
  try {
    // 读取原始配置文件
    if (!fs.existsSync(inputFile)) {
      console.error('Input file not found:', inputFile);
      return;
    }
    
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const configData = JSON.parse(rawData);
    
    console.log(`Found ${configData.length} provider configurations`);
    
    // 加密数据
    const encryptedData = encryptProviderConfig(configData);
    
    // 写入加密文件
    fs.writeFileSync(outputFile, encryptedData);
    
    console.log('✅ Provider configuration encrypted successfully!');
    console.log('📁 Encrypted file:', outputFile);
    console.log('🔑 Environment variable needed: PROVIDER_CONFIG_ENCRYPTION_KEY');
    console.log('🔑 Key value:', ENCRYPTION_KEY);
    
    // 安全提示
    console.log('\\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Add the encryption key to your environment variables');
    console.log('2. The original file should be deleted or moved to .gitignore');
    console.log('3. Never commit the original unencrypted file to git');
    
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
  }
}

// 运行脚本
main();