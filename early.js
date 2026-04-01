// Runs at document_start (before first paint) to prevent layout flash.
// Adds the class that triggers the margin-right rule from sidehn.css.
(function () {
  var match = location.search.match(/[?&]hnid=(\d+)/);
  if (match && window.innerWidth >= 1024) {
    document.documentElement.classList.add("sidehn-active");
  }
})();
