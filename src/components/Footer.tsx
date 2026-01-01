import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from "lucide-react";
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              About LAUTECH Market
            </h3>
            <p className="text-sm leading-relaxed">
              Lautech Market is the #1 online directory for student vendors in
              Ogbomoso. We replace the chaos of messy WhatsApp groups with a
              clean, searchable platform. All for free.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="inline-flex items-center space-x-2 text-sm text-gray-500 cursor-not-allowed"
                >
                  Shipping Info
                  <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold ml-1">
                    SOON
                  </span>
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center space-x-2 text-sm text-gray-500 cursor-not-allowed">
                  <span>Track Order</span>
                  <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    SOON
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Contact Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  Contact Support
                </Link>
              </li>
              <li className="flex items-center space-x-3 py-0.5">
                <a
                  href="mailto:lautechmarket.help@gmail.com"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  lautechmarket.help@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Make Money
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-3 py-0.5">
                <Link
                  to="/vendor/register"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  Sell on LAUTECH Market
                </Link>
              </li>
              <li className="flex items-center space-x-3 py-0.5">
                <a
                  href="https://chat.whatsapp.com/J8tSxuYVX5ZJKy8WESiE6T"
                  className="text-sm hover:text-emerald-400 transition-colors"
                >
                  Vendor Hub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row space-x-10 justify-center items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              © {new Date().getFullYear()} LAUTECH Market. All rights reserved.
            </p>

            <div className="flex items-center space-x-6">
              <a
                href="#"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
