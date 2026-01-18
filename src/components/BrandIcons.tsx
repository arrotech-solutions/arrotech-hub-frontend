import React from 'react';

// Images
import slackIcon from '../assets/apps/slack.jpg';
import hubspotIcon from '../assets/apps/hub_spot.png';
import whatsappIcon from '../assets/apps/whatsapp.png';
import analyticsIcon from '../assets/apps/google_analytics.png';
import salesforceIcon from '../assets/apps/sales_force.png';
import facebookIcon from '../assets/apps/facebook.png';
import instagramIcon from '../assets/apps/instagram.jpeg';
import twitterIcon from '../assets/apps/twitter.png';
import linkedinIcon from '../assets/apps/linkedin.png';
import mpesaIcon from '../assets/apps/mpesa.png';
import teamsIcon from '../assets/apps/microsoft_teams.png';
import zoomIcon from '../assets/apps/zoom.jpeg';
import asanaIcon from '../assets/apps/asana.png';
import powerBiIcon from '../assets/apps/power_bi.jpg'; // switched to jpg
import airtelIcon from '../assets/apps/airtel.jpg';
import equityIcon from '../assets/apps/equity.jpeg';
import jumiaIcon from '../assets/apps/jumia.png';
import kenyaPowerIcon from '../assets/apps/kenya_power.png';
import kilimallIcon from '../assets/apps/kilimall.png';
import pesapalIcon from '../assets/apps/pesapal.jpeg';
import quickBooksIcon from '../assets/apps/quick_books.jpg';
import sendyIcon from '../assets/apps/sendy.png';
import tKashIcon from '../assets/apps/t_kash.png';
import twigaFoodsIcon from '../assets/apps/twiga_foods.png';
import zohoIcon from '../assets/apps/zoho.jpg';


type IconProps = React.SVGProps<SVGSVGElement> | React.ImgHTMLAttributes<HTMLImageElement> | any;

const ImageLogo = ({ src, alt, ...props }: { src: string, alt: string } & any) => (
    <img
        src={src}
        alt={alt}
        className={`object-contain ${props.className || 'w-full h-full'}`}
        {...props}
    />
);

export const GoogleLogo = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21-1.19-1.63z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const SlackLogo = (props: IconProps) => <ImageLogo src={slackIcon} alt="Slack" {...props} />;

export const HubSpotLogo = (props: IconProps) => <ImageLogo src={hubspotIcon} alt="HubSpot" {...props} />;

export const WhatsAppLogo = (props: IconProps) => <ImageLogo src={whatsappIcon} alt="WhatsApp" {...props} />;

export const AnalyticsLogo = (props: IconProps) => <ImageLogo src={analyticsIcon} alt="Google Analytics" {...props} />;

export const ShopifyLogo = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M21.2 7.7a.8.8 0 00-.9-.5l-4.5 1.2a5.5 5.5 0 00-6.7 0L4.5 7.2a.8.8 0 00-1 .5l-1.3 4.5 1.7 11.1A2.2 2.2 0 006 25h12a2.2 2.2 0 002.1-1.8l1.7-11.1L21.2 7.7zm-9 1.6a1.7 1.7 0 012.3 0L13.1 11l-2.2 11h-1.8L7 11l-1.4-1.7a1.7 1.7 0 012.3 0l2 1.6 2-1.6z" fill="#95BF47" />
        <path d="M12.11 1.767c.797 0 1.48.513 1.72 1.259l-1.72 1.053-1.72-1.053c.24-.746.923-1.259 1.72-1.259z" fill="#95BF47" />
    </svg>
);

export const MPesaLogo = (props: IconProps) => <ImageLogo src={mpesaIcon} alt="M-Pesa" {...props} />;

// Updated Logos
export const AirtelLogo = (props: IconProps) => <ImageLogo src={airtelIcon} alt="Airtel" {...props} />;
export const JumiaLogo = (props: IconProps) => <ImageLogo src={jumiaIcon} alt="Jumia" {...props} />;
export const EquityLogo = (props: IconProps) => <ImageLogo src={equityIcon} alt="Equity Bank" {...props} />;
export const KenyaPowerLogo = (props: IconProps) => <ImageLogo src={kenyaPowerIcon} alt="Kenya Power" {...props} />;
export const KilimallLogo = (props: IconProps) => <ImageLogo src={kilimallIcon} alt="Kilimall" {...props} />;
export const PesapalLogo = (props: IconProps) => <ImageLogo src={pesapalIcon} alt="Pesapal" {...props} />;
export const QuickBooksLogo = (props: IconProps) => <ImageLogo src={quickBooksIcon} alt="QuickBooks" {...props} />;
export const SendyLogo = (props: IconProps) => <ImageLogo src={sendyIcon} alt="Sendy" {...props} />;
export const TKashLogo = (props: IconProps) => <ImageLogo src={tKashIcon} alt="T-Kash" {...props} />;
export const TwigaFoodsLogo = (props: IconProps) => <ImageLogo src={twigaFoodsIcon} alt="Twiga Foods" {...props} />;
export const ZohoLogo = (props: IconProps) => <ImageLogo src={zohoIcon} alt="Zoho" {...props} />;

export const SalesforceLogo = (props: IconProps) => <ImageLogo src={salesforceIcon} alt="Salesforce" {...props} />;

export const FacebookLogo = (props: IconProps) => <ImageLogo src={facebookIcon} alt="Facebook" {...props} />;

export const InstagramLogo = (props: IconProps) => <ImageLogo src={instagramIcon} alt="Instagram" {...props} />;

export const TwitterLogo = (props: IconProps) => <ImageLogo src={twitterIcon} alt="Twitter" {...props} />;

export const LinkedInLogo = (props: IconProps) => <ImageLogo src={linkedinIcon} alt="LinkedIn" {...props} />;

export const StripeLogo = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M13.9 10.3c0-1.3-1.1-2.2-3.4-2.2-2.5 0-4.3.8-4.3.8l-.6-2.6S7.2 5.5 10.5 5.5c4.7 0 7 2.4 7 5.8 0 5.8-8 4.7-8 7.2 0 1 1 1.7 3.3 1.7 2.7 0 4.9-1 4.9-1l.7 2.8s-1.8.8-5.6.8c-4.9 0-7.3-2.5-7.3-5.9 0-6.1 8.4-5 8.4-7.6z" fill="#635BFF" />
    </svg>
);

export const MicrosoftTeamsLogo = (props: IconProps) => <ImageLogo src={teamsIcon} alt="Microsoft Teams" {...props} />;

export const ZoomLogo = (props: IconProps) => <ImageLogo src={zoomIcon} alt="Zoom" {...props} />;

export const AsanaLogo = (props: IconProps) => <ImageLogo src={asanaIcon} alt="Asana" {...props} />;

export const PowerBILogo = (props: IconProps) => <ImageLogo src={powerBiIcon} alt="Power BI" {...props} />;
