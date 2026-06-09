import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const iconByVariant = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
};

function SystemAlert({ variant = "info", title, children }) {
  const Icon = iconByVariant[variant] || Info;

  return (
    <div className={`system-alert system-alert--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <span className="system-alert__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="system-alert__content">
        {title ? <strong>{title}</strong> : null}
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}

export default SystemAlert;

