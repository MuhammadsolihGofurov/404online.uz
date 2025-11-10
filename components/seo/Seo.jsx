import Head from "next/head";

const Seo = ({
  children,
  title = "New title",
  description = "New Description",
  keywords = "New Keywords",
  link = "https://404onlineuz.vercel.app/",
}) => {
  return (
    <Head>
      <meta name="keywords" content={keywords} />
      <meta name="description" content={description} />
      <title>{title}</title>

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={link} />
      <meta property="og:site_name" content="404online.uz" />

      <meta
        property="og:image"
        content="https://404onlineuz.vercel.app/og/cover-1200x630.jpg"
      />
      <meta
        property="og:image:secure_url"
        content="https://404onlineuz.vercel.app/og/cover-1200x630.jpg"
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="404onlineuz platform preview" />

      <meta property="og:locale" content="uz_UZ" />
      <meta property="og:locale:alternate" content="ru_RU" />
      {/* <meta property="og:locale:alternate" content="en_US" /> */}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta
        name="twitter:image"
        content="https://404onlineuz.vercel.app/og/cover-1200x630.jpg"
      />
      <meta name="twitter:site" content="@404onlineuz" />
      <meta name="twitter:creator" content="@404onlineuz" />

      <link rel="canonical" href="https://404onlineuz.vercel.app/" />

      {children}
    </Head>
  );
};

export default Seo;
