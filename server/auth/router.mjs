/**
 * A minimal router: `METHOD /path/:param` patterns, matched in order.
 *
 * The server has a handful of routes and no framework, so this keeps it that
 * way. Query strings are ignored for matching and parsed into `query`.
 */

function compile(pattern) {
  const names = [];
  const source = pattern
    .split('/')
    .map((part) => {
      if (!part.startsWith(':')) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      names.push(part.slice(1));
      return '([^/]+)';
    })
    .join('/');
  return { regex: new RegExp(`^${source}/?$`), names };
}

export function createRouter() {
  const routes = [];

  return {
    /** Register `handler(req, res, ctx)`; `options` is passed through to the match. */
    add(method, pattern, handler, options = {}) {
      routes.push({ method, ...compile(pattern), handler, options });
      return this;
    },

    /**
     * `{ handler, options, params, query }` for a request, or null. A path
     * that exists under another method is reported as `methodNotAllowed`.
     */
    match(method, url = '/') {
      const parsed = new URL(url, 'http://localhost');
      let pathExists = false;

      for (const route of routes) {
        const found = route.regex.exec(parsed.pathname);
        if (!found) continue;
        pathExists = true;
        if (route.method !== method) continue;

        const params = {};
        route.names.forEach((name, index) => {
          params[name] = decodeURIComponent(found[index + 1]);
        });
        return {
          handler: route.handler,
          options: route.options,
          params,
          query: Object.fromEntries(parsed.searchParams),
        };
      }

      return pathExists ? { methodNotAllowed: true } : null;
    },
  };
}
