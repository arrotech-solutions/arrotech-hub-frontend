import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Injects noindex/nofollow meta tag into the head.
 * Used on all authenticated pages to prevent search engine indexing.
 */
const NoIndex: React.FC = () => (
    <Helmet>
        <meta name="robots" content="noindex, nofollow" />
    </Helmet>
);

export default NoIndex;
