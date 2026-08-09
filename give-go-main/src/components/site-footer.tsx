import { Link } from "@tanstack/react-router";
import { Heart, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <Heart className="size-4.5" />
            </span>
            <span className="text-lg font-semibold">ShareAt</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A donation and reuse platform connecting households, volunteers and NGOs so good things
            get a second life.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/features" className="hover:text-foreground">
                Features
              </Link>
            </li>
            <li>
              <Link to="/ngos" className="hover:text-foreground">
                NGO network
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Get involved</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">
                Donate items
              </Link>
            </li>
            <li>
              <Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">
                Become a volunteer
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Partner with us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> hello@shareat.com
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +91 9876543210
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" /> Pune, India
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ShareAt. Give more. Waste less.
      </div>
    </footer>
  );
}
