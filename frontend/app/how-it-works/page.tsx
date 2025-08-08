'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, Target, Users, Calendar, Award, ArrowRight, 
  CheckCircle, Star, TrendingUp, Clock, Mail, Twitter,
  Shield, Zap, ChevronDown, ChevronUp, Home, HelpCircle,
  Smartphone, Globe, Bell, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          How Tweet League Works
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your guide to predicting Coventry City matches and competing with fellow Sky Blues fans
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Zap className="mr-3 h-8 w-8" />
          Quick Start Guide
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start">
            <div className="bg-white/20 p-2 rounded-lg mr-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Sign Up</h3>
              <p className="text-white/90">Create your free account with email or social login</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-white/20 p-2 rounded-lg mr-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Make Predictions</h3>
              <p className="text-white/90">Predict the score before kickoff</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-white/20 p-2 rounded-lg mr-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Earn Points</h3>
              <p className="text-white/90">Climb the leaderboard with accurate predictions</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-[rgb(98,181,229)] hover:bg-gray-100">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        {/* Getting Started */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-sky-50">
            <h2 className="text-2xl font-bold flex items-center">
              <Users className="mr-3 h-6 w-6 text-[rgb(98,181,229)]" />
              Getting Started
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Create Your Account</h3>
                <p className="text-gray-600">
                  Sign up using your email address or quickly join with your Twitter or Google account. 
                  It's completely free and takes less than a minute!
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Verify Your Email</h3>
                <p className="text-gray-600">
                  Check your inbox for a verification link. This helps us keep the league secure and enables 
                  you to receive match reminders (if you want them).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Twitter className="h-5 w-5 text-[rgb(98,181,229)] mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Optional: Add Your Twitter Handle</h3>
                <p className="text-gray-600">
                  Connect your Twitter handle in your profile to import any historical predictions and 
                  share your successes with the Sky Blues community.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Making Predictions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-2xl font-bold flex items-center">
              <Target className="mr-3 h-6 w-6 text-green-600" />
              Making Predictions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-gray-500" />
                  When to Predict
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-[rgb(98,181,229)] mr-2">•</span>
                    Predictions open when fixtures are announced
                  </li>
                  <li className="flex items-start">
                    <span className="text-[rgb(98,181,229)] mr-2">•</span>
                    You can only predict the next upcoming match
                  </li>
                  <li className="flex items-start">
                    <span className="text-[rgb(98,181,229)] mr-2">•</span>
                    Deadline is 5 minutes before kickoff
                  </li>
                  <li className="flex items-start">
                    <span className="text-[rgb(98,181,229)] mr-2">•</span>
                    You can change your prediction until the deadline
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <Smartphone className="mr-2 h-5 w-5 text-gray-500" />
                  How to Predict
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">1.</span>
                    Visit the home page or click "Predict Now"
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">2.</span>
                    Enter your predicted score for both teams
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">3.</span>
                    Click "Submit Prediction"
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">4.</span>
                    Get confirmation and wait for the match!
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700">
                <strong className="text-yellow-800">💡 Pro Tip:</strong> Check team news and recent form 
                on the official Coventry City website before making your prediction. Knowledge is power!
              </p>
            </div>
          </div>
        </div>

        {/* Scoring System */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold flex items-center">
              <Trophy className="mr-3 h-6 w-6 text-purple-600" />
              Scoring System
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-yellow-50 rounded-xl border-2 border-yellow-300">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Perfect Score</h3>
                <p className="text-3xl font-bold text-yellow-600 mb-2">3 Points</p>
                <p className="text-sm text-gray-600">
                  Predict the exact scoreline correctly
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Example: You predict 2-1, result is 2-1
                </p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-300">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Correct Result</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">1 Point</p>
                <p className="text-sm text-gray-600">
                  Predict the winner or draw correctly
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Example: You predict 2-0, result is 3-1 (both wins)
                </p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-gray-300">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Wrong Result</h3>
                <p className="text-3xl font-bold text-gray-600 mb-2">0 Points</p>
                <p className="text-sm text-gray-600">
                  Wrong outcome prediction
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Example: You predict 2-1, result is 0-1
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                League Position
              </h4>
              <p className="text-gray-700 text-sm">
                Your position is determined by total points. In case of a tie, the player with more 
                perfect predictions (3-pointers) ranks higher. Keep predicting to climb the table!
              </p>
            </div>
          </div>
        </div>

        {/* Features & Benefits */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50">
            <h2 className="text-2xl font-bold flex items-center">
              <Gift className="mr-3 h-6 w-6 text-orange-600" />
              Features & Benefits
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Globe className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Global Community</h4>
                    <p className="text-sm text-gray-600">
                      Connect with Sky Blues fans worldwide
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Bell className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Match Reminders</h4>
                    <p className="text-sm text-gray-600">
                      Optional email alerts so you never miss a prediction
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Award className="h-5 w-5 text-purple-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Monthly Champions</h4>
                    <p className="text-sm text-gray-600">
                      Special recognition for top monthly performers
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-red-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Fair Play</h4>
                    <p className="text-sm text-gray-600">
                      One prediction per match, no advantages
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Smartphone className="h-5 w-5 text-indigo-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Mobile Friendly</h4>
                    <p className="text-sm text-gray-600">
                      Predict on the go from any device
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Season Championships</h4>
                    <p className="text-sm text-gray-600">
                      Compete for the ultimate season crown
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50">
            <h2 className="text-2xl font-bold flex items-center">
              <HelpCircle className="mr-3 h-6 w-6 text-teal-600" />
              Frequently Asked Questions
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              {
                q: "Is Tweet League free to play?",
                a: "Yes! Tweet League is completely free. No hidden costs, no premium tiers - just pure prediction fun for all Sky Blues fans."
              },
              {
                q: "Can I change my prediction after submitting?",
                a: "Yes, you can update your prediction as many times as you want until 5 minutes before kickoff. Only your latest prediction counts."
              },
              {
                q: "What happens if a match is postponed?",
                a: "If a match is postponed, all predictions remain valid and will be scored when the match is eventually played. You cannot change your prediction once the original deadline has passed."
              },
              {
                q: "Can I see other people's predictions?",
                a: "Predictions become visible to everyone after the deadline (5 minutes before kickoff). This keeps things fair and exciting!"
              },
              {
                q: "How do I get match reminders?",
                a: "Enable email notifications in your profile settings. We'll send you a friendly reminder before each match deadline."
              },
              {
                q: "What competitions are included?",
                a: "All Coventry City matches including Championship, FA Cup, League Cup, and playoff games are included in Tweet League."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(`faq-${index}`)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center text-left"
                >
                  <span className="font-medium">{faq.q}</span>
                  {expandedSection === `faq-${index}` ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSection === `faq-${index}` && (
                  <div className="px-4 py-3 bg-white">
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <Users className="mr-2 h-5 w-5 text-gray-600" />
            Community Spirit
          </h3>
          <p className="text-gray-700 mb-4">
            Tweet League is built by Sky Blues fans, for Sky Blues fans. We're all here to enjoy 
            the beautiful game and support our team. Win or lose, let's keep it friendly and respectful!
          </p>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            No gambling • No fees • Just predictions and pride
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Predicting?</h2>
          <p className="text-gray-600 mb-6">
            Join the Tweet League community and show off your Sky Blues knowledge!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}