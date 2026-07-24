// router.js — راوتر بسيط جدًا (بدون Express) بيدعم :params
function pathToRegex(path) {
  const keys = [];
  const pattern = path
    .replace(/\/:[a-zA-Z0-9_]+/g, (match) => {
      keys.push(match.slice(2));
      return '/([^/]+)';
    })
    .replace(/\//g, '\\/');
  return { regex: new RegExp(`^${pattern}$`), keys };
}

class Router {
  constructor() {
    this.routes = { GET: [], POST: [] };
  }
  get(path, handler) {
    this.routes.GET.push({ ...pathToRegex(path), handler });
  }
  post(path, handler) {
    this.routes.POST.push({ ...pathToRegex(path), handler });
  }
  match(method, pathname) {
    const list = this.routes[method] || [];
    for (const route of list) {
      const m = pathname.match(route.regex);
      if (m) {
        const params = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(m[i + 1]);
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

module.exports = Router;
