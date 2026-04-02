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
  host.style.cssText = "position:fixed; top:0; right:0; z-index:2147483647; width:0; height:0; pointer-events:none; display:block;";
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject styles into the shadow — completely isolated from the page
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }

    #hn-iframe {
      position: fixed;
      top: 0;
      right: 0;
      width: 30%;
      height: 100vh;
      border: none;
      border-left: 1px solid rgba(0, 0, 0, 0.12);
      z-index: 2147483647;
      pointer-events: auto;
    }
    #hn-iframe.hidden {
      right: -30%;
    }

    #hn-toggle {
      position: fixed;
      top: calc(50% - 1.5rem);
      right: 30%;
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
      pointer-events: auto;
      font-family: sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    #hn-toggle.hidden {
      right: 0;
    }

    .transitions #hn-iframe,
    .transitions #hn-toggle {
      transition: right 0.2s ease;
    }

    @media (max-width: 1023px) {
      #hn-iframe { width: 85%; }
      #hn-iframe.hidden { right: -85%; }
      #hn-toggle:not(.hidden) { right: 85%; }
      #hn-toggle.hidden { right: 0; }
    }
  `;
  shadow.appendChild(style);

  // Iframe
  const iframe = document.createElement("iframe");
  iframe.id = "hn-iframe";
  iframe.src = `https://news.ycombinator.com/item?id=${id}`;
  shadow.appendChild(iframe);

  // Wrapper div inside shadow for toggling transitions
  const wrapper = document.createElement("div");
  wrapper.appendChild(iframe);

  // Toggle button — starts in visible/expanded state
  const toggle = document.createElement("button");
  toggle.id = "hn-toggle";
  toggle.textContent = "\u25B8"; // right-pointing chevron (expanded)
  wrapper.appendChild(toggle);
  shadow.appendChild(wrapper);

  // Start shown on desktop
  shown = window.innerWidth >= 1024;
  if (!shown) {
    iframe.classList.add("hidden");
    toggle.classList.add("hidden");
    toggle.textContent = "\u25C2";
  } else {
    document.documentElement.classList.add("sidehn-active");
  }

  function enableTransitions() {
    wrapper.classList.add("transitions");
    document.documentElement.classList.add("sidehn-animated");
  }

  function show() {
    shown = true;
    iframe.classList.remove("hidden");
    toggle.classList.remove("hidden");
    toggle.textContent = "\u25B8";
    document.documentElement.classList.add("sidehn-active");
  }

  function hide() {
    shown = false;
    iframe.classList.add("hidden");
    toggle.classList.add("hidden");
    toggle.textContent = "\u25C2";
    document.documentElement.classList.remove("sidehn-active");
  }

  toggle.addEventListener("click", () => {
    enableTransitions(); // transitions kick in from first interaction
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

  window.addEventListener("resize", () => {
    enableTransitions();
    autoToggle();
  });
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
    if (!link) return;
    if (!link.href.includes("news.ycombinator.com")) {
      const url = new URL(link.href);
      url.searchParams.set("hnid", item.id);
      link.href = url.toString();
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

    const hnid = document.documentElement.dataset.sidehnId;
    if (hnid) {
      addHNComments(hnid);
    }
    return;
  }

  // Match the page background to #hnmain's bgcolor so the full
  // sidebar area is filled, even when the page content is short.
  const hnmain = document.getElementById("hnmain");
  if (hnmain) {
    document.documentElement.style.backgroundColor =
      hnmain.getAttribute("bgcolor") || "#f6f6ef";
  }

  const observer = new MutationObserver(addHashIDs);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  addHashIDs();
}

setup();
