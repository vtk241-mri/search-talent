export default function HydrationCleanupScript() {
  const code = `
    (function() {
      try {
        var attributeName = "bis_skin_checked";

        function cleanup(root) {
          if (!root || root.nodeType !== 1) {
            return;
          }

          if (root.hasAttribute && root.hasAttribute(attributeName)) {
            root.removeAttribute(attributeName);
          }

          if (!root.querySelectorAll) {
            return;
          }

          var nodes = root.querySelectorAll("[" + attributeName + "]");
          for (var i = 0; i < nodes.length; i += 1) {
            nodes[i].removeAttribute(attributeName);
          }
        }

        cleanup(document.documentElement);

        var observer = new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i += 1) {
            var mutation = mutations[i];

            if (mutation.type === "attributes" && mutation.target) {
              cleanup(mutation.target);
            }

            if (mutation.type === "childList") {
              for (var j = 0; j < mutation.addedNodes.length; j += 1) {
                cleanup(mutation.addedNodes[j]);
              }
            }
          }
        });

        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [attributeName],
        });

        document.addEventListener("DOMContentLoaded", function() {
          cleanup(document.documentElement);
        });
      } catch (error) {}
    })();
  `;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
