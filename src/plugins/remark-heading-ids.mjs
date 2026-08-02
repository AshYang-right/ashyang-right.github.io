const markerPattern = /\s*\{#([A-Za-z][\w:-]*)\}\s*$/;

export default function remarkHeadingIds() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (node?.type === "heading" && Array.isArray(node.children)) {
    const last = node.children[node.children.length - 1];
    if (last?.type === "text") {
      const match = last.value.match(markerPattern);
      if (match) {
        last.value = last.value.replace(markerPattern, "");
        node.data ??= {};
        node.data.hProperties ??= {};
        node.data.hProperties.id = match[1];
      }
    }
  }
  if (Array.isArray(node?.children)) node.children.forEach(walk);
}
