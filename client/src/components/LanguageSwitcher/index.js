import { ChevronDown, Globe2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./LanguageSwitcher.css";

function LanguageSwitcher({ className = "" }) {
  const { language, languages, setLanguage, t } = useLanguage();

  return (
    <label className={`language-switcher ${className}`} title={`${languages.en.nativeLabel} / ${languages.pa.nativeLabel}`}>
      <Globe2 size={17} aria-hidden="true" />
      <span className="language-switcher__text">
        <span>{languages[language].shortLabel}</span>
        <span>{languages[language].nativeLabel}</span>
      </span>
      <select
        aria-label={t("common.selectLanguage")}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {Object.values(languages).map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

export default LanguageSwitcher;
