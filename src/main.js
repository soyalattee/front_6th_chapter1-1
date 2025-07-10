import ProductListPage from "./pages/ProductListPage.js";
import { getProducts, getCategories } from "./api/productApi.js";
import { cartModal } from "./components/cartModal.js";
import { cartStore } from "./store/cartStore.js";
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
  // localStorage에서 cart 데이터 로드
  cartStore.loadFromStorage();
  state.cart = cartStore.state.cart;
  updateQuantityInputs();
  const categoriesRes = await getCategories();
  state.categories = categoriesRes;
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
  cartStore.actions.addToCart(cartStore.state, product);
  state.cart = cartStore.state.cart;
  updateQuantityInputs();
  // 장바구니 아이콘의 숫자 업데이트
  render(ProductListPage(state));
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
      updateQuantityInputs();
      updateCartModal(modal);
    };
  });

  // 수량 감소 버튼
  const decreaseButtons = modal.querySelectorAll(".quantity-decrease-btn");
  decreaseButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.closest("button").getAttribute("data-product-id");

      updateCartItemQuantity(productId, -1);
      updateQuantityInputs();
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

  // 상품 선택 체크박스
  const checkboxes = modal.querySelectorAll(".cart-item-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.onclick = (e) => {
      const productId = e.target.getAttribute("data-product-id");
      const isChecked = e.target.checked;
      const cartItem = state.cart.find((item) => item.productId === productId);
      if (cartItem) {
        cartItem.isChecked = isChecked;
      }
      updateCartModal(modal);
    };
  });
  // 선택한 상품 삭제 버튼
  const removeSelectedBtn = modal.querySelector("#cart-modal-remove-selected-btn");
  removeSelectedBtn.onclick = () => {
    // 체크된 체크박스의 productId 수집
    const checkedBoxes = document.querySelectorAll(".cart-item-checkbox:checked");
    const selectedIds = Array.from(checkedBoxes).map((cb) => cb.dataset.productId);
    selectedIds.forEach((id) => removeFromCart(id));
    updateCartModal(modal);
  };
}

// 장바구니 아이템 수량 업데이트
function updateCartItemQuantity(productId, change) {
  cartStore.actions.updateCartItemQuantity(cartStore.state, productId, change);
  state.cart = cartStore.state.cart;

  // 장바구니 아이콘 업데이트
  render(ProductListPage(state));
}

// 장바구니에서 아이템 제거
function removeFromCart(productId) {
  cartStore.actions.removeFromCart(cartStore.state, productId);
  state.cart = cartStore.state.cart;
  render(ProductListPage(state));
}

// 장바구니 모달 업데이트
function updateCartModal(modal) {
  // 모달 내용을 새로운 cart 데이터로 업데이트
  modal.innerHTML = cartModal(state.cart);

  // 이벤트 다시 바인딩
  bindCartModalEvents(modal);
}

// quantity-input 요소들의 value를 cart 데이터에 맞춰 업데이트
function updateQuantityInputs() {
  const quantityInputs = document.querySelectorAll(".quantity-input");
  quantityInputs.forEach((input) => {
    const productId = input.getAttribute("data-product-id");
    const cartItem = state.cart.find((item) => item.productId === productId);
    if (cartItem) {
      input.value = cartItem.quantity;
    } else {
      input.value = 0;
    }
  });
}
