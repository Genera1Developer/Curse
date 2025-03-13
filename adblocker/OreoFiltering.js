(async () => {
  const easyListURL = "/adblocker/filters/easylist.txt";
  let filters = await fetch(easyListURL).then(t => t.text());
  let filterList = filters.split("\n").filter(line => line.trim() && line.trim()[0] !== "!");
  let rules = filterList.map(rule =>
    rule
      .replace(/([.?+^$[\]\\(){}|-])/g, "\\$1")
      .replace(/\*/g, ".*?")
      .replace(/^@@\|\|/, ".*://")
      .replace(/^\|\|/, "^https?://")
      .replace(/^@@/, "^https?://(?!")
      .replace(/^\|/, "^")
      .replace(/\|$/, "$")
  );
  const adBlockerRegex = new RegExp(rules.join("|"), "i");

  const blockedElements = new Set(["img", "script", "iframe", "object", "embed", "video", "audio", "source", "link", "style", "frame", "meta", "form", "input", "button", "svg", "canvas"]);
  const checkIfBlocked = url => adBlockerRegex.test(url);

  const cleanAdElement = (el) => {
    const url = new URL(el.src || el.href || "", location.href).href;
    if (checkIfBlocked(url)) {
      el.remove();
      el.src = "";
      el.srcset = "";
      el.href = "data:,";
    }
  };

  const blockAdRequests = (request) => {
    const url = request.url;
    if (checkIfBlocked(url)) {
      return new Response('', { status: 204 });
    }
    return fetch(request);
  };

  const detectNativeAds = (doc) => {
    const nativeAds = doc.querySelectorAll("[data-ad, .ads, .ad-container, .ad-slot, .sponsored]");
    nativeAds.forEach(ad => ad.remove());
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) cleanAdElement(node);
      });
    });
  });

  const blockPopups = () => {
    window.open = new Proxy(window.open, {
      apply(target, thisArg, argumentsList) {
        if (checkIfBlocked(argumentsList[0])) {
          return null;
        }
        return target.apply(thisArg, argumentsList);
      }
    });
  };

  const blockCrossOriginRequests = () => {
    fetch = new Proxy(fetch, {
      apply(target, thisArg, argumentsList) {
        if (checkIfBlocked(argumentsList[0])) {
          return Promise.reject({ type: "filtering", url: argumentsList[0] });
        }
        return target.apply(thisArg, argumentsList);
      }
    });
  };

  const blockIframeAds = () => {
    document.querySelectorAll("iframe").forEach(iframe => {
      const iframeSrc = iframe.src;
      if (checkIfBlocked(iframeSrc)) {
        iframe.remove();
      }
    });
  };

  const blockThirdPartyLibraries = () => {
    const scriptTags = document.querySelectorAll("script[src]");
    scriptTags.forEach(script => {
      const scriptSrc = script.src;
      if (checkIfBlocked(scriptSrc)) {
        script.remove();
      }
    });
  };

  const blockStorageAPIAds = () => {
    const storageMethods = [localStorage, sessionStorage, indexedDB];
    storageMethods.forEach(storage => {
      const originalSetItem = storage.setItem;
      storage.setItem = function (key, value) {
        if (key.includes("ad") || key.includes("banner") || key.includes("tracker")) {
          return; 
        }
        return originalSetItem.apply(storage, arguments);
      };
    });
  };

  const blockWebRTCLeaks = () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      get: function () {
        return {
          enumerateDevices: function () { return []; },
          getUserMedia: function () { return Promise.reject("WebRTC is disabled"); }
        };
      }
    });
  };

  const simulateUserBehavior = () => {
    document.body.addEventListener("scroll", () => {}, { passive: true });
    document.body.addEventListener("click", () => {}, { passive: true });
  };

  const interceptRequests = () => {
    self.addEventListener('fetch', event => {
      event.respondWith(blockAdRequests(event.request));
    });
  };

  const setupAdBlocking = () => {
    MutationObserver && observer.observe(document, { childList: true, subtree: true });
    blockPopups();
    blockCrossOriginRequests();
    blockIframeAds();
    blockThirdPartyLibraries();
    blockStorageAPIAds();
    blockWebRTCLeaks();
    simulateUserBehavior();
    interceptRequests();
  };

  const applyPrivacyBlocking = () => {

    const userAgentString = navigator.userAgent;
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      get: function () { return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"; }
    });

    Object.defineProperty(screen, "width", { get: () => 1920 });
    Object.defineProperty(screen, "height", { get: () => 1080 });
    Object.defineProperty(screen, "pixelDepth", { get: () => 24 });

    navigator.geolocation.getCurrentPosition = function () {};
    navigator.geolocation.watchPosition = function () {};

    document.querySelectorAll("img[src*='tracking'], img[src*='pixel']").forEach(el => el.remove());

    document.cookie = "adblock=true; Secure; SameSite=Strict; path=/";

    window.history.replaceState({}, document.title, location.origin + location.pathname);

    document.querySelectorAll("script:not([src])").forEach(el => el.remove());

    Object.defineProperty(navigator, 'plugins', {
      get: function () { return [] }
    });

    document.cookie = "ad_sync=false; path=/";

    document.querySelectorAll("[class*='social'], [id*='social'], [data-*='social']").forEach(el => el.remove());

    Object.defineProperty(window, "orientation", { get: () => 0 });

    const blockedAnalytics = ["google-analytics.com", "facebook.com", "analytics.twitter.com"];
    blockedAnalytics.forEach(domain => {
      document.querySelectorAll(`script[src*='${domain}']`).forEach(script => script.remove());
    });

    const originalWebSocket = WebSocket;
    WebSocket = function (url, protocols) {
      if (checkIfBlocked(url)) {
        return null;
      }
      return new originalWebSocket(url, protocols);
    };
  };

  window.addEventListener("load", () => {
    setupAdBlocking();
    applyPrivacyBlocking();
    setInterval(() => {
      document.querySelectorAll("iframe, script, img, video, object, embed, link, style, svg, canvas").forEach(el => cleanAdElement(el));
    }, 500);
    console.log("Privacy & Ad Blocking Activated!");
  });
})();
