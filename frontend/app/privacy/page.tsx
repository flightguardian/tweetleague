'use client';

import { Shield, Mail, Database, Lock, Users, Globe, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgb(98,181,229)]/10 rounded-full mb-4">
          <Shield className="h-8 w-8 text-[rgb(98,181,229)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Privacy Policy
        </h1>
        <p className="text-xl text-gray-600">
          Your privacy is important to us
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: January 2025
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Introduction
        </h2>
        <p className="text-gray-700">
          COV Tweet League ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our football prediction website. We comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Information We Collect */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-sky-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-[rgb(98,181,229)]" />
              Information We Collect
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Account Information:</strong> Username, email address, password (encrypted)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Social Media:</strong> Twitter/X handle and ID (if you sign in with Twitter)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Profile Data:</strong> Avatar/profile picture (if provided via social login)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Usage Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Predictions:</strong> Your match predictions and scores</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Statistics:</strong> Points earned, league positions, prediction accuracy</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Mini Leagues:</strong> Leagues you create or join</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Technical Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Session Data:</strong> Login timestamps and authentication tokens</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span><strong>Communication:</strong> Support messages via Tawk.to chat widget</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-green-600" />
              How We Use Your Information
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To provide and maintain our prediction service</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To manage your account and provide customer support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To track your predictions and calculate points/rankings</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To send match reminders (if you opt-in to email notifications)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To enable participation in mini leagues</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To display public leaderboards and statistics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To verify your email address for account security</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>To comply with legal obligations</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Legal Basis (GDPR) */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Lock className="h-6 w-6 text-purple-600" />
              Legal Basis for Processing (GDPR)
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700 mb-4">We process your personal data under the following legal bases:</p>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Contract:</strong> Processing is necessary to provide our services to you
              </li>
              <li>
                <strong>Consent:</strong> You have given consent for email notifications and marketing
              </li>
              <li>
                <strong>Legitimate Interests:</strong> To improve our service and ensure platform security
              </li>
              <li>
                <strong>Legal Obligations:</strong> To comply with applicable laws and regulations
              </li>
            </ul>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-orange-600" />
              Data Sharing & Disclosure
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Public Information</h3>
              <p className="text-gray-700">The following information is publicly visible:</p>
              <ul className="mt-2 space-y-1 text-gray-700 ml-4">
                <li>• Your username</li>
                <li>• Your predictions (after you submit them)</li>
                <li>• Your points and league position</li>
                <li>• Your participation in mini leagues</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Third-Party Services</h3>
              <p className="text-gray-700">We use the following third-party services:</p>
              <ul className="mt-2 space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-medium mr-2">Twitter/X:</span>
                  <span>For authentication (if you choose Twitter login)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">Tawk.to:</span>
                  <span>For customer support chat</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">Email Service:</span>
                  <span>For sending verification and notification emails</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-indigo-600" />
              Your Rights (GDPR)
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700 mb-4">Under GDPR, you have the following rights:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Access:</strong>
                <span>Request a copy of your personal data</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Rectification:</strong>
                <span>Request correction of inaccurate data</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Erasure:</strong>
                <span>Request deletion of your account and data ("right to be forgotten")</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Portability:</strong>
                <span>Receive your data in a portable format</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Objection:</strong>
                <span>Object to certain processing activities</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Restriction:</strong>
                <span>Request restriction of processing</span>
              </li>
              <li className="flex items-start">
                <strong className="mr-2 text-indigo-600">Withdraw Consent:</strong>
                <span>Withdraw consent for email notifications at any time</span>
              </li>
            </ul>
            
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-700">
                To exercise these rights, you can:
              </p>
              <ul className="mt-2 text-sm text-gray-700">
                <li>• Use the account deletion feature in your <Link href="/profile" className="text-[rgb(98,181,229)] hover:underline">Profile Settings</Link></li>
                <li>• Contact us via the chat widget</li>
                <li>• Email us at the contact address below</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Lock className="h-6 w-6 text-teal-600" />
              Data Security
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700">We implement appropriate security measures to protect your data:</p>
            <ul className="space-y-2 text-gray-700 mt-4">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                <span>Encrypted passwords using industry-standard bcrypt hashing</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                <span>Secure HTTPS connections for all data transmission</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                <span>Regular security updates and monitoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                <span>Limited access to personal data (admin only)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                <span>Secure authentication tokens with expiration</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Data Retention */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-yellow-600" />
              Data Retention
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700">We retain your data as follows:</p>
            <ul className="space-y-2 text-gray-700 mt-4">
              <li>
                <strong>Active Accounts:</strong> Data is retained while your account is active
              </li>
              <li>
                <strong>Predictions & Stats:</strong> Retained for historical league records
              </li>
              <li>
                <strong>Deleted Accounts:</strong> Personal data is immediately and permanently deleted upon account deletion
              </li>
              <li>
                <strong>Email Logs:</strong> Retained for 90 days for security purposes
              </li>
            </ul>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700">
                You can delete your account and all associated data at any time from your Profile Settings.
              </p>
            </div>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-pink-600" />
              Children's Privacy
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700">
              Our service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-gray-600" />
              Cookies & Local Storage
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700">We use cookies and local storage for:</p>
            <ul className="space-y-2 text-gray-700 mt-4">
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>Authentication:</strong> To keep you logged in (30-day sessions)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>Preferences:</strong> To remember your settings</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>Analytics:</strong> Basic usage statistics (no personal data)</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              You can control cookies through your browser settings. Disabling cookies may affect site functionality.
            </p>
          </div>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              Changes to This Privacy Policy
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by:
            </p>
            <ul className="mt-3 space-y-1 text-gray-700">
              <li>• Posting the new Privacy Policy on this page</li>
              <li>• Updating the "Last updated" date at the top</li>
              <li>• Sending an email notification for significant changes</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Contact Us
          </h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="font-semibold">Via Chat:</span>
              <span>Use the chat widget in the bottom right corner</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold">Twitter:</span>
              <span>@covtweetleague</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold">Website:</span>
              <span>COV Tweet League</span>
            </li>
          </ul>
          
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>Data Protection Officer:</strong> For GDPR-related inquiries, you may contact our data protection team through any of the above channels.
            </p>
          </div>
        </section>

        {/* Footer Links */}
        <div className="text-center pt-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/" className="text-[rgb(98,181,229)] hover:underline">
              ← Back to Home
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/how-it-works" className="text-[rgb(98,181,229)] hover:underline">
              How It Works
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/profile" className="text-[rgb(98,181,229)] hover:underline">
              Profile Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}