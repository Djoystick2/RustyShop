import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { CatalogPage } from "./pages/CatalogPage";
import { CategoryPage } from "./pages/CategoryPage";
import { FeedPage } from "./pages/FeedPage";
import { GiveawayPage } from "./pages/GiveawayPage";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { ProductPage } from "./pages/ProductPage";
import { ProfilePage } from "./pages/ProfilePage";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<FeedPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:categoryId" element={<CategoryPage />} />
          <Route path="giveaway" element={<GiveawayPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="product/:productId" element={<ProductPage />} />
          <Route path="*" element={<FeedPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
