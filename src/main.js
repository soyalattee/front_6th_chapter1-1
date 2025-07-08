import ProductListPage from "./pages/ProductListPage.js";
import { getProducts, getCategories } from "./api/productApi.js";

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
  productInfiniteLoading: false,
};

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
    searchInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        onSearch(e.target.value);
      }
    };
  }
  // 개수 변경
  const limitSelect = document.getElementById("limit-select");
  if (limitSelect) {
    limitSelect.value = state.pagination.limit || 20;
    limitSelect.onchange = (e) => {
      state.pagination.limit = Number(e.target.value);
      onLimitChange(Number(e.target.value));
    };
  }

  // 정렬 변경
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.value = state.filters.sort || "price_asc";
    sortSelect.onchange = (e) => {
      state.filters.sort = e.target.value;
      onSortChange(e.target.value);
    };
  }

  // 카테고리 필터 버튼
  const categoryButtons = document.querySelectorAll(".category1-filter-btn");
  categoryButtons.forEach((button) => {
    button.onclick = (e) => {
      const category = e.target.getAttribute("data-category1");
      state.filters.category1 = category;
      onCategoryChange(category);
    };
  });
  // 카테고리 2depth 필터 버튼
  const category2Buttons = document.querySelectorAll(".category2-filter-btn");
  category2Buttons.forEach((button) => {
    button.onclick = (e) => {
      const category = e.target.getAttribute("data-category2");
      onCategory2Change(category);
    };
  });

  // 브레드크럼 버튼들
  const breadcrumbButtons = document.querySelectorAll("[data-breadcrumb]");
  breadcrumbButtons.forEach((button) => {
    button.onclick = (e) => {
      const breadcrumbType = e.target.getAttribute("data-breadcrumb");
      if (breadcrumbType === "reset") {
        // 모든 카테고리 초기화
        state.filters.category1 = "";
        state.filters.category2 = "";
        onCategoryReset();
      } else if (breadcrumbType === "category1") {
        // category2만 초기화
        state.filters.category2 = "";
        onCategory2Reset();
      }
    };
  });
}

async function fetchAndRenderProducts(params = {}) {
  // 기존 state.filters와 params를 합쳐서 요청
  const query = { ...state.filters, ...params, page: params.page || state.pagination.page };
  const productRes = await getProducts(query);
  state.products = productRes.products;
  state.filters = productRes.filters;
  state.pagination = productRes.pagination;
  state.loading = false;
  render(ProductListPage(state));
}

async function fetchInfiniteProducts(params = {}) {
  render(ProductListPage(state));
  const query = {
    ...state.filters,
    ...params,
    page: params.page || state.pagination.page,
  };
  const productRes = await getProducts(query);
  state.products = [...state.products, ...productRes.products];
  state.pagination = productRes.pagination;
  state.productInfiniteLoading = false;
  render(ProductListPage(state));
}

async function main() {
  state.loading = true;
  render(ProductListPage(state));
  const categoriesRes = await getCategories();
  state.categories = categoriesRes;
  console.log(state.categories["생활/건강"]);
  fetchAndRenderProducts();
}

// 라우터 설정
function setupRouter() {
  window.addEventListener("popstate", () => {
    main();
  });
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(() => {
    main();
    setupRouter();
    setupScrollInfinity();
  });
} else {
  main();
  setupRouter();
  setupScrollInfinity();
}

function setupScrollInfinity() {
  window.removeEventListener("scroll", handleScrollInfinity);
  window.addEventListener("scroll", handleScrollInfinity);
}

function handleScrollInfinity() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 100 && state.pagination.hasNext && !state.productInfiniteLoading) {
    state.productInfiniteLoading = true;
    fetchInfiniteProducts({ page: state.pagination.page + 1, limit: state.pagination.limit });
  }
}

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

// 카테고리 변경
function onCategoryChange(category) {
  fetchAndRenderProducts({ category1: category, page: 1 });
}
// 카테고리 변경
function onCategory2Change(category) {
  fetchAndRenderProducts({ category2: category, page: 1 });
}

// 모든 카테고리 초기화
function onCategoryReset() {
  fetchAndRenderProducts({ category1: "", category2: "", page: 1 });
}

// category2만 초기화
function onCategory2Reset() {
  fetchAndRenderProducts({ category2: "", page: 1 });
}
