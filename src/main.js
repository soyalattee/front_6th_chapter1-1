import ProductListPage from "./pages/ProductListPage.js";
import { cartModal } from "./components/cartModal.js";
import { cartStore } from "./store/cartStore.js";
import { state, setState, subscribe } from "./store/stateStore.js";
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

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  setState({ loading: true });
  // localStorage에서 cart 데이터 로드
  cartStore.loadFromStorage();
  const { openCartModal, updateQuantityInputs, addToCart, renderCartModal } = cartModal({ state, setState });
  subscribe(() => {
    updateQuantityInputs();
    renderCartModal();
  });
  setState({ cart: cartStore.state.cart });
  //TODO: 일단 productListPage 바로 생성
  const page = ProductListPage({ state, openCartModal, addToCart, showToast, setState });
  page.createPage();
  subscribe(() => {
    page.render();
  });
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
