import React, { useState, useEffect } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../redux/userSlice";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setSignInOpen }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.user);
  
  // Scroll event to fade the navbar
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setIsVisible(false); // fade out on scroll down
      } else {
        setIsVisible(true); // fade in on scroll up
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuItemClick = (event) => {
    // Prevent default behavior of anchor links
    event.preventDefault();
    
    // Get the target section ID from the anchor link
    const targetId = event.target.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);
  
    // Close the mobile menu
    setMenuOpen(false);
    
    // Smooth scroll to the target element
    targetElement.scrollIntoView({ behavior: "smooth" });
  
    // Set a timeout to hide the navbar after scrolling
    setTimeout(() => {
      setIsVisible(false); // hide navbar after scrolling
    }, 1000);
  };

  return (
    <>
      {/* Main Navbar Container */}
      <div
        className={`w-full max-w-[1320px] h-[80px] px-5 py-0 mx-auto mb-3 mt-2 flex items-center justify-between fixed top-0 left-0 right-0 bg-black/70 shadow-lg rounded-lg backdrop-blur-md z-50 transition-opacity duration-500 ease-in-out transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
        }`}
      >
        {/* Left Section: Logo */}
        <div className="font-bold text-2xl bg-gradient-to-r from-[#4caf50] to-[#00bcd4] bg-clip-text text-transparent cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105">
          Team Sync
        </div>

        {/* Center Menu - Hidden on Mobile */}
        <ul className="hidden md:flex items-center gap-10 list-none mx-auto">
          <li className="group relative">
            <a href="#features" onClick={handleMenuItemClick} className="font-semibold text-lg text-white transition-colors duration-300 group-hover:text-[#6B5BCD]">
              Features
            </a>
            <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
          </li>
          <li className="group relative">
            <a href="#benefits" onClick={handleMenuItemClick} className="font-semibold text-lg text-white transition-colors duration-300 group-hover:text-[#6B5BCD]">
              Benefits
            </a>
            <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
          </li>
          <li className="group relative">
            <a href="#testi" onClick={handleMenuItemClick} className="font-semibold text-lg text-white transition-colors duration-300 group-hover:text-[#6B5BCD]">
              Testimonials
            </a>
            <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
          </li>
          <li className="group relative">
            <a href="#faq" onClick={handleMenuItemClick} className="font-semibold text-lg text-white transition-colors duration-300 group-hover:text-[#6B5BCD]">
              FAQs
            </a>
            <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
          </li>
          <li className="group relative">
            <a href="#about" onClick={handleMenuItemClick} className="font-semibold text-lg text-white transition-colors duration-300 group-hover:text-[#6B5BCD]">
              About Us
            </a>
            <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
          </li>
        </ul>

        {/* Right Section: Avatar + Logout or Sign In */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 py-1 px-2 font-bold text-white bg-slate-950 border-2 border-[#6B5BCD] rounded-full hover:bg-white hover:text-[#6B5BCD] transition-all duration-300 transform hover:translate-y-[-3px] shadow-lg hover:shadow-2xl" onClick={()=>{
                    localStorage.getItem("isAdmin") === "true" ? navigate("/dashboard/admin") : navigate("/dashboard/user")
                  }}>
                <img
                  src="https://i.pravatar.cc/150"
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  
                />
                Dashboard
              </button>
              <button
                onClick={() => dispatch(logout())}
                className="py-2 px-6 bg-[#6B5BCD] text-white font-bold rounded-full hover:bg-white hover:text-[#6B5BCD] border-2 border-[#6B5BCD] transition-all duration-300 transform hover:translate-y-[-3px] shadow-lg hover:shadow-2xl"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="py-2 px-6 bg-[#6B5BCD] text-white font-bold rounded-full hover:bg-white hover:text-[#6B5BCD] border-2 border-[#6B5BCD] transition-all duration-300 transform hover:translate-y-[-3px] shadow-lg hover:shadow-2xl flex items-center gap-2"
            >
              <AccountCircleOutlinedIcon />
              Sign In
            </button>
          )}

          {/* Hamburger Menu for Mobile */}
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="block md:hidden cursor-pointer"
          >
            {menuOpen ? (
              <CloseIcon fontSize="large" className="text-white" />
            ) : (
              <MenuIcon fontSize="large" className="text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-[80px] left-0 right-0 bottom-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <ul className="absolute right-[30px] top-[20px] bg-white p-5 rounded-lg shadow-lg w-[300px] z-50 transition-all duration-300">
            <li className="group relative mt-1 flex items-center justify-center h-12">
              <a href="#features" onClick={handleMenuItemClick} className="font-semibold text-lg text-gray-700 transition-colors duration-300 group-hover:text-[#6B5BCD] text-center">
                Features
              </a>
              <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
            </li>
            <li className="group relative mt-5 flex items-center justify-center h-12">
              <a href="#benefits" onClick={handleMenuItemClick} className="font-semibold text-lg text-gray-700 transition-colors duration-300 group-hover:text-[#6B5BCD] text-center">
                Benefits
              </a>
              <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
            </li>
            <li className="group relative mt-5 flex items-center justify-center h-12">
              <a href="#testi" onClick={handleMenuItemClick} className="font-semibold text-lg text-gray-700 transition-colors duration-300 group-hover:text-[#6B5BCD] text-center">
                Testimonials
              </a>
              <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
            </li>
            <li className="group relative mt-5 flex items-center justify-center h-12">
              <a href="#faq" onClick={handleMenuItemClick} className="font-semibold text-lg text-gray-700 transition-colors duration-300 group-hover:text-[#6B5BCD] text-center">
                FAQs
              </a>
              <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
            </li>
            <li className="group relative mt-5 flex items-center justify-center h-12">
              <a href="#about" onClick={handleMenuItemClick} className="font-semibold text-lg text-gray-700 transition-colors duration-300 group-hover:text-[#6B5BCD] text-center">
                About Us
              </a>
              <span className="absolute bottom-[-6px] left-1/2 w-0 h-[2px] bg-[#6B5BCD] group-hover:w-full transition-all duration-300 ease-in-out origin-center group-hover:left-0"></span>
            </li>
            
            <div className="mt-5">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    dispatch(logout());
                    setMenuOpen(false);
                  }}
                  className="w-full py-2 px-6 bg-[#6B5BCD] text-white font-bold rounded-full hover:bg-white hover:text-[#6B5BCD] border-2 border-[#6B5BCD] transition-all duration-300 transform hover:translate-y-[-3px] shadow-lg hover:shadow-2xl"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSignInOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full py-2 px-6 bg-[#6B5BCD] text-white font-bold rounded-full hover:bg-white hover:text-[#6B5BCD] border-2 border-[#6B5BCD] transition-all duration-300 transform hover:translate-y-[-3px] shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  <AccountCircleOutlinedIcon />
                  Sign In
                </button>
              )}
            </div>
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;