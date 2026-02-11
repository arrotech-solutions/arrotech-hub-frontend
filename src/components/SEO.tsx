import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  name?: string;
  type?: string;
  url?: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
  schema?: Record<string, any>;
}

const BASE_URL = 'https://hub.arrotechsolutions.com';

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  name = 'Arrotech Hub',
  type = 'website',
  url,
  image = `${BASE_URL}/favicon.png`,
  keywords = [],
  noindex = false,
  schema
}) => {
  // Build the canonical URL
  const canonicalUrl = url
    ? (url.startsWith('http') ? url : `${BASE_URL}${url}`)
    : BASE_URL;

  // Build the display title — if it already contains "Arrotech Hub", don't append
  const displayTitle = title.includes('Arrotech Hub')
    ? title
    : `${title} | Arrotech Hub`;

  // Default schema: SoftwareApplication (used when no page-specific schema is provided)
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": description,
    "url": BASE_URL,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{displayTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={name} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
}

export default SEO;
