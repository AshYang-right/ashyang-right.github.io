/**
 * 首页：渲染文章列表
 */
(function () {
    const listEl = document.getElementById("posts-list");
    if (!listEl) return;

    if (POSTS.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:var(--color-text-secondary);">暂无文章，敬请期待。</p>';
        return;
    }

    const html = POSTS.map(function (post) {
        const tagsHtml = post.tags.map(function (t) {
            return '<span class="tag">' + t + '</span>';
        }).join("");

        return (
            '<article class="post-card">' +
                '<h2 class="post-card-title"><a href="posts/' + post.slug + '.html">' + post.title + '</a></h2>' +
                '<div class="post-card-meta">' + post.date + '</div>' +
                '<p class="post-card-summary">' + post.summary + '</p>' +
                '<div class="post-card-tags">' + tagsHtml + '</div>' +
            '</article>'
        );
    }).join("");

    listEl.innerHTML = html;
})();
