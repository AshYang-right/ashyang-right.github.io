/**
 * 目录高亮 - 滚动时自动标记当前阅读位置
 */
(function () {
    var tocLinks = document.querySelectorAll(".toc-list a");
    if (!tocLinks.length) return;

    var headings = [];
    tocLinks.forEach(function (link) {
        var id = link.getAttribute("href").replace("#", "");
        var el = document.getElementById(id);
        if (el) headings.push({ el: el, link: link });
    });

    function updateActive() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var current = null;

        for (var i = 0; i < headings.length; i++) {
            var rect = headings[i].el.getBoundingClientRect();
            if (rect.top <= 80) {
                current = headings[i];
            }
        }

        tocLinks.forEach(function (link) {
            link.classList.remove("active");
        });

        if (current) {
            current.link.classList.add("active");
        } else if (headings.length > 0) {
            headings[0].link.classList.add("active");
        }
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
})();

/**
 * 文章正文内的链接 - 非锚点链接在新标签页打开
 */
(function () {
    var links = document.querySelectorAll(".article-body a");
    links.forEach(function (link) {
        var href = link.getAttribute("href");
        if (href && href.charAt(0) !== "#") {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        }
    });
})();
