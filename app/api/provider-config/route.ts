import { NextRequest, NextResponse } from "next/server";
import { decryptProviderConfig } from "../../utils/encryption";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 检查是否有加密密钥
    if (!process.env.PROVIDER_CONFIG_ENCRYPTION_KEY) {
      console.log('[Provider Config] Encryption key not found in environment variables');
      return NextResponse.json(
        { error: "Provider configuration not available" },
        { status: 404 }
      );
    }

    // 读取加密文件
    const encryptedFilePath = path.join(process.cwd(), 'public', 'default-providers-encrypted.dat');
    
    if (!fs.existsSync(encryptedFilePath)) {
      console.log('[Provider Config] Encrypted file not found:', encryptedFilePath);
      return NextResponse.json(
        { error: "Provider configuration not found" },
        { status: 404 }
      );
    }

    const encryptedData = fs.readFileSync(encryptedFilePath, 'utf8');
    console.log('[Provider Config] Successfully read encrypted data, length:', encryptedData.length);
    
    // 解密配置
    const providerConfig = decryptProviderConfig(encryptedData);
    console.log('[Provider Config] Successfully decrypted config, providers count:', providerConfig?.length || 0);
    
    // 返回解密后的配置
    return NextResponse.json(providerConfig, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Provider Config] Failed to decrypt provider configuration:', error);
    return NextResponse.json(
      { 
        error: "Failed to load provider configuration",
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}