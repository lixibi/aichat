import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

function isNonBrowserRequest(req: NextRequest) {
  const userAgent = req.headers.get("User-Agent") ?? "";

  // 定义常见浏览器的标识符
  const browserIdentifiers = [
    "Mozilla",
    "Chrome",
    "Safari",
    "Firefox",
    "Edge",
    "OPR",
  ];

  // 检查 User-Agent 是否包含任何浏览器标识符
  const isBrowser = browserIdentifiers.some((identifier) =>
    userAgent.includes(identifier),
  );

  return !isBrowser;
}

export function auth(req: NextRequest, modelProvider: ModelProvider) {
  const userIP = getIP(req);

  const has_no_ua = isNonBrowserRequest(req);
  if (has_no_ua) {
    console.log("[Non Browser Request] IP: ", userIP);
    return { error: true, msg: "Please use the browser to make the request." };
  }

  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  // console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  // console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", userIP);
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !apiKey) {
    return {
      error: true,
      msg: !accessCode
        ? "empty access code"
        : `get wrong access code [${accessCode}], don't try to crack the access code, your IP(${userIP}) has been record`,
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    const serverConfig = getServerSideConfig();

    // const systemApiKey =
    //   modelProvider === ModelProvider.GeminiPro
    //     ? serverConfig.googleApiKey
    //     : serverConfig.isAzure
    //     ? serverConfig.azureApiKey
    //     : serverConfig.apiKey;

    let systemApiKey: string | undefined;

    switch (modelProvider) {
      case ModelProvider.GeminiPro:
        systemApiKey = serverConfig.googleApiKey;
        break;
      case ModelProvider.Claude:
        systemApiKey = serverConfig.anthropicApiKey;
        break;
      case ModelProvider.GPT:
      default:
        if (serverConfig.isAzure) {
          systemApiKey = serverConfig.azureApiKey;
        } else {
          systemApiKey = serverConfig.apiKey;
        }
    }

    if (systemApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
