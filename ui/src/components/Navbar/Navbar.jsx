import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ArrowRight } from "lucide-react";
import oppiLogo from "../../assets/Oppi-logo.png";
import { isLoggedIn, getUser, clearTokens, logout } from "../../utils/api";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const deadline = new Date('2026-09-12T23:59:59+05:30');
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
  const daysStr = String(daysLeft).padStart(2, "0");

  const user = getUser();
  const loggedIn = isLoggedIn();

  // Check if we're on the dashboard/homepage
  const isDashboard = location.pathname === "/" || location.pathname === "/scientist";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".profile-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const navLinks = [
    { name: "ABOUT", href: "#about" },
    { name: "CATEGORIES", href: "#categories" },
    { name: "JURY", href: "#jury" },
    { name: "HELP", href: "/Help_Document.pdf", target: "_blank", rel: "noopener noreferrer" },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    try {
      await logout();
    } catch (e) {
      console.warn("API logout failed, clearing local session anyway:", e);
    }
    clearTokens();
    navigate("/");
  };

  const getLinkTo = (href) => {
    if (href.startsWith("#")) return href;
    if (href.startsWith("/") || href.startsWith("http")) return href;
    return `/${href}`;
  };

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="container nav-container">
        <Link to="/" className="navbar-brand" onClick={handleLinkClick}>
          <img src={oppiLogo} alt="OPPI Logo" className="logo-img" />
        </Link>

        {loggedIn && !isDashboard ? (
          /* User Greeting - Centered in navbar (Desktop) */
          <div className="nav-user-center desktop-only-link">
            <span className="nav-user-name">
              {`${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
            </span>
          </div>
        ) : null}

        <ul className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
          {/* Navigation links - only shown on dashboard or when not logged in */}
          {(!loggedIn || isDashboard) && navLinks.map((link) => (
            <li key={link.name}>
              {link.href.startsWith("#") || link.target === "_blank" || link.href.endsWith(".pdf") || link.href.startsWith("http") ? (
                <a
                  href={link.href}
                  target={link.target || undefined}
                  rel={link.rel || undefined}
                  onClick={handleLinkClick}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  to={getLinkTo(link.href)}
                  target={link.target || undefined}
                  rel={link.rel || undefined}
                  onClick={handleLinkClick}
                >
                  {link.name}
                </Link>
              )}
            </li>
          ))}

          {/* Mobile Only Profile Links - only show when NOT on dashboard */}
          {loggedIn && !isDashboard && (
            <>
              <li className="mobile-only-link divider"></li>
              <li className="mobile-only-link user-greeting-mobile">
                <span className="nav-user-name-mobile">
                  {`${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
                </span>
              </li>
              <li className="mobile-only-link">
                <a
                  href="/Help_Document.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                >
                  HELP
                </a>
              </li>
              <li className="mobile-only-link">
                <Link to="/change-password" onClick={handleLinkClick}>
                  CHANGE PASSWORD
                </Link>
              </li>
              <li className="mobile-only-link">
                <span className="mobile-logout-btn" onClick={handleLogout}>
                  LOGOUT
                </span>
              </li>
            </>
          )}

          {/* REMOVED: No logout option in mobile menu on dashboard */}
        </ul>

        <div className="nav-cta-wrapper">
          {loggedIn && !isDashboard ? (
            /* Logout Button - Desktop (only on non-dashboard pages) */
            <button className="header-logout-btn navbar-logout-btn desktop-only-link" onClick={handleLogout}>
              <span className="logout-text-part">LOG OUT</span>
              <div className="logout-icon-part">
                <LogOut size={16} />
              </div>
            </button>
          ) : (
            /* Show countdown and apply button on dashboard OR when not logged in */
          <div className="nav-action">
            <Link to="/login" className="apply-btn" onClick={() => setIsMobileMenuOpen(false)}>
              APPLY NOW <ArrowRight width={23} height={18} />
            </Link>
          </div>
          )}
        </div>

        <div
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;