import { Link } from "react-router-dom";
import { Edit3 } from "lucide-react";

export default function EditPortfolioTrigger() {
  return (
    <Link
      to="/admin"
      className="edit-portfolio-fab"
      title="Edit portfolio in admin panel"
      aria-label="Edit portfolio"
    >
      <Edit3 size={15} aria-hidden="true" />
      <span>Edit portfolio</span>
    </Link>
  );
}

