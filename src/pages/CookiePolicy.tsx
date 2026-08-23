import React from 'react';
import SEO from '../components/SEO';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="Cookie Policy" 
        description="Learn how Arrotech Solutions uses cookies and similar technologies on Arrotech Hub."
        url="/cookies"
      />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-secondary-800 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-secondary-700 transition-colors">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
          Cookie Policy
        </h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-slate-600 dark:text-slate-400 mb-8">
            Last updated: August 23, 2026
          </p>

          <p>
            This Cookie Policy explains how Arrotech Solutions ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit Arrotech Hub (our "Website" or "App"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">What are cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, Arrotech Solutions) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies".
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">Why do we use cookies?</h2>
          <p>
            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for Arrotech Hub to operate, and we refer to these as "essential" or "strictly necessary" cookies. For example, we use HttpOnly cookies to securely store your authentication tokens and keep you logged into the workspace.
          </p>
          
          <h3 className="text-xl font-bold mt-8 mb-3 text-slate-900 dark:text-white">Essential Cookies</h3>
          <p>
            These cookies are strictly necessary to provide you with services available through our App and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the App, you cannot refuse them without impacting how our App functions.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-3 text-slate-900 dark:text-white">Performance and Functionality Cookies</h3>
          <p>
            These cookies are used to enhance the performance and functionality of our App but are non-essential to their use. However, without these cookies, certain functionality (like remembering your dark mode preference) may become unavailable.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">How can I control cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website (like logging in) will be severely restricted.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">Updates to this Policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">Contact Us</h2>
          <p>
            If you have any questions about our use of cookies or other technologies, please contact us via our Support page.
          </p>
        </div>
      </div>
    </div>
  );
}
