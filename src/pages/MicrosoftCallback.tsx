import React, { useEffect } from 'react';
import { Spinner } from '../components/ui';

/**
 * Microsoft OAuth Callback Page
 * This page handles the redirect from Microsoft after authentication.
 * It simply displays a message while the parent window processes the token.
 */
const MicrosoftCallback: React.FC = () => {
    useEffect(() => {
        // This page is opened in a popup and the parent window will read the URL hash
        // containing the access token. We just need to keep the page open briefly.

        // If this page is somehow accessed directly (not in popup), redirect to login
        if (!window.opener) {
            window.location.href = '/login';
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Spinner size="xl" className="mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Completing sign in...</h2>
                <p className="text-gray-500 mt-2">Please wait while we authenticate you.</p>
            </div>
        </div>
    );
};

export default MicrosoftCallback;
