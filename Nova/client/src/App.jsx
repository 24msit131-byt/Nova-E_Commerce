import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/user/Home/home";
import Navbar from "./components/Navbar";
import Register from "./pages/user/Register/register";
import Login from "./pages/user/Login/login";
import ForgotPassword from "./pages/user/Login/ForgotPassword";
import ResetPassword from "./pages/user/Login/ResetPassword";
import AdminDashboard from "./pages/Admin/Dashboard/Dashboard";
import Profile from "./pages/user/Profile/profile";
import Cart from "./pages/user/Cart/cart";
import Products from "./pages/user/Product/product";
import ProductDetails from "./pages/user/Product/productDetails";
import AboutUs from "./pages/user/AboutUs/aboutUs";
import ContactUs from "./pages/user/ContactUs/contactUs";
import Checkout from "./pages/user/Checkout/Checkout";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ManageProducts from "./pages/Admin/ManageProducts/ManageProducts";
import ManageOrders from "./pages/Admin/ManageOrders/ManageOrders";
import ManageUsers from "./pages/Admin/ManageUsers/ManageUsers";
import ManageAdmins from "./pages/Admin/ManageUsers/ManageAdmins";
import AddProduct from "./pages/Admin/ManageProducts/AddProduct";
import UpdateProduct from "./pages/Admin/ManageProducts/UpdateProduct";
import OrderDetails from "./pages/Admin/ManageOrders/OrderDetails";
import Banner from "./pages/Admin/Banner/Banner";
import PromoCode from "./pages/Admin/PromoCode/promoCode";





export default function App() {
  const location = useLocation();
  const hideNavbarPaths = ["/register", "/login", "/forgot-password"];
  const isAdminPath = location.pathname.startsWith("/admin");
  const isResetPasswordPath = location.pathname.startsWith("/reset-password/");
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname) || isAdminPath || isResetPasswordPath;

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/admins" element={<ManageAdmins />} />
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="/admin/update-product/:id" element={<UpdateProduct />} />
        <Route path="/admin/order-details/:id" element={<OrderDetails />} />
        <Route path="/admin/banner" element={<Banner />} />
        <Route path="/admin/promo-code" element={<PromoCode />} />
        <Route path="/admin/promoCode" element={<PromoCode />} />

      </Routes>
    </div>
  );
}