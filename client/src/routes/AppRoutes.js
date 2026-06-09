import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import VendorLogin from "../pages/VendorLogin";
import OTPVerify from "../pages/OTPVerify";
import CreateStore from "../pages/CreateStore";
import Dashboard from "../pages/Dashboard";
import StoreView from "../pages/StoreView";
import ProductDetail from "../pages/ProductDetail";
import Checkout from "../pages/Checkout";
import OrderSuccess from "../pages/OrderSuccess";
import InfoPage from "../pages/InfoPage";
import NotFound from "../pages/NotFound";
import { RouteSkeleton } from "../components/LoadingSkeleton";

const MapView = lazy(() => import("../pages/MapView"));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/verify" element={<OTPVerify />} />
      <Route path="/vendor/create-store" element={<CreateStore />} />
      <Route path="/vendor/dashboard" element={<Dashboard />} />
      <Route path="/store/:id" element={<StoreView />} />
      <Route path="/store/:storeId/product/:productId" element={<ProductDetail />} />
      <Route path="/store/:storeId/checkout" element={<Checkout />} />
      <Route path="/store/:storeId/order-success/:orderId" element={<OrderSuccess />} />
      <Route path="/about" element={<InfoPage pageKey="about" />} />
      <Route path="/support" element={<InfoPage pageKey="support" />} />
      <Route path="/terms-and-conditions" element={<InfoPage pageKey="terms-and-conditions" />} />
      <Route path="/terms-of-use" element={<InfoPage pageKey="terms-of-use" />} />
      <Route path="/privacy-policy" element={<InfoPage pageKey="privacy-policy" />} />
      <Route path="/vendor-policy" element={<InfoPage pageKey="vendor-policy" />} />
      <Route
        path="/map"
        element={
          <Suspense fallback={<RouteSkeleton label="Loading map" />}>
            <MapView />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
