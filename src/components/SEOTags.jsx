import { useEffect } from 'react';

export default function SEOTags({ title, description, image, url, type = 'website' }) {
  const siteName = 'Keyzo.pro';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Keyzo.pro — маркетплейс игровых ключей, подписок и цифровых товаров. Быстрая доставка, безопасные сделки.';
  const metaDesc = description || defaultDescription;
  const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const metaImage = image || '';

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', metaDesc);
    setMeta('og:title', fullTitle);
    setMeta('og:description', metaDesc);
    setMeta('og:type', type);
    setMeta('og:site_name', siteName);
    if (metaUrl) setMeta('og:url', metaUrl);
    if (metaImage) setMeta('og:image', metaImage);

    setMeta('twitter:card', metaImage ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', metaDesc);
    if (metaImage) setMeta('twitter:image', metaImage);

    return () => {
      document.title = siteName;
    };
  }, [fullTitle, metaDesc, metaUrl, metaImage, type]);

  return null;
}
