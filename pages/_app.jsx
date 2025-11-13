import { Provider, useDispatch } from "react-redux";
import "../public/styles/nprogress.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import store from "../redux/store/store";
import { Layout } from "../components";
import messages_uz from "../lang/uz.json";
import messages_ru from "../lang/ru.json";
import { IntlProvider } from "react-intl";
import { LangProvider } from "../context/useLang";
import { useState } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import NProgress from "nprogress";
import { initCollapse } from "../utils/collapse";
import "react-loading-skeleton/dist/skeleton.css";
import "@fancyapps/ui/dist/fancybox.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { Bounce, Flip, ToastContainer } from "react-toastify";
import { ModalProvider } from "@/context/modal-context";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [locale, setLocale] = useState(router.locale);
  const [texts, setTexts] = useState({});

  const messages = {
    ru: messages_ru,
    uz: messages_uz,
  };

  useEffect(() => {
    try {
      const handleStart = () => NProgress.start();
      const handleStop = () => NProgress.done();

      router.events.on("routeChangeStart", handleStart);
      router.events.on("routeChangeComplete", handleStop);
      router.events.on("routeChangeError", handleStop);

      initCollapse();

      return () => {
        router.events.off("routeChangeStart", handleStart);
        router.events.off("routeChangeComplete", handleStop);
        router.events.off("routeChangeError", handleStop);
      };
    } catch (error) {
      console.error("Error initializing collapse:", error);
    }
  }, [router]);

  // useEffect(() => {
  //   setLocale(router.locale);
  //   AOS.init({
  //     duration: 300,
  //   });
  //   AOS.refresh();
  // }, [router.locale]);

  return (
    <Provider store={store}>
      <IntlProvider
        locale={router.locale}
        defaultLocale={router.defaultLocale}
        messages={{ ...texts, ...messages[router.locale] }}
        // remove
        onError={() => null}
      >
        <LangProvider>
          <SkeletonTheme>
            <ModalProvider>
              <Layout>
                <Component {...pageProps} />

                {/* modals */}
                {/* <ConfirmModal /> */}
                {/* <PaymentModal /> */}
              </Layout>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                draggable
                theme="light"
                transition={Flip}
              />
            </ModalProvider>
          </SkeletonTheme>
        </LangProvider>
      </IntlProvider>
    </Provider>
  );
}
