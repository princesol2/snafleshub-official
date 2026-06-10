import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Eye, EyeOff, PackageCheck, ShoppingBag } from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { setAuthToken, setSavedPhone, setStore, setVendor } from "../../services/session";
import BrandMark from "../../components/BrandMark";
import SystemAlert from "../../components/SystemAlert";
import { normalizeApiError } from "../../utils/errors";
import { isValidPassword, isValidPhone } from "../../utils/validation";

const authModes = {
  store: "store",
  otp: "otp",
  reset: "reset",
};
const isOtpEnabled = import.meta.env.VITE_ENABLE_OTP === "true";

function getFormAlert(message) {
  return {
    title: "Please review your details",
    message,
  };
}

function VendorLogin() {
  const { t } = useLanguage();
  useDocumentTitle("Storefront Login");
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState(authModes.store);
  const [phone, setPhone] = useState("");
  const [storeId, setStoreId] = useState("");
  const [password, setPassword] = useState("");
  const [resetStoreId, setResetStoreId] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const [isResetCodeSent, setIsResetCodeSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const resetStatus = () => {
    setError(null);
    setMessage("");
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    resetStatus();

    if (!isValidPhone(phone)) {
      setError(getFormAlert(t("validation.phone")));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/send-otp", { phone });
      setSavedPhone(phone);
      setMessage(response.data.message || t("login.otpSent"));
      navigate("/vendor/verify");
    } catch (requestError) {
      setError(normalizeApiError(requestError, { title: "OTP could not be sent", message: t("login.otpError") }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreLoginSubmit = async (event) => {
    event.preventDefault();
    resetStatus();

    if (!storeId.trim()) {
      setError(getFormAlert("Please enter your Store ID or work phone number."));
      return;
    }

    if (!isValidPassword(password)) {
      setError(getFormAlert(t("validation.password")));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/login-store", { storeId, password });
      setVendor(response.data.data.vendor);
      setStore(response.data.data.store);
      setAuthToken(response.data.data.token);
      setMessage(response.data.message || t("login.loginSuccess"));
      navigate("/vendor/dashboard");
    } catch (requestError) {
      setError(normalizeApiError(requestError, { title: "Login was not successful", message: t("login.storeLoginSoon") }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    resetStatus();
    setResetStoreId(storeId);
    setActiveMode(authModes.reset);
  };

  const handleRequestPasswordReset = async (event) => {
    event.preventDefault();
    resetStatus();

    if (!isValidPhone(resetPhone)) {
      setError(getFormAlert(t("validation.phone")));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/request-password-reset", {
        storeId: resetStoreId,
        phone: resetPhone,
      });
      setIsResetCodeSent(true);
      setMessage(response.data.message || t("login.resetCodeSent"));
    } catch (requestError) {
      setError(normalizeApiError(requestError, { title: "Reset code could not be sent", message: t("login.resetCodeError") }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    resetStatus();

    if (!resetCode.trim()) {
      setError(getFormAlert(t("validation.otp")));
      return;
    }

    if (!isValidPassword(resetPassword)) {
      setError(getFormAlert(t("validation.newPassword")));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/reset-password", {
        storeId: resetStoreId,
        phone: resetPhone,
        otp: resetCode,
        password: resetPassword,
      });
      setMessage(response.data.message || t("login.passwordUpdated"));
      setPassword("");
      setStoreId(resetStoreId || resetPhone);
      setActiveMode(authModes.store);
    } catch (requestError) {
      setError(normalizeApiError(requestError, { title: "Password could not be updated", message: t("login.passwordResetError") }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchAuthMode = (mode) => {
    resetStatus();
    setActiveMode(mode);
  };

  return (
    <div className="page">
      <section className="auth-layout vendor-login-shell">
          <aside className="vendor-login-picture" aria-label="SnaflesHub dashboard preview">
            <div className="vendor-login-brand-panel">
              <div className="vendor-login-brand">
                <BrandMark />
                <span>SnaflesHub</span>
              </div>
              <div className="vendor-login-brand-copy">
                <h1>Run your store from one dashboard</h1>
                <p>Manage products, orders, analytics, customers, and storefront settings in one place.</p>
              </div>
              <div className="vendor-login-preview" aria-hidden="true">
                <div className="vendor-login-preview__top">
                  <span>Today</span>
                  <strong>Store dashboard</strong>
                </div>
                <div className="vendor-login-preview__metrics">
                  <article>
                    <ShoppingBag size={18} />
                    <span>Orders</span>
                    <strong>24</strong>
                  </article>
                  <article>
                    <PackageCheck size={18} />
                    <span>Products</span>
                    <strong>128</strong>
                  </article>
                  <article>
                    <BarChart3 size={18} />
                    <span>Reach</span>
                    <strong>8.4k</strong>
                  </article>
                </div>
                <div className="vendor-login-preview__bar">
                  <span />
                </div>
              </div>
            </div>
          </aside>

          <section className="vendor-login-card">
            {activeMode === authModes.store ? (
              <form className="vendor-login-form" onSubmit={handleStoreLoginSubmit} noValidate>
                <div className="vendor-login-form__header">
                  <h1 className="vendor-login-title">Storefront login</h1>
                  <p>Access your SnaflesHub store dashboard</p>
                </div>
                <label className="vendor-login-field">
                  <span>Store ID or work phone</span>
                  <input
                    type="text"
                    placeholder="Enter Store ID or work phone"
                    value={storeId}
                    onChange={(event) => setStoreId(event.target.value)}
                    required
                  />
                </label>

                <label className="vendor-login-field password-field">
                  <span>{t("login.password")}</span>
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-field__toggle"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </label>

                <div className="vendor-login-links">
                  {isOtpEnabled ? (
                    <>
                      <button type="button" className="vendor-login-link" onClick={handleForgotPassword}>
                        Forgot Store ID or password?
                      </button>
                      <button type="button" className="vendor-login-link" onClick={() => switchAuthMode(authModes.otp)}>
                        {t("login.withOtp")}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="vendor-login-link" onClick={handleForgotPassword}>
                      Forgot Store ID or password?
                    </button>
                  )}
                </div>

                {message ? <SystemAlert variant="success" title="Success">{message}</SystemAlert> : null}
                {error ? <SystemAlert variant="error" title={error.title}>{error.message}</SystemAlert> : null}

                <button type="submit" className="vendor-login-submit" disabled={isSubmitting}>
                  {isSubmitting ? t("otp.verifying") : t("login.login")}
                </button>
                <p className="vendor-login-create-link">
                  New vendor? <Link to="/vendor/create-store">Create your store</Link>
                </p>
              </form>
            ) : activeMode === authModes.otp ? (
              <form className="vendor-login-form" onSubmit={handleOtpSubmit} noValidate>
                <div className="vendor-login-form__header">
                  <h1 className="vendor-login-title">{t("login.withOtp")}</h1>
                  <p>Use your storefront phone number to continue.</p>
                </div>
                <label className="vendor-login-field">
                  <span>{t("login.phone")}</span>
                  <input
                    type="tel"
                    placeholder={t("login.phonePlaceholder")}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </label>
                <p className="vendor-login-note">{t("login.otpHint")}</p>
                {message ? <SystemAlert variant="success" title="Success">{message}</SystemAlert> : null}
                {error ? <SystemAlert variant="error" title={error.title}>{error.message}</SystemAlert> : null}
                <button type="submit" className="vendor-login-submit" disabled={isSubmitting}>
                  {isSubmitting ? t("login.sendingOtp") : t("login.sendOtp")}
                </button>
                <button type="button" className="vendor-login-alt" onClick={() => switchAuthMode(authModes.store)}>
                  Use Store ID or phone
                </button>
              </form>
            ) : (
              <form
                className="vendor-login-form"
                onSubmit={isResetCodeSent ? handleResetPassword : handleRequestPasswordReset}
                noValidate
              >
                <div className="vendor-login-form__header">
                  <h1 className="vendor-login-title">{t("login.resetPassword")}</h1>
                  <p>Use your work phone to receive a reset code. Store ID is optional if you remember it.</p>
                </div>
                <label className="vendor-login-field">
                  <span>Store ID optional</span>
                  <input
                    type="text"
                    placeholder="Enter Store ID if you remember it"
                    value={resetStoreId}
                    onChange={(event) => setResetStoreId(event.target.value)}
                  />
                </label>
                <label className="vendor-login-field">
                  <span>{t("login.phone")}</span>
                  <input
                    type="tel"
                    placeholder={t("login.phonePlaceholder")}
                    value={resetPhone}
                    onChange={(event) => setResetPhone(event.target.value)}
                    required
                  />
                </label>
                {isResetCodeSent ? (
                  <>
                    <label className="vendor-login-field">
                      <span>{t("login.resetCode")}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={t("login.resetCodePlaceholder")}
                        value={resetCode}
                        onChange={(event) => setResetCode(event.target.value)}
                        required
                      />
                    </label>
                    <label className="vendor-login-field password-field">
                      <span>{t("login.newPassword")}</span>
                      <input
                        type={isResetPasswordVisible ? "text" : "password"}
                        placeholder={t("login.newPasswordPlaceholder")}
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-field__toggle"
                        onClick={() => setIsResetPasswordVisible((current) => !current)}
                        aria-label={isResetPasswordVisible ? "Hide password" : "Show password"}
                      >
                        {isResetPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        {isResetPasswordVisible ? "Hide" : "Show"}
                      </button>
                    </label>
                  </>
                ) : null}
                {message ? <SystemAlert variant="success" title="Success">{message}</SystemAlert> : null}
                {error ? <SystemAlert variant="error" title={error.title}>{error.message}</SystemAlert> : null}
                <button type="submit" className="vendor-login-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("login.working")
                    : isResetCodeSent
                      ? t("login.updatePassword")
                      : t("login.sendResetCode")}
                </button>
                <button type="button" className="vendor-login-alt" onClick={() => switchAuthMode(authModes.store)}>
                  Use Store ID or phone
                </button>
              </form>
            )}
          </section>
      </section>
    </div>
  );
}

export default VendorLogin;
