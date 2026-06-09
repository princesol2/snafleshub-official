import "./LoginIllustration.css";
import shLogo from "../../../img/sh-logo.jpeg";

function LoginIllustration() {
  return (
    <div className="login-illustration login-illustration--brand" aria-hidden="true">
      <img className="login-illustration__image" src={shLogo} alt="" />
    </div>
  );
}

export default LoginIllustration;
