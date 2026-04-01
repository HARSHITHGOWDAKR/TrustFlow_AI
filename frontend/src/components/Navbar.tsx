import { Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">TrustFlow</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            to="/projects"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/projects" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Projects
          </Link>
          <Link
            to="/knowledge-base"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/knowledge-base" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Knowledge Base
          </Link>
          <Link
            to="/technical"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/technical" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Technical Specs
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
