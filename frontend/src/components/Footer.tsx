import { Shield, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
                <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                TrustFlow
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Automate security questionnaires with AI-powered GRC automation.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/HARSHITHGOWDAKR/backend_trustflow_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <Github className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400" />
              </a>
              <a
                href="mailto:harshithgowdakr@gmail.com"
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { label: "Dashboard", path: "/" },
                { label: "Projects", path: "/projects" },
                { label: "Knowledge Base", path: "/knowledge-base" },
                { label: "Technical Specs", path: "/technical" },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                  >
                    {item.label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Features</h3>
            <ul className="space-y-3">
              {[
                "AI-Powered QA",
                "Human Review Loop",
                "Policy Citations",
                "Export & Share",
                "Vector Search",
                "Audit Trail",
              ].map((feature) => (
                <li key={feature}>
                  <span className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-default">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {[
                { label: "About", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Documentation", href: "#" },
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                  >
                    {item.label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              © {currentYear} TrustFlow. All rights reserved. | Built with <span className="text-red-500">❤</span> for enterprise security.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
