#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('[Build Config] Processing Providers.json...');

const providersPath = path.join(process.cwd(), 'Providers.json');

if (!fs.existsSync(providersPath)) {
  console.log('[Build Config] Providers.json not found, skipping...');
  process.exit(0);
}

try {
  let content = fs.readFileSync(providersPath, 'utf8');
  let processedContent = content;
  
  // 处理单个变量 HEBEOPENAI
  if (process.env.HEBEOPENAI) {
    processedContent = processedContent.replace(/【变量:HEBEOPENAI】/g, process.env.HEBEOPENAI);
    console.log('[Build Config] ✓ Replaced HEBEOPENAI');
  } else {
    // 如果没有环境变量，保持原样但记录警告
    console.warn('[Build Config] ⚠ HEBEOPENAI environment variable not found');
  }
  
  // 处理逗号分开的变量 HEBEDEEP
  if (process.env.HEBEDEEP) {
    const keys = process.env.HEBEDEEP.split(',').map(key => key.trim());
    const keysArray = JSON.stringify(keys);
    processedContent = processedContent.replace(/【逗号分开变量:HEBEDEEP】/g, keysArray);
    console.log('[Build Config] ✓ Replaced HEBEDEEP with', keys.length, 'keys');
  } else {
    console.warn('[Build Config] ⚠ HEBEDEEP environment variable not found');
  }
  
  // 保存到public目录，这样运行时就能访问到
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, 'providers-config.json'), processedContent);
  console.log('[Build Config] ✓ Generated public/providers-config.json');
  
  // 生成TypeScript模块，将环境变量替换为实际值
  let tsContent = processedContent;
  
  // 对于TypeScript文件，如果没有环境变量，则使用变量名作为占位符
  if (!process.env.HEBEOPENAI) {
    tsContent = tsContent.replace(/【变量:HEBEOPENAI】/g, 'HEBEOPENAI');
  }
  if (!process.env.HEBEDEEP) {
    tsContent = tsContent.replace(/【逗号分开变量:HEBEDEEP】/g, '"HEBEDEEP"');
  }
  
  const jsContent = `// Auto-generated configuration - DO NOT EDIT
export const PREBUILT_PROVIDERS = ${tsContent};
`;
  
  const srcDir = path.join(process.cwd(), 'app', 'config');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(srcDir, 'prebuilt-providers.ts'), jsContent);
  console.log('[Build Config] ✓ Generated app/config/prebuilt-providers.ts');
  
} catch (error) {
  console.error('[Build Config] Error:', error);
  process.exit(1);
}