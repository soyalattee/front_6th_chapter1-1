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
  bindProductListEvents();
};

function bindProductListEvents() {
  // 검색
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.value = state.filters.search || "";
    searchInput.oninput = (e) => onSearch(e.target.value);
  }

  // 개수 변경
  const limitSelect = document.getElementById("limit-select");
  if (limitSelect) {
    console.log("limitSelect", state.pagination.limit);
    limitSelect.value = state.pagination.limit || 20;
    limitSelect.onchange = (e) => onLimitChange(Number(e.target.value));
  }

  // 정렬 변경
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    console.log("sortSelect", state.filters.sort);
    sortSelect.value = state.filters.sort || "name_asc";
    sortSelect.onchange = (e) => onSortChange(e.target.value);
  }

  // 페이지네이션 버튼 등도 이곳에서 바인딩 (추후 추가)
}

const state = {
  products: [],
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
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

async function fetchAndRenderProducts(params = {}) {
  render(ProductListPage(state));
  // 기존 state.filters와 params를 합쳐서 요청
  const query = { ...state.filters, ...params, page: params.page || state.pagination.page };
  const productRes = await getProducts(query);
  state.loading = false;
  state.products = productRes.products;
  state.filters = productRes.filters;
  state.pagination = productRes.pagination;
  render(ProductListPage(state));
}

async function main() {
  state.loading = true;
  render(ProductListPage(state));
  const categoriesRes = await getCategories();
  state.categories = categoriesRes;

  await fetchAndRenderProducts();
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}

// 페이지 이동은 인피니티로 구현 예정 현재는 1페이지만 구현
// function onPageChange(newPage) {
//   fetchAndRenderProducts({ page: newPage });
// }
//페이지당 상품수 변경
function onLimitChange(limit) {
  fetchAndRenderProducts({ limit: limit, page: 1 });
}

// 검색
function onSearch(searchText) {
  fetchAndRenderProducts({ search: searchText, page: 1 });
}

// 정렬 변경
function onSortChange(sortType) {
  fetchAndRenderProducts({ sort: sortType, page: 1 });
}
