// Google Identity Services types
interface GoogleAccountsId {
    initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
        element: HTMLElement | null,
        options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            width?: string | number;
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
        }
    ) => void;
    prompt: () => void;
}

interface GoogleAccounts {
    id: GoogleAccountsId;
}

interface GoogleApi {
    accounts: GoogleAccounts;
}

declare global {
    interface Window {
        google?: GoogleApi;
    }
}

export { };
