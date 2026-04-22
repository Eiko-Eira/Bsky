import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

function CloseButton() {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => {
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }} 
      className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-all"
      aria-label="Close"
    >
      <X size={24} />
    </button>
  );
}

export function AboutUs() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative border border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[80vh] overflow-y-auto">
      <CloseButton />
      <h1 className="text-4xl font-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">About Us</h1>
      <div className="font-mono text-gray-800 space-y-4">
        <p>Welcome to BSkyTools, the premier automation toolkit for the Bluesky social network.</p>
        <p>We are a small, independent team of developers who believe in the power of open social protocols. Our goal is to provide creators, artists, and community managers with isolated, secure, and intuitive tools that enhance their ability to connect with their audience without spending all day scrolling.</p>
        <p>By leveraging secure AES-256 cloud encryption and localized AWS instances, we ensure that your credentials remain entirely safe while our engine works tirelessly in the background on your behalf.</p>
      </div>
    </motion.div>
  );
}

export function PrivacyPolicy() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative border border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[80vh] overflow-y-auto">
      <CloseButton />
      <h1 className="text-4xl font-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">Privacy Policy</h1>
      <div className="font-mono text-gray-800 space-y-4 text-sm">
        <p><strong>Last Updated: {new Date().getFullYear()}</strong></p>
        <p>Your privacy is critically important to us. At BSkyTools, we adhere to the following fundamental principles:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Data Isolation:</strong> Your application passwords are encrypted using AES-256 before ever being stored in our database. We cannot read your passwords.</li>
          <li><strong>Information Collection:</strong> We only collect the minimal amount of information required to operate your automated agent (email address for login, Bluesky handle, and monitored keywords).</li>
          <li><strong>Third-Party Sharing:</strong> We absolutely do not sell, rent, or share your personal information or monitored keywords with third parties. Your data is strictly used to query the Bluesky AT Protocol firehose.</li>
          <li><strong>Analytics:</strong> We may collect generic, anonymized telemetry (e.g., node uptime, API failure rates) to ensure our servers remain stable.</li>
          <li><strong>Account Deletion:</strong> You have the absolute right to delete your bot instances at any time, which immediately expunges your encrypted credentials and keyword associations from our active database.</li>
        </ul>
        <p>If you have questions about deleting or correcting your personal data, please disconnect your bots via the dashboard.</p>
      </div>
    </motion.div>
  );
}

export function TermsOfService() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative border border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[80vh] overflow-y-auto">
      <CloseButton />
      <h1 className="text-4xl font-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">Terms of Service</h1>
      <div className="font-mono text-gray-800 space-y-4 text-sm">
        <p><strong>1. Acceptance of Terms</strong><br/>By accessing or using BSkyTools, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the service.</p>
        
        <p><strong>2. Disclaimer of Warranties; "AS IS"</strong><br/>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. BSKYTOOLS MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT BOT ACTIONS WILL BE INSTANTANEOUS OR UNINTERRUPTED.</p>
        
        <p><strong>3. Limitation of Liability</strong><br/>IN NO EVENT SHALL BSKYTOOLS OR ITS SUPPLIERS BE LIABLE FOR ANY DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF DATA, ACCOUNT SUSPENSION, OR LOST PROFITS) ARISING OUT OF THE USE OR INABILITY TO USE THE SERVICE. You specifically acknowledge that utilizing automated tooling on third-party social networks carries inherent risks of account restriction or banning by the network operator (Bluesky PBLLC).</p>
        
        <p><strong>4. User Responsibilities & Acceptable Use</strong><br/>You agree to use BSkyTools in strict compliance with the official Bluesky Terms of Service and Community Guidelines. You shall not use this service to:
        <br/>- Spam, harass, or artificially inflate metrics in a malicious manner.
        <br/>- Scrape user data for unauthorized secondary usage.
        <br/>We reserve the right to immediately terminate any bot instance or user account that generates excessive API errors or violates the spirit of the AT Protocol.</p>
        
        <p><strong>5. Fair Use & Rate Limiting</strong><br/>To maintain server health for all users, bots are restricted to a maximum 10-hour daily active limit. We reserve the right to pause or throttle accounts that consume disproportionate infrastructure resources.</p>
      </div>
    </motion.div>
  );
}
