import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import wordList from "../lang/ru.json";
import axios, { authAxios } from "../utils/axios";

const LangContext = createContext({});

export const LangProvider = ({ children }) => {
  const { locale, asPath } = useRouter();
  const [staticWords, setStaticWords] = useState(null);
  const [langUrls, setLangUrls] = useState();

  useEffect(() => {
    localStorage.setItem("locale", locale);
    authAxios.defaults.headers["Accept-Language"] = locale;
    axios.defaults.headers["Accept-Language"] = locale;
  }, [locale]);

  useEffect(() => {
    setLangUrls(null);
  }, [asPath]);

  const intl = useIntl();
  useEffect(() => {
    for (let word in wordList) {
      setStaticWords((prev) => ({
        ...prev,
        [word]: intl.formatMessage({ id: word }),
      }));
    }
  }, [locale, intl]);

  return (
    <LangContext.Provider
      value={{
        ...staticWords,
        langUrls,
        setLangUrls,
      }}
    >
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
