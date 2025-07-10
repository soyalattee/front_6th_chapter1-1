import ProductListPage from "./pages/ProductListPage.js";
import { cartModal } from "./components/cartModal.js";
import { cartStore } from "./store/cartStore.js";
let modal = null;
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

// 장바구니에 상품 추가
function addToCart({ product, page }) {
  cartStore.actions.addToCart(cartStore.state, product);
  state.cart = cartStore.state.cart;
  updateQuantityInputs();
  // 장바구니 아이콘의 숫자 업데이트
  page.render();
}

// 장바구니 모달 업데이트
function renderCartModal() {
  if (!modal) return;
  // 모달 내용을 새로운 cart 데이터로 업데이트
  modal.innerHTML = cartModal(state.cart);
  // 이벤트 다시 바인딩
  bindCartModalEvents();
}

// 장바구니 모달 표시
function openCartModal() {
  console.log("openCartModal");
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById("modal-root");
  if (existingModal) {
    existingModal.remove();
  }
  modal = document.createElement("div");
  modal.id = "modal-root";
  // 스크롤 막기
  document.body.style.overflow = "hidden";

  renderCartModal();
  // 모달을 body에 추가
  document.body.appendChild(modal);

  // 모달 닫기 함수
  const closeModal = () => {
    console.log("closeModal");
    modal.remove();
    // 스크롤 다시 활성화
    document.body.style.overflow = "";
  };

  // 닫기 버튼 이벤트
  const closeBtn = modal.querySelector("#cart-modal-close-btn");
  closeBtn.onclick = closeModal;

  // 모달 외부 클릭 시 닫기
  modal.onclick = (e) => {
    if (e.target === modal.querySelector(".modal-overlay")) {
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
function bindCartModalEvents() {
  // 수량 증가 버튼
  const increaseButtons = modal.querySelectorAll(".quantity-increase-btn");
  increaseButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.closest("button").getAttribute("data-product-id");

      updateCartItemQuantity(productId, 1);
      updateQuantityInputs();
      renderCartModal();
    };
  });

  // 수량 감소 버튼
  const decreaseButtons = modal.querySelectorAll(".quantity-decrease-btn");
  decreaseButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.closest("button").getAttribute("data-product-id");

      updateCartItemQuantity(productId, -1);
      updateQuantityInputs();
      renderCartModal();
    };
  });

  // 삭제 버튼
  const removeButtons = modal.querySelectorAll(".cart-item-remove-btn");
  removeButtons.forEach((button) => {
    button.onclick = (e) => {
      const productId = e.target.getAttribute("data-product-id");
      removeFromCart(productId);
      renderCartModal();
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
      renderCartModal();
    };
  });

  // 선택한 상품 삭제 버튼
  const removeSelectedBtn = modal.querySelector("#cart-modal-remove-selected-btn");
  removeSelectedBtn.onclick = () => {
    // 체크된 체크박스의 productId 수집
    const checkedBoxes = document.querySelectorAll(".cart-item-checkbox:checked");
    const selectedIds = Array.from(checkedBoxes).map((cb) => cb.dataset.productId);
    selectedIds.forEach((id) => removeFromCart(id));
    renderCartModal();
  };

  //전체 선택 버튼
  const selectAllCheckbox = modal.querySelector("#cart-modal-select-all-checkbox");
  selectAllCheckbox.onclick = (e) => {
    const isChecked = e.target.checked;
    state.cart.forEach((item) => {
      item.isChecked = isChecked;
    });
    renderCartModal();
  };
  // 비우기 버튼
  const clearCartBtn = modal.querySelector("#cart-modal-clear-cart-btn");
  clearCartBtn.onclick = () => {
    removeAllFromCart();
    renderCartModal();
  };
}

// 장바구니 아이템 수량 업데이트
function updateCartItemQuantity(productId, change) {
  cartStore.actions.updateCartItemQuantity(cartStore.state, productId, change);
  state.cart = cartStore.state.cart;

  // 장바구니 아이콘 업데이트
  // renderAndBindEvents(ProductListPage(state));
}

// 장바구니에서 아이템 제거
function removeFromCart(productId) {
  cartStore.actions.removeFromCart(cartStore.state, productId);
  state.cart = cartStore.state.cart;
  // renderAndBindEvents(ProductListPage(state));
}
//장바구니 비우기
function removeAllFromCart() {
  cartStore.actions.removeAllFromCart(cartStore.state);
  state.cart = cartStore.state.cart;
  // renderAndBindEvents(ProductListPage(state));
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

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  state.loading = true;
  // localStorage에서 cart 데이터 로드
  cartStore.loadFromStorage();
  state.cart = cartStore.state.cart;
  updateQuantityInputs();
  //TODO: 일단 productListPage 바로 생성
  const page = ProductListPage({ state, openCartModal, addToCart, showToast });
  page.createPage();
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
  });
} else {
  main();
  setupRouter();
}
