function printTree(tree, value) {
  const cursor = tree.cursor()
  let depth = 0

  while (true) {
    const indent = "  ".repeat(depth)

    console.log(
      `${indent}${cursor.name} [${cursor.from}, ${cursor.to}] "${value.slice(cursor.from, cursor.to)}"`
    )

    if (cursor.firstChild()) {
      depth++
      continue
    }

    while (!cursor.nextSibling()) {
      if (!cursor.parent()) return
      depth--
    }
  }
}

export { printTree };