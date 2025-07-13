import md5 from "spark-md5";
import { DEFAULT_MODELS } from "../constant";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROXY_URL?: string; // docker only

      OPENAI_API_KEY?: string;
      CODE?: string;

      BASE_URL?: string;
      OPENAI_ORG_ID?: string; // openai only

      VERCEL?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app

      HIDE_USER_API_KEY?: string; // disable user's api key input
      DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      ENABLE_BALANCE_QUERY?: string; // allow user to query balance or not
      DISABLE_FAST_LINK?: string; // disallow parse settings from url or not
      CUSTOM_MODELS?: string; // to control custom models
      DEFAULT_MODEL?: string; // to cnntrol default model in every new chat window
      VISION_MODELS?: string; // to control vision models

      // azure only
      AZURE_URL?: string; // https://{azure-url}/openai/deployments/{deploy-name}
      AZURE_API_KEY?: string;
      AZURE_API_VERSION?: string;

      // google only
      GOOGLE_API_KEY?: string;
      GOOGLE_URL?: string;

      // fast only
      FAST_API_KEY?: string;
      FAST_BASE_URL?: string;
      FAST_MODELS?: string;

      // google tag manager
      GTM_ID?: string;

      // custom template for preprocessing user input
      DEFAULT_INPUT_TEMPLATE?: string;

      // sidebar title
      SIDEBAR_TITLE?: string;
      SIDEBAR_SUBTITLE?: string;

      // website title
      SITE_TITLE?: string;
    }
  }
}

const ACCESS_CODES = (function getAccessCodes(): Set<string> {
  const code = process.env.CODE;

  try {
    const codes = (code?.split(",") ?? [])
      .filter((v) => !!v)
      .map((v) => md5.hash(v.trim()));
    return new Set(codes);
  } catch (e) {
    return new Set();
  }
})();

function getApiKey(keys?: string) {
  const apiKeyEnvVar = keys ?? "";
  const apiKeys = apiKeyEnvVar.split(",").map((v) => v.trim());
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  const apiKey = apiKeys[randomIndex];

  return apiKey;
}
export const getSidebarConfig = () => {
  return {
    title: process.env.SIDEBAR_TITLE || "NextChat",
    subTitle: process.env.SIDEBAR_SUBTITLE || "Build your own AI assistant.",
    siteTitle: process.env.SITE_TITLE || "NextChat",
  };
};
export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const disableGPT4 = !!process.env.DISABLE_GPT4;
  let customModels = process.env.CUSTOM_MODELS ?? "";
  let defaultModel = process.env.DEFAULT_MODEL ?? "";
  let visionModels = process.env.VISION_MODELS ?? "";

  if (disableGPT4) {
    if (customModels) customModels += ",";
    customModels += DEFAULT_MODELS.filter(
      (m) =>
        (m.name.includes("gpt-4") || m.name.includes("o1")) &&
        !m.name.startsWith("gpt-4o-mini"),
    )
      .map((m) => "-" + m.name)
      .join(",");
    if (
      (defaultModel.includes("gpt-4") || defaultModel.includes("o1")) &&
      !defaultModel.startsWith("gpt-4o-mini")
    )
      defaultModel = "";
  }

  const isAzure = !!process.env.AZURE_URL;
  const isGoogle = !!process.env.GOOGLE_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const fastApiKeyEnvVar = process.env.FAST_API_KEY ?? "";
  const fastApiKeys = fastApiKeyEnvVar.split(",").map((v) => v.trim());
  const fastBaseUrlEnvVar = process.env.FAST_BASE_URL ?? "";
  const fastBaseUrls = fastBaseUrlEnvVar.split(",").map((v) => v.trim());
  const envFastChannel = parseInt(process.env.FAST_CHANNEL || "0");
  const fastChannel =
    !isNaN(envFastChannel) && envFastChannel <= fastApiKeys.length
      ? envFastChannel
      : 0;
  const fastApiKey = fastApiKeys[fastChannel];
  const fastBaseUrl = fastBaseUrls[fastChannel];
  const fastModels = process.env.FAST_MODELS ?? "";
  // console.log(
  //   `[Server Config] using ${randomIndex + 1} of ${apiKeys.length} api key`,
  // );

  const allowedWebDevEndpoints = (
    process.env.WHITE_WEBDEV_ENDPOINTS ?? ""
  ).split(",");

  return {
    baseUrl: process.env.BASE_URL,
    apiKey: getApiKey(process.env.OPENAI_API_KEY),
    openaiOrgId: process.env.OPENAI_ORG_ID,

    isAzure,
    azureUrl: process.env.AZURE_URL,
    azureApiKey: getApiKey(process.env.AZURE_API_KEY),
    azureApiVersion: process.env.AZURE_API_VERSION,

    isGoogle,
    googleApiKey: getApiKey(process.env.GOOGLE_API_KEY),
    googleUrl: process.env.GOOGLE_URL,

    isAnthropic,
    anthropicApiKey: getApiKey(process.env.ANTHROPIC_API_KEY),
    anthropicApiVersion: process.env.ANTHROPIC_API_VERSION,
    anthropicUrl: process.env.ANTHROPIC_URL,

    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareKVNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
    cloudflareKVApiKey: getApiKey(process.env.CLOUDFLARE_KV_API_KEY),
    cloudflareKVTTL: process.env.CLOUDFLARE_KV_TTL,

    gtmId: process.env.GTM_ID,

    needCode: ACCESS_CODES.size > 0,
    code: process.env.CODE,
    codes: ACCESS_CODES,

    proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,

    hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    disableGPT4,
    hideBalanceQuery: !process.env.ENABLE_BALANCE_QUERY,
    disableFastLink: !!process.env.DISABLE_FAST_LINK,
    customModels,
    defaultModel,
    visionModels,
    allowedWebDevEndpoints,

    fastApiKey,
    fastBaseUrl,
    fastModels,
    fastChannel,

    customHello: process.env.CUSTOM_HELLO,
    UnauthorizedInfo: process.env.UNAUTHORIZED_INFO,
    compressModel: process.env.COMPRESS_MODEL,
    translateModel: process.env.TRANSLATE_MODEL,
    ocrModel: process.env.OCR_MODEL,

    iconPosition: process.env.ICON_POSITION || "down",
  };
};
