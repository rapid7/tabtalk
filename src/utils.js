export const assign = (target, ...sources) =>
  sources.reduce(
    (assigned, source) =>
      Object.keys(source).reduce((assigned, key) => {
        assigned[key] = source[key];

        return assigned;
      }, assigned),
    target
  );
