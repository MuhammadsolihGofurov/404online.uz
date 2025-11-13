import i18nextConfig from "../../next.config";
import Head from "next/head";
import Script from "next/script";
import { Footer, Header, Scripts } from "..";
import useSWR from "swr";
import fetcher from "../../utils/fetcher";
import { useRouter } from "next/router";

const Layout = ({ children }) => {
  // const { data: settings } = useSWR("/settings", fetcher);
  const router = useRouter();

  return (
    <>
      <Head>
        {/* meta tags */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="author" content="Idea.uz" />
        <meta name="robots" content="index, follow, noodp" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <meta name="format-detection" content="telephone=no" />

        {/* favicon */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/img/icons/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/img/icons/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/img/icons/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/img/icons/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/img/icons/favicon/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <link rel="shortcut icon" href="/img/icons/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#ffc40d" />
        <meta
          name="msapplication-config"
          content="/img/icons/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#ffffff"></meta>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />

        {/* href lang */}
        {i18nextConfig.i18n.locales.map((locale, i) => {
          return (
            <link
              key={i}
              rel="alternate"
              hrefLang={locale}
              href="https://api.404online.uz"
            />
          );
        })}
      </Head>

      {/* Body */}
      <div className="wrapper">
        {router?.asPath?.startsWith("/dashboard") ?? <p>salom</p>}
        <div className="content-wrapper">{children}</div>
      </div>

      {/* {settings && <Scripts settings={settings} />} */}
    </>
  );
};

export default Layout;
