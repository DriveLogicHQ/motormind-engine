(function () {
  // Simple embed script: injects an iframe into a placeholder div.
  // Usage:
  // <div id="motormind-widget" data-src="https://YOUR-DEPLOYED-URL.vercel.app/drivelogic"></div>
  // <script src="https://YOUR-DEPLOYED-URL.vercel.app/motormind-widget.js" defer></script>

  function init() {
    var host = document.getElementById("motormind-widget");
    if (!host) return;

    var src = host.getAttribute("data-src") || "/drivelogic";
    var height = host.getAttribute("data-height") || "850";

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.style.width = "100%";
    iframe.style.height = height + "px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "16px";

    host.innerHTML = "";
    host.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
