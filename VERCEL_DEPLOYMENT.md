# 李希宁AI - Vercel部署指南

## 🚀 快速部署到Vercel

### 1. 环境变量配置

在Vercel Dashboard中配置以下环境变量：

#### 必需的环境变量
```bash
PROVIDER_CONFIG_ENCRYPTION_KEY=7K9mN3xR8vQ2jF5wP1nC6eT4yU0iO9sA3dG8hL2bV7zM5qW6rE1tY4uI8oP3aSdF
```

#### 配置步骤
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加环境变量：
   - **Name**: `PROVIDER_CONFIG_ENCRYPTION_KEY`
   - **Value**: `7K9mN3xR8vQ2jF5wP1nC6eT4yU0iO9sA3dG8hL2bV7zM5qW6rE1tY4uI8oP3aSdF`
   - **Environment**: 选择 `Production`, `Preview`, `Development`

### 2. 自动部署配置

项目已配置自动部署，推送到main分支将自动触发部署。

### 3. 功能验证

部署完成后，首次访问应该显示：
- ✨ 欢迎引导页面
- 🚀 一键导入配置按钮
- 自动加载预配置的AI提供商

### 4. 故障排除

#### ChunkLoadError问题
- 已实现自动错误恢复机制
- iOS设备兼容性优化
- 自动缓存清理和重新加载

#### 环境变量未生效
1. 检查Vercel Dashboard中的环境变量设置
2. 确保已为所有环境（Production/Preview/Development）设置
3. 重新部署项目以应用环境变量

#### 加密配置无法加载
- 检查控制台错误信息
- 验证环境变量拼写是否正确
- 确认加密文件存在于public目录

## 🔒 安全说明

- API密钥已加密存储，不会暴露在客户端
- 仅在服务端解密，通过安全API提供给客户端
- 环境变量仅在Vercel服务端可见
- 所有敏感文件已添加到.gitignore

## 📱 PWA功能

- 支持离线使用
- 自定义应用图标和名称
- iOS和Android原生应用体验
- Service Worker自动更新机制