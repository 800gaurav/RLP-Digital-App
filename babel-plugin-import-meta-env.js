module.exports = function importMetaEnvPlugin({ types: t }) {
  const modeExpression = () =>
    t.logicalExpression(
      '||',
      t.memberExpression(
        t.memberExpression(t.identifier('process'), t.identifier('env')),
        t.identifier('NODE_ENV'),
      ),
      t.stringLiteral('development'),
    );

  return {
    name: 'transform-import-meta-env-for-classic-scripts',
    visitor: {
      MemberExpression(path) {
        const { node } = path;
        if (
          t.isMetaProperty(node.object) &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta' &&
          t.isIdentifier(node.property, { name: 'env' })
        ) {
          path.replaceWith(t.objectExpression([
            t.objectProperty(t.identifier('MODE'), modeExpression()),
          ]));
        }
      },
    },
  };
};
