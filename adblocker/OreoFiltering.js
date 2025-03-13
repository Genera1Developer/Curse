(async () => {
  const t = await fetch("/adblocker/filters/easylist.txt").then(res => res.text());
  const e = t.split("\n").filter(line => line.trim() && line[0] !== "!");
  const r = e.map(line => line
    .replace(/([.?+^$[\]\\(){}|-])/g, "\\$1")
    .replace(/\*/g, ".*?")
    .replace(/^@@\|\|/, ".*://")
    .replace(/^\|\|/, "^https?://")
    .replace(/^@@/, "^https?://(?!")
    .replace(/^\|/, "^")
    .replace(/\|$/, "$"));
  const n = new RegExp(r.join("|"), "i");
  const o = new Set(["img", "script", "iframe", "object", "embed", "video", "audio", "source", "link", "style"]);

  const a = url => n.test(url);
  const c = el => {
    const url = new URL(el.src || "", location.href).href;
    if (a(url)) {
      el.remove();
      el.src = el.srcset = el.href = "data:,";
    }
  };
  const l = event => {
    const url = new URL(event.detail.url || "", location.href).href;
    if (a(url)) event.preventDefault();
  };
  const i = () => {
    document.querySelectorAll(o.size ? Array.from(o).join(",") : "*").forEach(c);
  };
  const s = el => {
    if (el.src) {
      const url = new URL(el.src, location.href).href;
      if (a(url)) el.src = el.srcset = el.href = "data:,";
    }
  };
  const u = url => {
    if (typeof url === "string" && a(new URL(url, location.href).href)) {
      return "data:,";
    }
  };
  const f = req => a(req.url) ? Promise.reject({ type: "filtering", url: req.url }) : fetch(req.url, req);

  const p = () => {
    if (MutationObserver) {
      new MutationObserver(mutations => mutations.forEach(m => {
        m.addedNodes.forEach(node => node.nodeType === 1 && s(node));
      })).observe(document, { childList: true, subtree: true });
    }
    if (window.XMLHttpRequest) {
      window.XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
        apply: (target, thisArg, args) => a(args[1]) ? undefined : target.apply(thisArg, args),
      });
    }
    if (window.fetch) {
      window.fetch = new Proxy(fetch, {
        apply: (target, thisArg, args) => f(args[0]),
      });
    }
    if (EventTarget.prototype.addEventListener) {
      EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, {
        apply: (target, thisArg, args) => {
          if (["beforescriptexecute", "beforeload"].includes(args[0]) && a(args[1])) return;
          return target.apply(thisArg, args);
        },
      });
    }
    document.addEventListener("DOMContentLoaded", i);
    document.addEventListener("beforeload", l, true);
    document.addEventListener("beforescriptexecute", l, true);
    window.open = new Proxy(window.open, {
      apply: (target, thisArg, args) => a(args[0]) ? null : target.apply(thisArg, args),
    });
  };

  p();
})();
