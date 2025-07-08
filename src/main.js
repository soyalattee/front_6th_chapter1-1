import ProductListPage from "./pages/ProductListPage.js";

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

function main() {
  render(ProductListPage());
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
