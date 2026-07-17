import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Eye, IndianRupee, Send, Store } from "lucide-react";
import api from "../../services/api";
import SystemAlert from "../../components/SystemAlert";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { isValidPhone } from "../../utils/validation";
import "./CafeStudy.css";

const initialValues = {
  cafeName: "",
  ownerName: "",
  phone: "",
  area: "",
  cafeType: "",
  customerSources: [],
  biggestChallenge: "",
  onlinePresence: [],
  usefulFeatures: [],
  topFeature: "",
  monthlyPrice: "",
  paymentComfort: [],
  pilotInterest: "",
  contactMethod: "",
  comment: "",
};

const cafeTypes = [
  { value: "Small cafe", label: "Small cafe", hi: "छोटा कैफे" },
  { value: "Bakery cafe", label: "Bakery cafe", hi: "बेकरी कैफे" },
  { value: "Restaurant cafe", label: "Restaurant cafe", hi: "रेस्टोरेंट कैफे" },
  { value: "Tea or coffee stall", label: "Tea or coffee stall", hi: "चाय या कॉफी स्टॉल" },
  { value: "Other food spot", label: "Other food spot", hi: "दूसरा फूड स्पॉट" },
];

const customerSources = [
  { value: "Walk-ins", label: "Walk-ins", hi: "आस-पास से आने वाले ग्राहक" },
  { value: "Google Maps", label: "Google Maps", hi: "गूगल मैप्स" },
  { value: "Instagram", label: "Instagram", hi: "इंस्टाग्राम" },
  { value: "WhatsApp", label: "WhatsApp", hi: "व्हाट्सऐप" },
  { value: "Friends and referrals", label: "Friends and referrals", hi: "दोस्तों की सलाह" },
  { value: "Delivery apps", label: "Delivery apps", hi: "डिलीवरी ऐप्स" },
];

const challenges = [
  { value: "Low visibility", label: "Low visibility", hi: "लोगों को कैफे के बारे में कम पता है" },
  { value: "Weak online presence", label: "Weak online presence", hi: "ऑनलाइन मौजूदगी कमजोर है" },
  { value: "Low weekday footfall", label: "Low weekday footfall", hi: "वीकडे पर कम ग्राहक आते हैं" },
  { value: "Strong competition nearby", label: "Strong competition nearby", hi: "आस-पास ज्यादा प्रतियोगिता है" },
  { value: "Fewer repeat customers", label: "Fewer repeat customers", hi: "ग्राहक वापस कम आते हैं" },
];

const onlinePresence = [
  { value: "Google Maps listing", label: "Google Maps listing", hi: "गूगल मैप्स लिस्टिंग" },
  { value: "Instagram page", label: "Instagram page", hi: "इंस्टाग्राम पेज" },
  { value: "WhatsApp catalog", label: "WhatsApp catalog", hi: "व्हाट्सऐप कैटलॉग" },
  { value: "Delivery app profile", label: "Delivery app profile", hi: "डिलीवरी ऐप प्रोफाइल" },
  { value: "No active online presence", label: "No active online presence", hi: "अभी कोई सक्रिय ऑनलाइन मौजूदगी नहीं" },
];

const visibilityFeatures = [
  { value: "Map visibility", label: "Map visibility", hi: "मैप पर दिखना" },
  { value: "Menu and photos", label: "Menu and photos", hi: "मेन्यू और फोटो" },
  { value: "Offer visibility", label: "Offer visibility", hi: "ऑफर दिखाना" },
  { value: "Customer inquiries", label: "Customer inquiries", hi: "ग्राहकों की पूछताछ" },
  { value: "Reviews and social proof", label: "Reviews and social proof", hi: "रिव्यू और भरोसा" },
];

const monthlyPrices = [
  { value: "₹99 per month", label: "₹99 / month", hi: "₹99 प्रति माह" },
  { value: "₹199 per month", label: "₹199 / month", hi: "₹199 प्रति माह" },
  { value: "₹499 per month", label: "₹499 / month", hi: "₹499 प्रति माह" },
  { value: "₹999 per month", label: "₹999 / month", hi: "₹999 प्रति माह" },
  { value: "Free trial first", label: "I would try it free first", hi: "पहले फ्री ट्रायल चाहिए" },
  { value: "Not interested", label: "Not interested", hi: "अभी रुचि नहीं है" },
];

const paymentComfort = [
  { value: "Free trial", label: "Free trial", hi: "फ्री ट्रायल" },
  { value: "Visible listing page", label: "Visible listing page", hi: "साफ दिखने वाला लिस्टिंग पेज" },
  { value: "Customer inquiries", label: "Customer inquiries", hi: "ग्राहकों की पूछताछ" },
  { value: "Basic analytics", label: "Basic analytics", hi: "बेसिक एनालिटिक्स" },
  { value: "No lock-in", label: "No lock-in", hi: "कोई लॉक-इन नहीं" },
  { value: "Setup support", label: "Setup support", hi: "सेटअप में मदद" },
];

const pilotInterest = [
  { value: "Yes, contact me", label: "Yes, contact me", hi: "हां, मुझसे संपर्क करें" },
  { value: "Maybe later", label: "Maybe later", hi: "शायद बाद में" },
  { value: "Only after seeing details", label: "Only after seeing details", hi: "पहले डिटेल देखकर" },
  { value: "No", label: "No", hi: "नहीं" },
];

const contactMethods = [
  { value: "WhatsApp", label: "WhatsApp", hi: "व्हाट्सऐप" },
  { value: "Phone call", label: "Phone call", hi: "फोन कॉल" },
  { value: "SMS", label: "SMS", hi: "एसएमएस" },
];

const steps = [
  {
    id: "profile",
    label: "Profile",
    hi: "प्रोफाइल",
    icon: Store,
    title: "Tell us about your cafe",
    titleHi: "अपने कैफे के बारे में बताएं",
    copy: "These details help us understand which cafes can use local visibility support.",
    copyHi: "इन जानकारियों से हमें समझ आता है कि लोकल विजिबिलिटी किस तरह मदद कर सकती है।",
  },
  {
    id: "visibility",
    label: "Visibility",
    hi: "विजिबिलिटी",
    icon: Eye,
    title: "How do people find you today?",
    titleHi: "आज लोग आपको कैसे ढूंढते हैं?",
    copy: "Choose the channels and challenge that feel closest to your current situation.",
    copyHi: "अपने कैफे की मौजूदा स्थिति के हिसाब से विकल्प चुनें।",
  },
  {
    id: "value",
    label: "Value",
    hi: "वैल्यू",
    icon: ClipboardList,
    title: "What kind of visibility matters?",
    titleHi: "किस तरह की विजिबिलिटी जरूरी है?",
    copy: "SnaflesHub is testing visibility and listing value only, not guaranteed sales.",
    copyHi: "SnaflesHub सिर्फ विजिबिलिटी और लिस्टिंग वैल्यू टेस्ट कर रहा है, बिक्री की गारंटी नहीं।",
  },
  {
    id: "pricing",
    label: "Pricing",
    hi: "कीमत",
    icon: IndianRupee,
    title: "What monthly listing price feels fair?",
    titleHi: "कौन-सी मासिक लिस्टिंग कीमत ठीक लगेगी?",
    copy: "Assume the service helps your cafe become more visible to nearby customers.",
    copyHi: "मानकर चलें कि सर्विस आपके कैफे को आस-पास के ग्राहकों के लिए ज्यादा visible बनाती है।",
  },
  {
    id: "pilot",
    label: "Pilot",
    hi: "पायलट",
    icon: Send,
    title: "Would you join an early pilot?",
    titleHi: "क्या आप शुरुआती पायलट में जुड़ना चाहेंगे?",
    copy: "Final answer. We will use this only to understand cafe interest.",
    copyHi: "आखिरी जवाब। हम इसे सिर्फ कैफे owners की रुचि समझने के लिए इस्तेमाल करेंगे।",
  },
];

function FieldLabel({ children, hi }) {
  return (
    <span className="cafe-study-label">
      <span>{children}</span>
      <small>{hi}</small>
    </span>
  );
}

function OptionButton({ option, selected, onClick, multi = false }) {
  return (
    <button
      className={`cafe-option ${selected ? "is-selected" : ""}`}
      type="button"
      aria-pressed={selected}
      onClick={() => onClick(option.value)}
    >
      <span className="cafe-option__check">{selected ? "✓" : multi ? "+" : ""}</span>
      <span>
        <strong>{option.label}</strong>
        <small>{option.hi}</small>
      </span>
    </button>
  );
}

function CafeStudy() {
  const [values, setValues] = useState(initialValues);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  useDocumentTitle("Cafe Visibility Survey");

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const progress = useMemo(() => Math.round(((currentStep + 1) / steps.length) * 100), [currentStep]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setError(null);
  }

  function setSingle(name, value) {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setError(null);
  }

  function toggleMulti(name, value) {
    setValues((currentValues) => {
      const currentList = currentValues[name] || [];
      const nextList = currentList.includes(value) ? currentList.filter((item) => item !== value) : [...currentList, value];

      return { ...currentValues, [name]: nextList };
    });
    setError(null);
  }

  function getStepError(stepIndex = currentStep) {
    if (stepIndex === 0) {
      if (!values.cafeName.trim()) return "Enter the cafe name.";
      if (!values.ownerName.trim()) return "Enter the owner or manager name.";
      if (!isValidPhone(values.phone)) return "Enter a valid WhatsApp or phone number.";
      if (!values.area.trim()) return "Enter the cafe area or location.";
      if (!values.cafeType) return "Choose the cafe type.";
    }

    if (stepIndex === 1) {
      if (!values.customerSources.length) return "Choose how customers currently find you.";
      if (!values.biggestChallenge) return "Choose the biggest visibility challenge.";
      if (!values.onlinePresence.length) return "Choose your current online presence.";
    }

    if (stepIndex === 2) {
      if (!values.usefulFeatures.length) return "Choose at least one useful visibility feature.";
      if (!values.topFeature) return "Choose the one visibility feature that matters most.";
    }

    if (stepIndex === 3) {
      if (!values.monthlyPrice) return "Choose one monthly price option.";
      if (!values.paymentComfort.length) return "Choose what would make payment comfortable.";
    }

    if (stepIndex === 4) {
      if (!values.pilotInterest) return "Choose your pilot interest.";
      if (!values.contactMethod) return "Choose a preferred contact method.";
    }

    return "";
  }

  function showStepError(message) {
    setError({
      title: "Please review this step",
      message,
    });
  }

  function goNext() {
    const message = getStepError();

    if (message) {
      showStepError(message);
      return;
    }

    setCurrentStep((nextStep) => Math.min(steps.length - 1, nextStep + 1));
    setError(null);
  }

  function goBack() {
    setCurrentStep((nextStep) => Math.max(0, nextStep - 1));
    setError(null);
  }

  async function submitSurvey(event) {
    event.preventDefault();
    const message = getStepError();

    if (message) {
      showStepError(message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/api/cafe-study", {
        ...values,
        pageVersion: "cafe-study-v1",
        languageMode: "en-hi-inline",
      });
      setIsComplete(true);
    } catch (submissionError) {
      setError({
        title: "We could not submit the survey",
        message: submissionError?.response?.data?.message || "Please check the details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="page cafe-study-page">
        <section className="cafe-study-thanks">
          <div className="cafe-study-thanks__panel">
            <CheckCircle2 size={56} aria-hidden="true" />
            <span className="cafe-study-eyebrow">Survey received / सर्वे प्राप्त हुआ</span>
            <h1>Thank you for your valuable advice.</h1>
            <p>
              Your input will help us shape the SnaflesHub cafe visibility pilot.
              <span> आपकी सलाह से हम कैफे विजिबिलिटी पायलट को बेहतर बना पाएंगे।</span>
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page cafe-study-page">
      <section className="cafe-study-hero">
        <div className="cafe-study-hero__content">
          <span className="cafe-study-eyebrow">Cafe visibility study / कैफे विजिबिलिटी सर्वे</span>
          <h1>Take part in a 3-minute cafe survey.</h1>
          <p>
            Help us understand whether cafe owners would pay for better listing visibility on SnaflesHub.
            <span> यह सर्वे बिक्री की गारंटी नहीं देता, सिर्फ visibility और listing value को समझने के लिए है।</span>
          </p>
        </div>
        <div className="cafe-study-hero__note" aria-label="Survey promise">
          <strong>No sales promise</strong>
          <span>Visibility and listing research only.</span>
        </div>
      </section>

      <section className="cafe-study-shell" aria-label="Cafe survey">
        <aside className="cafe-study-progress">
          <div className="cafe-study-progress__bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <ol>
            {steps.map((item, index) => (
              <li className={index === currentStep ? "is-active" : index < currentStep ? "is-complete" : ""} key={item.id}>
                <span>{index + 1}</span>
                <strong>{item.label}</strong>
                <small>{item.hi}</small>
              </li>
            ))}
          </ol>
        </aside>

        <form className="cafe-study-card" onSubmit={submitSurvey}>
          <header className="cafe-study-card__header">
            <span className="cafe-study-card__icon">
              <StepIcon size={24} aria-hidden="true" />
            </span>
            <div>
              <span className="cafe-study-step-count">Step {currentStep + 1} of {steps.length}</span>
              <h2>{step.title}</h2>
              <p>
                {step.copy}
                <span>{step.copyHi}</span>
              </p>
            </div>
          </header>

          {error ? <SystemAlert tone="danger" title={error.title} message={error.message} /> : null}

          {currentStep === 0 ? (
            <div className="cafe-study-fields">
              <label className="cafe-study-field">
                <FieldLabel hi="कैफे का नाम">Cafe name</FieldLabel>
                <input name="cafeName" value={values.cafeName} onChange={updateField} placeholder="Brew Corner Cafe" />
              </label>
              <label className="cafe-study-field">
                <FieldLabel hi="मालिक या मैनेजर का नाम">Owner/manager name</FieldLabel>
                <input name="ownerName" value={values.ownerName} onChange={updateField} placeholder="Owner name" />
              </label>
              <label className="cafe-study-field">
                <FieldLabel hi="व्हाट्सऐप या फोन नंबर">WhatsApp or phone</FieldLabel>
                <input name="phone" value={values.phone} onChange={updateField} inputMode="tel" placeholder="98765 43210" />
              </label>
              <label className="cafe-study-field">
                <FieldLabel hi="एरिया या लोकेशन">Area/location</FieldLabel>
                <input name="area" value={values.area} onChange={updateField} placeholder="Sector 17, Chandigarh" />
              </label>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="कैफे का प्रकार">Cafe type</FieldLabel>
                <div className="cafe-study-options">
                  {cafeTypes.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.cafeType === option.value} onClick={(value) => setSingle("cafeType", value)} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="cafe-study-fields">
              <div className="cafe-study-choice-group">
                <FieldLabel hi="ग्राहक अभी आपको कैसे ढूंढते हैं?">How do customers currently find you?</FieldLabel>
                <div className="cafe-study-options">
                  {customerSources.map((option) => (
                    <OptionButton key={option.value} option={option} multi selected={values.customerSources.includes(option.value)} onClick={(value) => toggleMulti("customerSources", value)} />
                  ))}
                </div>
              </div>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="सबसे बड़ा चैलेंज">Biggest visibility challenge</FieldLabel>
                <div className="cafe-study-options">
                  {challenges.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.biggestChallenge === option.value} onClick={(value) => setSingle("biggestChallenge", value)} />
                  ))}
                </div>
              </div>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="आपकी ऑनलाइन मौजूदगी">Current online presence</FieldLabel>
                <div className="cafe-study-options">
                  {onlinePresence.map((option) => (
                    <OptionButton key={option.value} option={option} multi selected={values.onlinePresence.includes(option.value)} onClick={(value) => toggleMulti("onlinePresence", value)} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="cafe-study-fields">
              <div className="cafe-study-choice-group">
                <FieldLabel hi="कौन-सी चीजें उपयोगी लगती हैं?">Which visibility features feel useful?</FieldLabel>
                <div className="cafe-study-options">
                  {visibilityFeatures.map((option) => (
                    <OptionButton key={option.value} option={option} multi selected={values.usefulFeatures.includes(option.value)} onClick={(value) => toggleMulti("usefulFeatures", value)} />
                  ))}
                </div>
              </div>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="सबसे जरूरी फीचर">Most important visibility feature</FieldLabel>
                <div className="cafe-study-options">
                  {visibilityFeatures.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.topFeature === option.value} onClick={(value) => setSingle("topFeature", value)} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="cafe-study-fields">
              <div className="cafe-study-choice-group">
                <FieldLabel hi="मासिक लिस्टिंग कीमत">Fair monthly listing price</FieldLabel>
                <div className="cafe-study-options cafe-study-options--price">
                  {monthlyPrices.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.monthlyPrice === option.value} onClick={(value) => setSingle("monthlyPrice", value)} />
                  ))}
                </div>
              </div>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="भुगतान करने में किससे भरोसा बढ़ेगा?">What would make payment comfortable?</FieldLabel>
                <div className="cafe-study-options">
                  {paymentComfort.map((option) => (
                    <OptionButton key={option.value} option={option} multi selected={values.paymentComfort.includes(option.value)} onClick={(value) => toggleMulti("paymentComfort", value)} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="cafe-study-fields">
              <div className="cafe-study-choice-group">
                <FieldLabel hi="क्या आप पायलट में रुचि रखते हैं?">Would you join an early pilot?</FieldLabel>
                <div className="cafe-study-options">
                  {pilotInterest.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.pilotInterest === option.value} onClick={(value) => setSingle("pilotInterest", value)} />
                  ))}
                </div>
              </div>
              <div className="cafe-study-choice-group">
                <FieldLabel hi="संपर्क का पसंदीदा तरीका">Preferred contact method</FieldLabel>
                <div className="cafe-study-options">
                  {contactMethods.map((option) => (
                    <OptionButton key={option.value} option={option} selected={values.contactMethod === option.value} onClick={(value) => setSingle("contactMethod", value)} />
                  ))}
                </div>
              </div>
              <label className="cafe-study-field">
                <FieldLabel hi="कोई सलाह या कमेंट">Optional comment</FieldLabel>
                <textarea name="comment" value={values.comment} onChange={updateField} placeholder="Tell us what would make a visibility listing useful for your cafe." />
              </label>
            </div>
          ) : null}

          <footer className="cafe-study-actions">
            <button className="cafe-study-button cafe-study-button--ghost" type="button" onClick={goBack} disabled={currentStep === 0 || isSubmitting}>
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </button>
            {currentStep < steps.length - 1 ? (
              <button className="cafe-study-button cafe-study-button--primary" type="button" onClick={goNext}>
                Next
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button className="cafe-study-button cafe-study-button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit survey"}
                <Send size={18} aria-hidden="true" />
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}

export default CafeStudy;
