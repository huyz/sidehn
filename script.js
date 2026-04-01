function addHNComments(id) {
  // Prevent duplicate injection
  if (document.querySelector("sidehn-host")) {
    return;
  }

  // State — kept in closure, not on window
  let shown = false;
  let hiddenManually = false;

  // Create a custom-element host and attach a closed shadow root.
  // Closed mode means the page cannot access shadowRoot at all.
  const host = document.createElement("sidehn-host");
  host.style.cssText = "all:initial; position:fixed; top:0; right:0; z-index:2147483647; width:0; height:0; pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject styles into the shadow — completely isolated from the page
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }

    #hn-iframe {
      position: fixed;
      top: 0;
      right: -30%;
      width: 30%;
      height: 100vh;
      border: none;
      z-index: 2147483647;
      transition: right 0.2s ease;
      pointer-events: auto;
    }
    #hn-iframe.visible {
      right: 0;
    }

    #hn-toggle {
      position: fixed;
      top: calc(50% - 1.5rem);
      right: 0;
      height: 3rem;
      width: 1.5rem;
      background: hsla(21, 84%, 55%, 1.00);
      font-size: 1.5rem;
      cursor: pointer;
      outline: none;
      border: none;
      color: black;
      border-radius: 0.5rem 0 0 0.5rem;
      z-index: 2147483647;
      transition: right 0.2s ease;
      pointer-events: auto;
      font-family: sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    #hn-toggle.visible {
      right: 30%;
    }

    @media (max-width: 1023px) {
      #hn-iframe { width: 85%; right: -85%; }
      #hn-iframe.visible { right: 0; }
      #hn-toggle.visible { right: 85%; }
    }
  `;
  shadow.appendChild(style);

  // Iframe
  const iframe = document.createElement("iframe");
  iframe.id = "hn-iframe";
  iframe.src = `https://news.ycombinator.com/item?id=${id}`;
  shadow.appendChild(iframe);

  // Toggle button
  const toggle = document.createElement("button");
  toggle.id = "hn-toggle";
  toggle.textContent = "\u25C2"; // left-pointing chevron (collapsed)
  shadow.appendChild(toggle);

  // Inject a <style> into the page to shrink body — the only page-side effect.
  // Using an ID so we can toggle it without touching the page's own styles.
  const pageStyle = document.createElement("style");
  pageStyle.id = "sidehn-page-style";
  pageStyle.textContent = `
    html.sidehn-active {
      margin-right: 30% !important;
      transition: margin-right 0.2s ease;
    }
    @media (max-width: 1023px) {
      html.sidehn-active {
        margin-right: 0 !important;
      }
    }
  `;
  document.head.appendChild(pageStyle);

  function show() {
    shown = true;
    iframe.classList.add("visible");
    toggle.classList.add("visible");
    toggle.textContent = "\u25B8"; // right-pointing chevron (expanded)
    document.documentElement.classList.add("sidehn-active");
  }

  function hide() {
    shown = false;
    iframe.classList.remove("visible");
    toggle.classList.remove("visible");
    toggle.textContent = "\u25C2";
    document.documentElement.classList.remove("sidehn-active");
  }

  toggle.addEventListener("click", () => {
    if (shown) {
      hiddenManually = true;
      hide();
    } else {
      hiddenManually = false;
      show();
    }
  });

  function autoToggle() {
    if (window.innerWidth < 1024) {
      hide();
    } else if (!hiddenManually) {
      show();
    }
  }

  // Append the shadow host to documentElement (not body) so SPA body
  // replacements don't remove it
  document.documentElement.appendChild(host);

  window.addEventListener("resize", autoToggle);
  autoToggle();
}

function addHashIDs() {
  var hnItems = document.querySelectorAll("tr.athing");
  if (hnItems.length === 0) {
    hnItems = document.querySelectorAll(".hn-item");
  }
  console.log(hnItems);

  hnItems.forEach((item) => {
    const link =
      item.querySelector("span.titleline > a") ||
      item.querySelector("a.hn-item-title");
    if (!link.href.includes("news.ycombinator.com")) {
      if (link.href.match(/([?&])hnid=\d+/)) {
        link.href = link.href.replace(/([?&])hnid=\d+/, `$1hnid=${item.id}`);
      } else if (link.href.includes("?")) {
        link.href += `&hnid=${item.id}`;
      } else {
        link.href += `?hnid=${item.id}`;
      }
    }
  });
}

async function setup() {
  const settings = await browser.storage.sync.get("disabledDomains");

  if (location.hostname !== "news.ycombinator.com") {
    if (
      settings.disabledDomains &&
      settings.disabledDomains[location.hostname]
    ) {
      return;
    }

    const hnidMatch = location.search.match(/[?&]hnid=(\d+)/);
    if (hnidMatch) {
      addHNComments(hnidMatch[1]);
    }
    return;
  }

  const observer = new MutationObserver(addHashIDs);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  addHashIDs();
}

setup();
