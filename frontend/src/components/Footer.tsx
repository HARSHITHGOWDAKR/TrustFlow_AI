import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container mx-auto px-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold text-foreground">TrustFlow</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © Team TrustFlow
      </p>
    </div>
  </footer>
);

export default Footer;
