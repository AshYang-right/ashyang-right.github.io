export default function rehypeArticleElements() {
  return (tree) => transform(tree);
}

function transform(node) {
  if (!Array.isArray(node?.children)) return;

  node.children = node.children.map((child) => {
    transform(child);

    if (child?.type === "element" && child.tagName === "table") {
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"], tabIndex: 0 },
        children: [child]
      };
    }

    if (child?.type === "element" && child.tagName === "pre") {
      const lines = textOf(child).split("\n").length;
      if (lines > 18) {
        return {
          type: "element",
          tagName: "details",
          properties: { className: ["code-details"] },
          children: [
            {
              type: "element",
              tagName: "summary",
              properties: {},
              children: [{ type: "text", value: `展开完整代码 · ${lines} 行` }]
            },
            child
          ]
        };
      }
    }

    return child;
  });
}

function textOf(node) {
  if (node?.type === "text") return node.value ?? "";
  return Array.isArray(node?.children) ? node.children.map(textOf).join("") : "";
}
