import Document, { Html, Head, Main, NextScript } from "next/document";
import nextConfig from "../next.config";

class MyDocument extends Document {
  render() {
    const currentLocale =
      this.props.__NEXT_DATA__.locale || nextConfig.i18n.defaultLocale;

    return (
      <Html lang={currentLocale}>
        <Head></Head>
        <body>
          <Main />
          <noscript
            dangerouslySetInnerHTML={{
              __html:
                '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MLW6T4V" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
            }}
          ></noscript>
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
