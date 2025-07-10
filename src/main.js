import ProductListPage from "./pages/ProductListPage.js";
import { cartModal } from "./components/cartModal.js";
import { cartStore } from "./store/cartStore.js";
import { state, setState, subscribe } from "./store/stateStore.js";

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
  const page = ProductListPage({ state, openCartModal, addToCart, setState });
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
