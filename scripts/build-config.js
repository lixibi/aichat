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
  
  // 处理单个变量 HEBEOPENAI
  if (process.env.HEBEOPENAI) {
    content = content.replace(/【变量:HEBEOPENAI】/g, process.env.HEBEOPENAI);
    console.log('[Build Config] ✓ Replaced HEBEOPENAI');
  }
  
  // 处理逗号分开的变量 HEBEDEEP
  if (process.env.HEBEDEEP) {
    const keys = process.env.HEBEDEEP.split(',').map(key => key.trim());
    const keysArray = JSON.stringify(keys);
    content = content.replace(/【逗号分开变量:HEBEDEEP】/g, keysArray);
    console.log('[Build Config] ✓ Replaced HEBEDEEP with', keys.length, 'keys');
  }
  
  // 保存到public目录，这样运行时就能访问到
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, 'providers-config.json'), content);
  console.log('[Build Config] ✓ Generated public/providers-config.json');
  
} catch (error) {
  console.error('[Build Config] Error:', error);
  process.exit(1);
}