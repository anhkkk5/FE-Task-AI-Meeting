function isLocalNetworkHost(hostname: string) {
  if (["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    return true;
  }

  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,2})\./);
  return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
}

export function resolveRuntimeUrl(configuredUrl: string) {
  if (typeof window === "undefined") {
    return configuredUrl.replace(/\/$/, "");
  }

  try {
    const url = new URL(configuredUrl);
    const browserHostname = window.location.hostname;

    if (
      isLocalNetworkHost(url.hostname) &&
      isLocalNetworkHost(browserHostname)
    ) {
      url.hostname = browserHostname;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return configuredUrl.replace(/\/$/, "");
  }
}
