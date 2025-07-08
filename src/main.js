import ProductListPage from "./pages/ProductListPage.js";
import { getProducts, getCategories } from "./api/productApi.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

const render = (page) => {
  const root = document.getElementById("root");
  root.innerHTML = page;
};

const state = {
  products: [],
  pagination: {
    page: 1,
    limit: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    total: 0,
  },
  filters: {
    search: "",
    sort: "price_asc",
    category1: "",
    category2: "",
  },
  loading: true,
  categories: null,
};

async function main() {
  render(ProductListPage(state));
  const [productRes, categoriesRes] = await Promise.all([getProducts(), getCategories()]);
  state.loading = false;
  state.productList = productRes.products;
  state.pagination = productRes.pagination;
  state.categories = categoriesRes;

  render(ProductListPage(state));
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
