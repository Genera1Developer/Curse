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
    const nativeAds = doc.querySelectorAll("[data-ad], .ads, .ad-container, .ad-slot, .sponsored");
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
      if (checkIfBlocked(iframe.src)) {
        iframe.remove();
      }
    });
  };

  const blockThirdPartyLibraries = () => {
    document.querySelectorAll("script[src]").forEach(script => {
      if (checkIfBlocked(script.src)) {
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

  const blockFingerprintingAPIs = () => {
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'languages', { get: () => ["en-US", "en"] });
    Object.defineProperty(navigator, 'platform', { get: () => "Win32" });
  };

  const blockNotificationPermissions = () => {
    Notification.requestPermission = function() { return Promise.resolve("denied"); };
  };

  const blockAudioFingerprinting = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      window.AudioContext = class extends AudioContext {
        constructor() { super(); this.close(); }
      };
    }
  };

  const blockCanvasFingerprinting = () => {
    HTMLCanvasElement.prototype.toDataURL = function () { return ""; };
    HTMLCanvasElement.prototype.getContext = function () { return null; };
  };

  const blockBatteryAPI = () => {
    navigator.getBattery = function() { return Promise.reject("Battery API disabled"); };
  };

  const blockWebSockets = () => {
    window.WebSocket = class {
      constructor() { throw new Error("WebSockets disabled"); }
    };
  };

  const blockSessionReplayScripts = () => {
    document.querySelectorAll("script[src*='session-replay'], script[src*='heatmap']").forEach(script => script.remove());
  };

  const blockFontFingerprinting = () => {
    Object.defineProperty(document, 'fonts', { get: () => new Set() });
  };

  const blockMouseTracking = () => {
    document.addEventListener("mousemove", (event) => { event.stopPropagation(); }, true);
  };

  const blockKeyboardTracking = () => {
    document.addEventListener("keydown", (event) => { event.stopPropagation(); }, true);
  };

  const blockScreenSizeDetection = () => {
    Object.defineProperty(screen, "width", { get: () => 1920 });
    Object.defineProperty(screen, "height", { get: () => 1080 });
  };

  const blockGeolocationRequests = () => {
    navigator.geolocation.getCurrentPosition = function () {};
    navigator.geolocation.watchPosition = function () {};
  };

  const blockAnalyticsTrackers = () => {
    const blockedAnalytics = ["google-analytics.com", "facebook.com", "analytics.twitter.com"];
    blockedAnalytics.forEach(domain => {
      document.querySelectorAll(`script[src*='${domain}']`).forEach(script => script.remove());
    });
  };

  const disableHistoryTracking = () => {
    window.history.replaceState({}, document.title, location.origin + location.pathname);
  };

  const disableAutoPlayVideos = () => {
    document.querySelectorAll("video").forEach(video => video.autoplay = false);
  };

  const disableHyperlinkAuditing = () => {
    document.querySelectorAll("a[ping]").forEach(link => link.removeAttribute("ping"));
  };

  const preventClipboardTracking = () => {
    document.addEventListener("copy", (event) => event.clipboardData.setData("text/plain", ""), true);
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
    blockFingerprintingAPIs();
    blockNotificationPermissions();
    blockAudioFingerprinting();
    blockCanvasFingerprinting();
    blockBatteryAPI();
    blockWebSockets();
    blockSessionReplayScripts();
    blockFontFingerprinting();
    blockMouseTracking();
    blockKeyboardTracking();
    blockScreenSizeDetection();
    blockGeolocationRequests();
    blockAnalyticsTrackers();
    disableHistoryTracking();
    disableAutoPlayVideos();
    disableHyperlinkAuditing();
    preventClipboardTracking();
  };

  window.addEventListener("load", setupAdBlocking);
})();
