import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Лента", icon: "🧺" },
  { to: "/catalog", label: "Каталог", icon: "🗂️" },
  { to: "/giveaway", label: "Розыгрыш", icon: "🎁" },
  { to: "/profile", label: "Профиль", icon: "🙋" }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item_active" : ""}`}
        >
          <span className="bottom-nav__icon" aria-hidden>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
