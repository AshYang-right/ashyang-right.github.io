/**
 * 首页：标签筛选 + 文章列表渲染
 *
 * 标题的单一数据源是文章 HTML 中的 <h1>。
 * 首页先用 posts.js 的 title 快速渲染（fallback），
 * 然后异步 fetch 每篇文章的 HTML，提取真实 <h1> 覆盖显示。
 * 这样即使 posts.js 的 title 忘了改，首页也会显示正确标题。
 */
(function () {
    var listEl = document.getElementById("posts-list");
    var filterEl = document.getElementById("tag-filter");
    if (!listEl) return;

    // 提取所有不重复的标签
    var allTags = [];
    POSTS.forEach(function (post) {
        post.tags.forEach(function (t) {
            if (allTags.indexOf(t) === -1) allTags.push(t);
        });
    });

    // 当前选中的标签（null 表示"全部"）
    var activeTag = null;

    // 渲染标签筛选按钮
    function renderFilter() {
        if (!filterEl) return;
        var html = '<button class="tag-filter-btn' + (activeTag === null ? ' active' : '') + '" data-tag="">全部</button>';
        allTags.forEach(function (tag) {
            html += '<button class="tag-filter-btn' + (activeTag === tag ? ' active' : '') + '" data-tag="' + tag + '">' + tag + '</button>';
        });
        filterEl.innerHTML = html;

        // 绑定点击事件
        var btns = filterEl.querySelectorAll(".tag-filter-btn");
        btns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var tag = this.getAttribute("data-tag");
                activeTag = tag === "" ? null : tag;
                renderFilter();
                renderPosts();
            });
        });
    }

    // 渲染文章列表
    function renderPosts() {
        var filtered = activeTag === null ? POSTS : POSTS.filter(function (post) {
            return post.tags.indexOf(activeTag) !== -1;
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;color:var(--color-text-secondary);padding:40px 0;">该标签下暂无文章。</p>';
            return;
        }

        var html = filtered.map(function (post) {
            var tagsHtml = post.tags.map(function (t) {
                return '<span class="tag">' + t + '</span>';
            }).join("");

            return (
                '<article class="post-card" data-slug="' + post.slug + '" data-href="posts/' + post.slug + '.html">' +
                    '<h2 class="post-card-title"><a href="posts/' + post.slug + '.html">' + post.title + '</a></h2>' +
                    '<div class="post-card-meta">' + post.date + '</div>' +
                    '<p class="post-card-summary">' + post.summary + '</p>' +
                    '<div class="post-card-tags">' + tagsHtml + '</div>' +
                '</article>'
            );
        }).join("");

        listEl.innerHTML = html;

        // 整个卡片可点击跳转
        listEl.querySelectorAll(".post-card[data-href]").forEach(function (card) {
            card.addEventListener("click", function () {
                window.location.href = this.getAttribute("data-href");
            });
        });
    }

    renderFilter();
    renderPosts();

    // 异步校准标题：从文章 HTML 中提取真实 <h1> 覆盖首页显示
    POSTS.forEach(function (post) {
        fetch("posts/" + post.slug + ".html")
            .then(function (res) { return res.text(); })
            .then(function (html) {
                var match = html.match(/<h1[^>]*class="article-title"[^>]*>([\s\S]*?)<\/h1>/);
                if (!match) match = html.match(/<article-header[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/);
                if (!match) match = html.match(/<h1>([\s\S]*?)<\/h1>/);
                if (match && match[1]) {
                    var realTitle = match[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
                    if (realTitle !== post.title) {
                        post.title = realTitle;
                        var card = listEl.querySelector('[data-slug="' + post.slug + '"]');
                        if (card) {
                            var titleLink = card.querySelector(".post-card-title a");
                            if (titleLink) titleLink.textContent = realTitle;
                        }
                    }
                }
            })
            .catch(function () {});
    });
})();
