import { ProductDetailUI } from "../views/PrudctDetailUI.js";
import { getProduct } from "../api/productApi.js";

export const ProductDetailPage = ({ state, setState }) => {
  const pageInstance = {};

  const createPage = async (params) => {
    const productRes = await getProduct(params.productId);
    setState({ product: productRes, loading: false });
  };
  const render = () => {
    const root = document.getElementById("root");
    root.innerHTML = ProductDetailUI(state);
  };

  pageInstance.createPage = createPage;
  pageInstance.render = render;

  return pageInstance;
};

export default ProductDetailPage;
