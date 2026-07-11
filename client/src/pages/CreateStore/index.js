import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, LocateFixed, Share2, Store, UploadCloud } from "lucide-react";
import api from "../../services/api";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { setAuthToken, setStore as persistStore, setVendor } from "../../services/session";
import SystemAlert from "../../components/SystemAlert";
import { normalizeApiError } from "../../utils/errors";
import { isValidPassword, isValidPhone } from "../../utils/validation";
import { defaultWizardValues, wizardStorageKey } from "./wizardConfig";
import "./CreateStore.css";

const categoryOptions = ["Grocery", "Food", "Fashion", "Electronics", "Handcrafts", "Drawings", "Paintings", "Art", "Services", "Other"];

const stepLabels = ["Welcome", "Owner", "Storefront", "Location", "Media", "Contact", "Review", "Done"];

const initialTouched = {};

const createStoreFallbackError = {
  title: "We could not create your store",
  message: "Please check your store details and try again. If this keeps happening, the API server may need to be restarted.",
};

function getStepAlert(message) {
  return {
    title: "Please review this step",
    message,
  };
}

function getInitialValues() {
  const savedValues = window.localStorage.getItem(wizardStorageKey);

  if (!savedValues) {
    return defaultWizardValues;
  }

  try {
    return { ...defaultWizardValues, ...JSON.parse(savedValues) };
  } catch (error) {
    window.localStorage.removeItem(wizardStorageKey);
    return defaultWizardValues;
  }
}

function getCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function hasValidCoordinates(values) {
  const lat = getCoordinate(values.lat);
  const lng = getCoordinate(values.lng);

  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}

function getPublicStoreUrl(store) {
  if (!store?._id) {
    return `${window.location.origin}/store/your-store`;
  }

  return `${window.location.origin}/store/${store._id}`;
}

function getDisplayStoreId(store) {
  return store?.storeCode || store?._id || "";
}

function getUpiQrReference(values) {
  return ["SnaflesHub", values.name, values.ownerName, values.email || values.workPhone, values.category]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ");
}

function CreateStore() {
  const navigate = useNavigate();
  const [values, setValues] = useState(getInitialValues);
  const [currentStep, setCurrentStep] = useState(0);
  const [touched, setTouched] = useState(initialTouched);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [successStore, setSuccessStore] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [error, setError] = useState(null);
  useDocumentTitle("Create your SnaflesHub store");

  const publicStoreUrl = useMemo(() => getPublicStoreUrl(successStore), [successStore]);
  const displayStoreId = getDisplayStoreId(successStore);

  useEffect(() => {
    if (successStore) {
      return;
    }

    try {
      window.localStorage.setItem(wizardStorageKey, JSON.stringify(values));
    } catch (storageError) {
      window.localStorage.removeItem(wizardStorageKey);
    }
  }, [successStore, values]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setError(null);
  }

  function updateValue(name, value) {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setError(null);
  }

  function markTouched(names) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      ...names.reduce((nextTouched, name) => ({ ...nextTouched, [name]: true }), {}),
    }));
  }

  function getFieldError(name) {
    if (name === "ownerName" && !values.ownerName.trim()) {
      return "Enter the owner or contact name.";
    }

    if (name === "category" && !values.category.trim()) {
      return "Choose a storefront category.";
    }

    if (name === "name" && !values.name.trim()) {
      return "Enter the store name.";
    }

    if (name === "description" && values.description.trim().length < 12) {
      return "Add at least 12 characters.";
    }

    if (name === "landmark" && !values.landmark.trim()) {
      return "Add a nearby landmark.";
    }

    if (name === "address" && values.address.trim().length < 8) {
      return "Enter a clear local area or address.";
    }

    if (name === "workPhone" && !isValidPhone(values.workPhone)) {
      return "Enter a valid phone number.";
    }

    if (name === "password" && !isValidPassword(values.password)) {
      return "Use at least 8 characters.";
    }

    return "";
  }

  function getStepFields(step = currentStep) {
    if (step === 1) {
      return ["ownerName", "category"];
    }

    if (step === 2) {
      return ["name", "description"];
    }

    if (step === 3) {
      return ["landmark", "address"];
    }

    if (step === 5) {
      return ["workPhone", "password"];
    }

    return [];
  }

  function validateStep(step = currentStep) {
    const fields = getStepFields(step);
    const fieldError = fields.map(getFieldError).find(Boolean);

    if (fieldError) {
      return fieldError;
    }

    if (step === 3 && !hasValidCoordinates(values)) {
      return "Use current location so your store can be placed on the map.";
    }

    return "";
  }

  function isStepValid(step = currentStep) {
    return !validateStep(step);
  }

  function goNext() {
    const fields = getStepFields();
    markTouched(fields);

    const validationMessage = validateStep();

    if (validationMessage) {
      setError(getStepAlert(validationMessage));
      return;
    }

    setError(null);
    setCurrentStep((step) => Math.min(stepLabels.length - 2, step + 1));
  }

  function goBack() {
    setError(null);
    setCurrentStep((step) => Math.max(0, step - 1));
  }

  function goToStep(targetStep) {
    if (targetStep === currentStep || currentStep === stepLabels.length - 1 || targetStep === stepLabels.length - 1) {
      return;
    }

    if (targetStep < currentStep) {
      setError(null);
      setCurrentStep(targetStep);
      return;
    }

    for (let step = 1; step < targetStep; step += 1) {
      const stepError = validateStep(step);

      if (stepError) {
        markTouched(getStepFields(step));
        setCurrentStep(step);
        setError(getStepAlert(stepError));
        return;
      }
    }

    setError(null);
    setCurrentStep(targetStep);
  }

  function handleLocate() {
    setError(null);

    if (!navigator.geolocation) {
      setError({
        title: "Location is not available",
        message: "You can continue by entering your landmark and address manually.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((currentValues) => ({
          ...currentValues,
          showOnMap: true,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setError({
          title: "We could not detect your location",
          message: "Allow browser location access and try again while you are at the store. This is needed to place your store on the map.",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleMediaChange(event) {
    const { name, files } = event.target;
    updateValue(name, files?.[0]?.name || "");
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
    } catch (copyError) {
      setCopyStatus(`Copy failed. Select and copy the ${label.toLowerCase()} manually.`);
    }
  }

  async function shareStore() {
    if (navigator.share) {
      await navigator.share({
        title: successStore?.name || "SnaflesHub store",
        text: "Visit my SnaflesHub store.",
        url: publicStoreUrl,
      });
      return;
    }

    await copyText(publicStoreUrl, "Store link");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    for (const step of [1, 2, 3, 5]) {
      const stepError = validateStep(step);

      if (stepError) {
        markTouched(getStepFields(step));
        setCurrentStep(step);
        setError(getStepAlert(stepError));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/register-store", {
        ownerName: values.ownerName.trim(),
        name: values.name.trim(),
        email: values.email.trim(),
        workPhone: values.workPhone.trim(),
        password: values.password,
        address: [values.landmark.trim(), values.address.trim()].filter(Boolean).join(", "),
        description: values.description.trim(),
        category: values.category.trim(),
        productKeywords: [],
        logoUrl: "",
        coverImageUrl: "",
        workingHours: "",
        upiId: values.upiId.trim(),
        upiQrUrl: values.upiQrUrl.trim(),
        upiQrReference: (values.upiQrReference || getUpiQrReference(values)).trim(),
        paypalEmail: "",
        paymentType: values.upiId.trim() || values.upiQrUrl.trim() ? "upi" : "cash",
        location:
          values.showOnMap && hasValidCoordinates(values)
            ? {
                lat: getCoordinate(values.lat),
                lng: getCoordinate(values.lng),
              }
            : null,
      });

      const { vendor, store, token } = response.data.data;
      setVendor(vendor);
      setAuthToken(token);
      persistStore(store);
      window.localStorage.removeItem(wizardStorageKey);
      window.sessionStorage.setItem("snafleshub_dashboard_notice", "Your store has been created.");
      setSuccessStore(store);
      setCurrentStep(7);
    } catch (requestError) {
      setError(normalizeApiError(requestError, createStoreFallbackError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function goDashboard() {
    navigate("/vendor/dashboard", { replace: true });
  }

  const canContinue = currentStep === 0 || currentStep === 4 || isStepValid();

  return (
    <div className="page store-onboarding-page page-shell">
      <section className="store-onboarding-shell" aria-label="Create SnaflesHub store">
        <div className="store-onboarding-card">
          <div className="store-onboarding-progress" aria-label="Onboarding progress">
            {stepLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === currentStep ? "is-active" : index < currentStep ? "is-complete" : ""}
                onClick={() => goToStep(index)}
                disabled={currentStep === stepLabels.length - 1 || index === stepLabels.length - 1}
                aria-current={index === currentStep ? "step" : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="store-onboarding-form" onSubmit={handleSubmit} noValidate>
            {currentStep === 0 ? (
              <section className="store-step store-step--welcome">
                <span className="store-step__icon" aria-hidden="true">
                  <Store size={24} />
                </span>
                <h1>Create your SnaflesHub store</h1>
                <p>Set up your store in a few simple steps.</p>
              </section>
            ) : null}

            {currentStep === 1 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>About owner</h1>
                  <p>Start with the person customers and SnaflesHub can contact.</p>
                </div>
                <label className="field">
                  <span>Owner/contact name</span>
                  <input name="ownerName" value={values.ownerName} onChange={updateField} onBlur={() => markTouched(["ownerName"])} autoFocus />
                  <small>{touched.ownerName ? getFieldError("ownerName") : "Use the name customers or support should recognize."}</small>
                </label>
                <label className="field">
                  <span>Storefront category</span>
                  <select name="category" value={values.category} onChange={updateField} onBlur={() => markTouched(["category"])}>
                    <option value="">Choose category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <small>{touched.category ? getFieldError("category") : "This helps customers understand the storefront."}</small>
                </label>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>Store identity</h1>
                  <p>Keep it short and clear. You can edit details later.</p>
                </div>
                <label className="field">
                  <span>Store name</span>
                  <input name="name" value={values.name} onChange={updateField} onBlur={() => markTouched(["name"])} autoFocus />
                  <small>{touched.name ? getFieldError("name") : "Example: Style Collection, Aman Electronics, Fresh Bowl."}</small>
                </label>
                <label className="field">
                  <span>Short store description</span>
                  <textarea name="description" value={values.description} onChange={updateField} onBlur={() => markTouched(["description"])} />
                  <small>{touched.description ? getFieldError("description") : "One sentence about what customers can buy from you."}</small>
                </label>
              </section>
            ) : null}

            {currentStep === 3 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>Location</h1>
                  <p>Use the current location while you are at the store so customers can find it on the map.</p>
                </div>
                <button type="button" className="store-location-button" onClick={handleLocate} disabled={isLocating}>
                  <LocateFixed size={18} />
                  {isLocating ? "Finding location..." : "Use current location"}
                </button>
                {hasValidCoordinates(values) ? (
                  <p className="store-location-confirmed">
                    <Check size={16} /> Location added successfully
                  </p>
                ) : (
                  <p className="store-location-required">Location is required before this store can be listed on the map.</p>
                )}
                <label className="field">
                  <span>Landmark/nearby place</span>
                  <input name="landmark" value={values.landmark} onChange={updateField} onBlur={() => markTouched(["landmark"])} />
                  <small>{touched.landmark ? getFieldError("landmark") : "Example: Near Sector 17 bus stand."}</small>
                </label>
                <label className="field">
                  <span>Address/local area</span>
                  <input name="address" value={values.address} onChange={updateField} onBlur={() => markTouched(["address"])} />
                  <small>{touched.address ? getFieldError("address") : "A short area or address is enough to start."}</small>
                </label>
              </section>
            ) : null}

            {currentStep === 4 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>Store media</h1>
                  <p>Add visuals if you have them ready. You can skip this for now.</p>
                </div>
                <label className="store-upload">
                  <UploadCloud size={20} />
                  <span>Store logo upload optional</span>
                  <strong>{values.logoFileName || "Choose logo file"}</strong>
                  <input type="file" name="logoFileName" accept="image/*" onChange={handleMediaChange} />
                </label>
                <label className="store-upload">
                  <UploadCloud size={20} />
                  <span>Cover image upload optional</span>
                  <strong>{values.coverFileName || "Choose cover image"}</strong>
                  <input type="file" name="coverFileName" accept="image/*" onChange={handleMediaChange} />
                </label>
                <label className="field">
                  <span>UPI scanner image URL optional</span>
                  <input name="upiQrUrl" value={values.upiQrUrl} onChange={updateField} placeholder="https://example.com/upi-qr.jpg" />
                  <small>Add your UPI QR scanner now, or add it later from the dashboard.</small>
                </label>
                <label className="field">
                  <span>QR payment reference</span>
                  <input
                    name="upiQrReference"
                    value={values.upiQrReference || getUpiQrReference(values)}
                    onChange={updateField}
                    placeholder="SnaflesHub | Store | Owner | Email"
                  />
                  <small>Use this identity text with your UPI scanner so it matches your storefront and owner details.</small>
                </label>
                {values.upiQrUrl ? (
                  <div className="store-upi-preview">
                    <span>UPI scanner preview</span>
                    <img src={values.upiQrUrl} alt="UPI scanner preview" />
                    <small>{values.upiQrReference || getUpiQrReference(values)}</small>
                  </div>
                ) : null}
              </section>
            ) : null}

            {currentStep === 5 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>Contact + password</h1>
                  <p>Your Store ID is generated after creation. You only need phone and password here.</p>
                </div>
                <label className="field">
                  <span>Phone number</span>
                  <input type="tel" name="workPhone" value={values.workPhone} onChange={updateField} onBlur={() => markTouched(["workPhone"])} />
                  <small>{touched.workPhone ? getFieldError("workPhone") : "Use a number customers and login safeguards can reach."}</small>
                </label>
                <label className="field">
                  <span>Email optional</span>
                  <input type="email" name="email" value={values.email} onChange={updateField} placeholder="owner@example.com" />
                  <small>This helps match payment and storefront identity.</small>
                </label>
                <label className="field">
                  <span>Password</span>
                  <input type="password" name="password" value={values.password} onChange={updateField} onBlur={() => markTouched(["password"])} />
                  <small>{touched.password ? getFieldError("password") : "Use this password with your generated Store ID."}</small>
                </label>
                <label className="field">
                  <span>UPI ID optional</span>
                  <input name="upiId" value={values.upiId} onChange={updateField} placeholder="store@upi" />
                  <small>This can be used with your QR scanner for manual customer payments.</small>
                </label>
              </section>
            ) : null}

            {currentStep === 6 ? (
              <section className="store-step">
                <div className="store-step__header">
                  <h1>Review</h1>
                  <p>Check the summary before creating your store.</p>
                </div>
                <div className="store-review-list">
                  <article><span>Owner name</span><strong>{values.ownerName}</strong></article>
                  <article><span>Store name</span><strong>{values.name}</strong></article>
                  <article><span>Category</span><strong>{values.category}</strong></article>
                  <article><span>Location</span><strong>{[values.landmark, values.address].filter(Boolean).join(", ")}</strong></article>
                  <article><span>Phone</span><strong>{values.workPhone}</strong></article>
                  <article><span>Email</span><strong>{values.email || "Not added"}</strong></article>
                  <article><span>Media status</span><strong>{values.logoFileName || values.coverFileName ? "Media added" : "Skipped for now"}</strong></article>
                  <article><span>UPI scanner</span><strong>{values.upiQrUrl ? "Added" : "Not added yet"}</strong></article>
                  <article><span>QR reference</span><strong>{values.upiQrReference || getUpiQrReference(values)}</strong></article>
                </div>
              </section>
            ) : null}

            {currentStep === 7 && successStore ? (
              <section className="store-step store-step--success">
                <span className="store-step__icon store-step__icon--success" aria-hidden="true">
                  <Check size={24} />
                </span>
                <h1>Store created successfully</h1>
                <p>Use your password with this Store ID to log in again.</p>
                <div className="store-credentials">
                  <span>Store ID</span>
                  <strong>{displayStoreId}</strong>
                  <small>Password note: Use your password with this Store ID to log in again.</small>
                </div>
                <div className="store-success-actions">
                  <button type="button" className="button--secondary" onClick={() => copyText(displayStoreId, "Store ID")}>
                    <Copy size={16} /> Copy Store ID
                  </button>
                  <button type="button" className="button--secondary" onClick={() => copyText(publicStoreUrl, "Store link")}>
                    <Copy size={16} /> Copy Store link
                  </button>
                  <button type="button" className="button--ghost" onClick={shareStore}>
                    <Share2 size={16} /> Share store
                  </button>
                </div>
                {copyStatus ? <p className="status-text status-text--success">{copyStatus}</p> : null}
              </section>
            ) : null}

            {error ? (
              <SystemAlert variant="error" title={error.title}>
                {error.message}
              </SystemAlert>
            ) : null}

            <footer className="store-onboarding-actions">
              {currentStep === 0 ? (
                <Link to="/vendor/login" className="button--ghost">
                  Back to login
                </Link>
              ) : null}
              {currentStep > 0 && currentStep < 7 ? (
                <button type="button" className="button--secondary" onClick={goBack}>
                  Back
                </button>
              ) : null}
              {currentStep === 4 ? (
                <button type="button" className="button--ghost" onClick={goNext}>
                  Skip for now
                </button>
              ) : null}
              {currentStep < 6 ? (
                <button type="button" className="button" onClick={goNext} disabled={!canContinue}>
                  {currentStep === 0 ? "Start setup" : "Continue"}
                </button>
              ) : null}
              {currentStep === 6 ? (
                <button type="submit" className="button" disabled={isSubmitting || !isStepValid(6)}>
                  {isSubmitting ? "Creating store..." : "Create store"}
                </button>
              ) : null}
              {currentStep === 7 ? (
                <button type="button" className="button" onClick={goDashboard}>
                  Go to dashboard
                </button>
              ) : null}
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}

export default CreateStore;
