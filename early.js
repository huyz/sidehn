// Runs at document_start (before first paint) to prevent layout flash
// and capture the hnid before the page can strip it from the URL.
(function () {
  var match = location.search.match(/[?&]hnid=(\d+)/);
  if (match) {
    document.documentElement.dataset.sidehnId = match[1];
    if (window.innerWidth >= 1024) {
      document.documentElement.classList.add("sidehn-active");
    }
  }
})();
