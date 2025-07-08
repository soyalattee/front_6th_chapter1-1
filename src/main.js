import ProductListPage from "./pages/ProductListPage.js";
import { getProducts, getCategories } from "./api/productApi.js";
import { cartModal } from "./components/cartModal.js";
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
  cart: [],
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

  // 장바구니 아이콘 버튼
  const cartIconBtn = document.getElementById("cart-icon-btn");
  if (cartIconBtn) {
    cartIconBtn.onclick = () => {
      showCartModal();
    };
  }

  // 장바구니 담기 버튼들
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
  addToCartButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.getAttribute("data-product-id");
      const product = state.products.find((p) => p.productId === productId);
      if (product) {
        addToCart(product);
        showToast("장바구니에 추가되었습니다");
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

// 장바구니에 상품 추가
function addToCart(product) {
  // 이미 장바구니에 있는지 확인
  const existingItem = state.cart.find((item) => item.productId === product.productId);
  console.log(existingItem);
  if (existingItem) {
    // 이미 있으면 수량 증가
    existingItem.quantity += 1;
  } else {
    // 없으면 새로 추가
    state.cart.push({
      ...product,
      quantity: 1,
    });
  }

  // 장바구니 아이콘의 숫자 업데이트
  updateCartIcon();
}

// 장바구니 아이콘 업데이트
function updateCartIcon() {
  const cartIcon = document.querySelector("#cart-icon-btn span");
  if (cartIcon) {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartIcon.textContent = totalItems;

    // 아이템이 없으면 숨기기
    if (totalItems === 0) {
      cartIcon.style.display = "none";
    } else {
      cartIcon.style.display = "flex";
    }
  }
}

// 토스트 메시지 표시
function showToast(message) {
  // 기존 토스트 제거
  const existingToast = document.getElementById("toast-message");
  if (existingToast) {
    existingToast.remove();
  }

  // 토스트 요소 생성
  const toast = document.createElement("div");
  toast.id = "toast-message";
  toast.className =
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full";
  toast.textContent = message;

  // body에 추가
  document.body.appendChild(toast);

  // 애니메이션 효과
  setTimeout(() => {
    toast.classList.remove("translate-x-full");
  }, 100);

  // 3초 후 제거
  setTimeout(() => {
    toast.classList.add("translate-x-full");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// 장바구니 모달 표시
function showCartModal() {
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // 스크롤 막기
  document.body.style.overflow = "hidden";

  // 모달 요소 생성
  const modal = document.createElement("div");
  modal.id = "cart-modal";
  modal.classList.add(
    "flex",
    "fixed",
    "bg-black/50",
    "cart-modal-overlay",
    "top-0",
    "left-0",
    "z-50",
    "min-h-full",
    "w-full",
    "items-end",
    "justify-center",
    "p-0",
    "sm:items-center",
    "sm:p-4",
  );
  updateCartModal(modal);
  // 모달을 body에 추가
  document.body.appendChild(modal);

  // 모달 닫기 함수
  const closeModal = () => {
    modal.remove();
    // 스크롤 다시 활성화
    document.body.style.overflow = "";
  };

  // 닫기 버튼 이벤트
  const closeBtn = modal.querySelector("#cart-modal-close-btn");
  closeBtn.onclick = closeModal;

  // 모달 외부 클릭 시 닫기
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };

  // ESC 키로 닫기
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);
}

// 장바구니 모달 내부 이벤트 바인딩
function bindCartModalEvents(modal) {
  // 수량 증가 버튼
  const increaseButtons = modal.querySelectorAll(".quantity-increase-btn");
  increaseButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.closest("button").getAttribute("data-product-id");
      updateCartItemQuantity(productId, 1);
      updateCartModal(modal);
    };
  });

  // 수량 감소 버튼
  const decreaseButtons = modal.querySelectorAll(".quantity-decrease-btn");
  decreaseButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.closest("button").getAttribute("data-product-id");
      updateCartItemQuantity(productId, -1);
      updateCartModal(modal);
    };
  });

  // 삭제 버튼
  const removeButtons = modal.querySelectorAll(".cart-item-remove-btn");
  removeButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.getAttribute("data-product-id");
      removeFromCart(productId);
      updateCartModal(modal);
    };
  });
}

// 장바구니 아이템 수량 업데이트
function updateCartItemQuantity(productId, change) {
  console.log("update CartItemQuantity?", state.cart);
  const cartItem = state.cart.find((item) => item.productId === productId);
  if (cartItem) {
    cartItem.quantity += change;
    console.log("증가되었니?", state.cart);
    // 수량이 0 이하가 되면 장바구니에서 제거
    if (cartItem.quantity <= 0) {
      removeFromCart(productId);
    } else {
      // 장바구니 아이콘 업데이트
      updateCartIcon();
    }
  }
}

// 장바구니에서 아이템 제거
function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.productId !== productId);
  updateCartIcon();
}

// 장바구니 모달 업데이트
function updateCartModal(modal) {
  // 모달 내용을 새로운 cart 데이터로 업데이트
  console.log("신규 state니?", state.cart);
  modal.innerHTML = cartModal(state.cart);
  // const quantityInput = document.querySelector(".quantity-input");
  // console.log("왜업뎃안돼?", quantityInput.value);
  // 이벤트 다시 바인딩
  bindCartModalEvents(modal);
}
