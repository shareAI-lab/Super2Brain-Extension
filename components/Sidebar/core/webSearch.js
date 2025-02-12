export const extractUrls = (html) => {
  const excludePatterns = [
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})(\/ad|\/ads|\/advertisement)/,
    /sponsored/i,
    /广告/,
    /推广/,
    /chrome-extension:\/\//,
    /chrome\.google\.com\/webstore/,
    /addons\.mozilla\.org/,
    /microsoftedge\.microsoft\.com\/addons/,
    /zhihu\.com/,
    /xiaohongshu\.com/,
    /xhs\.com/,
    /doubleclick\.net/,
    /googleadservices\.com/,
    /adnxs\.com/,
    /adsystem\.com/,
    /msn\.com\/spartan\/ntp/,
    /microsoft\.com\/edge\/newtab/,
    /edgeplugin/i,
    /edge-extension/i,
    /microsoftstart\.com/,
    /msn\.cn/,
  ];

  const isExcluded = (url, title, description) =>
    excludePatterns.some(
      (pattern) =>
        pattern.test(url) || pattern.test(title) || pattern.test(description)
    );

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll("li.b_algo"))
    .map((result) => ({
      url: result.querySelector("h2 a")?.href || "",
      title: result.querySelector("h2 a")?.textContent?.trim() || "无标题",
      description:
        result.querySelector(".b_caption p")?.textContent?.trim() || "",
    }))
    .filter(
      ({ url, title, description }) =>
        url &&
        url !== "javascript:void(0)" &&
        !url.startsWith("chrome-extension://") &&
        !isExcluded(url, title, description)
    )
    .slice(0, 3);
};
