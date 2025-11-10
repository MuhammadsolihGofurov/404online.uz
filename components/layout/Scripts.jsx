import Script from "next/script";

const Scripts = ({ settings }) => {
   return (
      <>
         {/* Google tag (gtag.js) */}
         <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_code}`}
         ></Script>
         <Script id="gtag">
            {`window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${settings.google_analytics_code}')`}
         </Script>

         {/* Yandex.Metrika counter */}
         <Script id="yandex-metrika">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   var z = null;m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(${settings.yandex_metrika_code}, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   })`}
         </Script>

         {/* Facebook Pixel Code */}
         <Script id="facebook-pixel">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${settings.facebook_pixel_code}');
fbq('track', 'PageView')`}
         </Script>

         {/* Google Tag Manager */}
         <Script id="google-tag-manager">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MLW6T4V');`}
         </Script>

         {/* Google Tag Manager (noscript) 
         <noscript>
            <iframe
               src="https://www.googletagmanager.com/ns.html?id=GTM-MLW6T4V"
               height="0"
               width="0"
               style="display:none;visibility:hidden"
            ></iframe>
         </noscript> */}
      </>
   );
};

export default Scripts;
