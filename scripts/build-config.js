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
  
  // 处理单个变量 HEBEOPENAI (在数组中)
  if (process.env.HEBEOPENAI) {
    // 替换数组中的占位符
    processedContent = processedContent.replace(/\["【变量:HEBEOPENAI】"\]/g, `["${process.env.HEBEOPENAI}"]`);
    // 也处理可能的字符串形式
    processedContent = processedContent.replace(/"【变量:HEBEOPENAI】"/g, `"${process.env.HEBEOPENAI}"`);
    console.log('[Build Config] ✓ Replaced HEBEOPENAI');
  } else {
    // 如果没有环境变量，使用占位符
    processedContent = processedContent.replace(/\["【变量:HEBEOPENAI】"\]/g, '["HEBEOPENAI"]');
    processedContent = processedContent.replace(/"【变量:HEBEOPENAI】"/g, '"HEBEOPENAI"');
    console.warn('[Build Config] ⚠ HEBEOPENAI environment variable not found, using placeholder');
  }
  
  // 处理逗号分开的变量 HEBEDEEP
  if (process.env.HEBEDEEP) {
    const keys = process.env.HEBEDEEP.split(',').map(key => key.trim());
    const keysArray = JSON.stringify(keys);
    // 替换数组中的占位符
    processedContent = processedContent.replace(/\["【逗号分开变量:HEBEDEEP】"\]/g, keysArray);
    // 也处理可能的字符串形式
    processedContent = processedContent.replace(/"【逗号分开变量:HEBEDEEP】"/g, `"${process.env.HEBEDEEP}"`);
    console.log('[Build Config] ✓ Replaced HEBEDEEP with', keys.length, 'keys');
  } else {
    // 如果没有环境变量，使用占位符
    processedContent = processedContent.replace(/\["【逗号分开变量:HEBEDEEP】"\]/g, '["HEBEDEEP"]');
    processedContent = processedContent.replace(/"【逗号分开变量:HEBEDEEP】"/g, '"HEBEDEEP"');
    console.warn('[Build Config] ⚠ HEBEDEEP environment variable not found, using placeholder');
  }
  
  // 保存到public目录，这样运行时就能访问到
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, 'providers-config.json'), processedContent);
  console.log('[Build Config] ✓ Generated public/providers-config.json');
  
  // 生成TypeScript模块
  const jsContent = `// Auto-generated configuration - DO NOT EDIT
export const PREBUILT_PROVIDERS = ${processedContent};
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