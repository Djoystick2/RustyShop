import { NavLink, useLocation } from "react-router-dom";

type NavSection = "feed" | "catalog" | "giveaway" | "profile";

interface NavItem {
  to: string;
  label: string;
  icon: NavSection;
}

const navItems: NavItem[] = [
  { to: "/", label: "Лента", icon: "feed" },
  { to: "/catalog", label: "Каталог", icon: "catalog" },
  { to: "/giveaway", label: "Розыгрыш", icon: "giveaway" },
  { to: "/profile", label: "Профиль", icon: "profile" }
];

function resolveActiveSection(pathname: string): NavSection {
  if (pathname.startsWith("/catalog") || pathname.startsWith("/product")) {
    return "catalog";
  }

  if (pathname.startsWith("/giveaway")) {
    return "giveaway";
  }

  if (pathname.startsWith("/profile")) {
    return "profile";
  }

  return "feed";
}

function NavIcon({ icon }: { icon: NavSection }) {
  switch (icon) {
    case "feed":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4.5 10.75 12 4.75l7.5 6v8a1.75 1.75 0 0 1-1.75 1.75h-11.5A1.75 1.75 0 0 1 4.5 18.75Z" />
          <path d="M9.25 20.5v-5.25c0-.97.78-1.75 1.75-1.75h2c.97 0 1.75.78 1.75 1.75v5.25" />
        </svg>
      );
    case "catalog":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="4.25" y="4.25" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.25" y="4.25" width="6.5" height="6.5" rx="1.6" />
          <rect x="4.25" y="13.25" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.25" y="13.25" width="6.5" height="6.5" rx="1.6" />
        </svg>
      );
    case "giveaway":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5.25 10.5h13.5v8a1.75 1.75 0 0 1-1.75 1.75H7A1.75 1.75 0 0 1 5.25 18.5Z" />
          <path d="M12 10.5v9.75" />
          <path d="M4.5 8.5a2.75 2.75 0 0 1 2.75-2.75H9l3 4.75H7.25A2.75 2.75 0 0 1 4.5 8.5Z" />
          <path d="M19.5 8.5a2.75 2.75 0 0 0-2.75-2.75H15l-3 4.75h4.75A2.75 2.75 0 0 0 19.5 8.5Z" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19.25c.79-3.12 3.39-5 6.5-5s5.71 1.88 6.5 5" />
        </svg>
      );
    default:
      return null;
  }
}

export function BottomNav() {
  const location = useLocation();
  const activeSection = resolveActiveSection(location.pathname);

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav__inner">
        {navItems.map((item) => {
          const isActive = activeSection === item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav__item${isActive ? " bottom-nav__item_active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="bottom-nav__pill">
                <span className="bottom-nav__icon" aria-hidden="true">
                  <NavIcon icon={item.icon} />
                </span>
                <span className="bottom-nav__label">{item.label}</span>
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
