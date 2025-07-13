import { NextRequest, NextResponse } from "next/server";
import { decryptProviderConfig } from "../../utils/encryption";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 检查是否有加密密钥
    if (!process.env.PROVIDER_CONFIG_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Provider configuration not available" },
        { status: 404 }
      );
    }

    // 读取加密文件
    const encryptedFilePath = path.join(process.cwd(), 'public', 'default-providers-encrypted.dat');
    
    if (!fs.existsSync(encryptedFilePath)) {
      return NextResponse.json(
        { error: "Provider configuration not found" },
        { status: 404 }
      );
    }

    const encryptedData = fs.readFileSync(encryptedFilePath, 'utf8');
    
    // 解密配置
    const providerConfig = decryptProviderConfig(encryptedData);
    
    // 返回解密后的配置
    return NextResponse.json(providerConfig, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Failed to decrypt provider configuration:', error);
    return NextResponse.json(
      { error: "Failed to load provider configuration" },
      { status: 500 }
    );
  }
}