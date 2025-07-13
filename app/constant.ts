import path from "path";

export const OWNER = "QAbot-zh";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const DEFAULT_API_HOST = "https://api.nextchat.dev";
export const OPENAI_BASE_URL = "https://api.openai.com";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export const CACHE_URL_PREFIX = "/api/cache";
export const UPLOAD_URL = `${CACHE_URL_PREFIX}/upload`;

export const THEME_REPO_URL = "https://nextchat-theme.pages.dev/";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Auth = "/auth",
  SearchChat = "/search-chat",
  CloudBackup = "/cloud-backup",
  Artifacts = "/artifacts",
  CustomProvider = "/custom-provider",
}

export enum ApiPath {
  Cors = "",
  OpenAI = "/api/openai",
  Anthropic = "/api/anthropic",
  Google = "/api/google",
  Artifacts = "/api/artifacts",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
  CustomProvider = "custom-providers-store",
  TaskModelConfig = "task-model-config",
  ExpansionRules = "expansion-rules",
  CustomCSS = "custom-css",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "ai-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "chatgpt-next-web";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ThinkingType {
  Unknown = -1, // 未知状态
  ReasoningType = 0, // 推理内容
  ThinkType = 1, // <think> 类型
  ReferenceType = 2, // > 引用类型
  MaybeNotThink = 3, // 非思考模式或丢失<think>模式
}
export const ThinkingTypeMap = Object.entries(ThinkingType).reduce(
  (acc, [key, value]) => {
    if (!isNaN(Number(value))) {
      acc[value as number] = key;
    }
    return acc;
  },
  {} as Record<number, string>,
);

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
  Google = "Google",
  Anthropic = "Anthropic",
}

export enum ModelProvider {
  GPT = "GPT",
  GeminiPro = "GeminiPro",
  Claude = "Claude",
}

export const Anthropic = {
  ChatPath: "v1/messages",
  ChatPath1: "v1/complete",
  ExampleEndpoint: "https://api.anthropic.com",
  Vision: "2023-06-01",
};

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  SpeechPath: "v1/audio/speech",
  ImagePath: "v1/images/generations",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
};

export const Azure = {
  ExampleEndpoint: "https://{resource-url}/openai/deployments/{deploy-id}",
};

export const Google = {
  ExampleEndpoint: "https://generativelanguage.googleapis.com/",
  ChatPath: (modelName: string) => `v1beta/models/${modelName}:generateContent`,
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
// export const DEFAULT_SYSTEM_TEMPLATE = `
// You are ChatGPT, a large language model trained by {{ServiceProvider}}.
// Knowledge cutoff: {{cutoff}}
// Current model: {{model}}
// Current time: {{time}}
// Latex inline: $x^2$
// Latex block: $$e=mc^2$$
// `;
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by {{ServiceProvider}}.
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$
`;

export const SUMMARIZE_MODEL = "gpt-4o-mini";
export const GEMINI_SUMMARIZE_MODEL = "gemini-pro";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4-turbo": "2023-12",
  "gpt-4-turbo-2024-04-09": "2023-12",
  "gpt-4-turbo-preview": "2023-12",
  "gpt-4o": "2023-10",
  "gpt-4o-2024-05-13": "2023-10",
  "gpt-4o-2024-08-06": "2023-10",
  "gpt-4o-2024-11-20": "2023-10",
  "gpt-4-vision-preview": "2023-04",
  "gpt-4o-mini": "2023-10",
  "gpt-4o-mini-2024-07-18": "2023-10",
  "o1-mini": "2023-10",
  "o1-preview": "2023-10",
  // After improvements,
  // it's now easier to add "KnowledgeCutOffDate" instead of stupid hardcoding it, as was done previously.
};

export const DEFAULT_TTS_ENGINE = "OpenAI-TTS";
export const DEFAULT_TTS_ENGINES = ["OpenAI-TTS", "Edge-TTS"];
export const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
export const DEFAULT_TTS_VOICE = "alloy";
export const DEFAULT_TTS_MODELS = ["gpt-4o-mini-tts", "tts-1", "tts-1-hd"];
export const DEFAULT_TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
];

export const VISION_MODEL_REGEXES = [
  /vision/,
  /gpt-4o/,
  /gpt-4.1/,
  /claude-3/,
  /gemini-1\.5/,
  /gemini-exp/,
  /gemini-2/,
  /learnlm/,
  /qwen-vl/,
  /qwen2-vl/,
  /gpt-4-turbo(?!.*preview)/, // Matches "gpt-4-turbo" but not "gpt-4-turbo-preview"
  /gpt-4.5/,
  /^dall-e-3$/, // Matches exactly "dall-e-3"
  /glm-4v/,
  /vl/i,
  /pixtral/,
  /kimi-latest/,
  /multimodal/,
  /llama-4/,
];

export const EXCLUDE_VISION_MODEL_REGEXES = [/claude-3-5-haiku-20241022/];

const openaiModels = [
  "chatgpt-4o-latest",
  "gpt-4o",
  "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-11-20",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4-1106-preview",
  "gpt-4-0125-preview",
  "gpt-4",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0613",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-turbo-preview",
  "gpt-4-vision-preview",
  "gpt-4.5-preview",
  "o1-mini",
  "o1-preview",
  "o3-mini",
  "o1-pro",
];

const googleModels = [
  "gemini-1.5-flash-8b-exp-0924",
  "gemini-1.5-flash-8b-exp-0827",
  "gemini-1.5-flash-exp-0827",
  "gemini-1.5-flash-002",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-thinking-exp",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-002",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro-exp-0801",
  "gemini-1.5-pro-exp-0827",
  "gemini-exp-1114",
  "gemini-exp-1121",
  "gemini-exp-1206",
];

const anthropicModels = [
  "claude-3-haiku-20240307",
  "claude-3-5-haiku-20241022",
  "claude-3-5-haiku-latest",
  "claude-3-sonnet-20240229",
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20240620",
  "claude-3-5-sonnet-20241022",
  "claude-3-opus-20240229",
  "claude-3-opus-latest",
];

export const DEFAULT_MODELS = [
  ...openaiModels.map((name) => ({
    name,
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  })),
  ...googleModels.map((name) => ({
    name,
    available: true,
    provider: {
      id: "google",
      providerName: "Google",
      providerType: "google",
    },
  })),
  ...anthropicModels.map((name) => ({
    name,
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  })),
] as const;

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;

// some famous webdav endpoints
export const internalAllowedWebDavEndpoints = [
  "https://dav.jianguoyun.com/dav/",
  "https://dav.dropdav.com/",
  "https://dav.box.com/dav",
  "https://nanao.teracloud.jp/dav/",
  "https://webdav.4shared.com/",
  "https://dav.idrivesync.com",
  "https://webdav.yandex.com",
  "https://app.koofr.net/dav/Koofr",
  "https://domi.teracloud.jp/dav",
];

export const PLUGINS = [{ name: "Search Chat", path: Path.SearchChat }];

export const textFileExtensions = [
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
  "tsv",
  "xml",
  "html",
  "htm",
  "css",
  "js",
  "ts",
  "jsx",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "cs",
  "php",
  "rb",
  "go",
  "rs",
  "swift",
  "kt",
  "sql",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "log",
  "sh",
  "bat",
  "ps1",
  "tex",
  "rtf",
  "scss",
  "sass",
  "less",
  "vue",
  "svelte",
  "graphql",
  "gql",
  "r",
  "pl",
  "pm",
  "lua",
  "groovy",
  "scala",
  "dart",
  "haskell",
  "hs",
  "clj",
  "erl",
  "ex",
  "exs",
  "jsp",
  "asp",
  "aspx",
  "pug",
  "jade",
  "ejs",
  "diff",
  "patch",
  "properties",
  "env",
  "plist",
  "proto",
  "gradle",
  "rake",
  "htaccess",
  "htpasswd",
  "dockerfile",
  "dockerignore",
  "gitignore",
  "gitattributes",
  "eslintrc",
  "prettierrc",
  "babelrc",
  "stylelintrc",
  "cmake",
  "makefile",
  "vbs",
  "vbe",
  "rst",
  "adoc",
  "srt",
  "vtt",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "pdf",
  "xlsx",
  "xls",
  "zip",
];

export const MAX_DOC_CNT = 6; // 一次性支持上传的文件数量
export const maxFileSizeInKB = 1024 * 5; // 1 MB
export const minTokensForPastingAsFile = 4096; // 超过4k个token的文本粘贴为附件文件
