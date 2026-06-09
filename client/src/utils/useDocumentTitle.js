import { useEffect } from "react";

const appName = "SnaflesHub";

function formatTitle(title) {
  if (!title) {
    return appName;
  }

  return `${title} | ${appName}`;
}

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = formatTitle(title);
  }, [title]);
}
