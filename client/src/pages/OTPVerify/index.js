import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";
import { getSavedPhone, setAuthToken, setVendor } from "../../services/session";
import useDocumentTitle from "../../utils/useDocumentTitle";

function OTPVerify() {
  const { t } = useLanguage();
  useDocumentTitle("Verify OTP");
  const navigate = useNavigate();
  const savedPhone = getSavedPhone();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!savedPhone) {
    return <Navigate to="/vendor/login" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/verify-otp", { phone: savedPhone, otp });
      setVendor(response.data.data.vendor);
      setAuthToken(response.data.data.token);
      setMessage(response.data.message || t("otp.success"));
      navigate("/vendor/create-store");
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("otp.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <section className="page__hero">
        <div className="auth-layout">
          <div className="surface-card">
            <p className="page__eyebrow">{t("otp.step")}</p>
            <h1 className="page__heading page__heading--compact">{t("otp.title")}</h1>
            <p className="page__copy">{t("otp.copy")}</p>
            <div className="timeline">
              <div className="timeline__item">
                <span className="timeline__count">1</span>
                <div className="timeline__text">
                  <strong>{t("otp.phoneSession")}</strong>
                  <span className="surface-card__copy">{savedPhone}</span>
                </div>
              </div>
              <div className="timeline__item">
                <span className="timeline__count">2</span>
                <div className="timeline__text">
                  <strong>{t("otp.code")}</strong>
                  <span className="surface-card__copy">{t("otp.codeHint")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <form className="form-panel" onSubmit={handleSubmit}>
              <label className="field">
                <span>{t("otp.label")}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("otp.placeholder")}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
              </label>
              {message ? <p className="status-text status-text--success">{message}</p> : null}
              {error ? <p className="status-text status-text--error">{error}</p> : null}
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("otp.verifying") : t("otp.verify")}
              </button>
              <Link to="/vendor/login" className="button--ghost">
                {t("otp.back")}
              </Link>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OTPVerify;
