// client/src/components/LandingPage.tsx with Waitlist Form
// Import styles at the top
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import WaitlistForm from '../components/WaitlistForm';
import '../mascot-animation.css'; // Import the animation CSS

// Create a Link component that works like react-router's Link but uses wouter
interface LinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}
const Link = ({ href, className = '', children }: LinkProps) => {
  const [_, navigate] = useLocation();
  return (
    <a href={href} className={className} onClick={(e) => {
      e.preventDefault();
      navigate(href);
    }}>
      {children}
    </a>
  );
};

// ZeroCode Logo Component
const ZeroCodeLogo = ({ className = 'h-8' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-2xl font-bold">
        ZeroCode
      </span>
    </div>
  );
};

// ZeroCode Mascot Component with CSS-based animation
const ZeroCodeMascot = ({ className = 'h-64' }) => {
  return (
    <div className={`mascot-container ${className}`}>
      <img 
        src="/Zerocode_onlyzerologo.png" 
        alt="ZeroCode Mascot" 
        className="w-full h-full object-contain mascot-animate"
      />
    </div>
  );
};

// Partner Logos Component
const PartnerLogos = () => {
  const partners = [
    
    { name: 'IIT Guwahati', logo: '/logos/iit-guwahati.png' },
    { name: 'IIT Bombay', logo: '/logos/iit-bombay.png' },
    { name: 'IIT Kanpur', logo: '/logos/iit-kanpur.png' },
    { name: 'SINE IITB', logo: '/logos/sine-iitb.png' },
    { name: 'IIT Delhi', logo: '/logos/iit-delhi.png' },
  ];
  
  return (
    <div className="flex flex-wrap justify-center items-center" style={{ gap: '7rem' }}>
      {partners.map((partner, index) => (
        <div 
          key={index}
          className="h-16 md:h-20 flex items-center justify-center mx-4"
        >
          <img 
            src={partner.logo} 
            alt={partner.name} 
            className="h-full object-contain"
            style={{ maxWidth: '120px' }}
          />
        </div>
      ))}
    </div>
  );
};
// Payment Methods Component
const PaymentMethods = () => {
  const methods = ['Visa', 'Mastercard', 'PayPal', 'ApplePay', 'GooglePay'];
  
  return (
    <div className="flex space-x-2">
      {methods.map((method, index) => (
        <div key={index} className="bg-gray-100 rounded px-2 py-1 text-xs font-medium text-gray-700">
          {method}
        </div>
      ))}
    </div>
  );
};

// Testimonials
const testimonials = [
  {
    stars: 5,
    name: 'Sarah M.',
    verified: true,
    text: '"I\'m blown away by the quality and style of the clothes I received from Shopico. From casual wear to elegant dresses, every piece I\'ve bought has exceeded my expectations."'
  },
  {
    stars: 5,
    name: 'Alex K.',
    verified: true,
    text: '"Finding clothes that align with my personal style used to be a challenge until I discovered Shopico. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions."'
  },
  {
    stars: 5,
    name: 'James L.',
    verified: true,
    text: '"As someone who\'s always on the lookout for unique fashion pieces, I\'m thrilled to have stumbled upon Shopico. The selection of clothes is not only diverse but also on-point with the latest trends."'
  }
];

// Feature boxes
const features = [
  {
    title: 'Real-Time App Generation',
    description: 'AI turns your description into fully functional mobile apps'
  },
  {
    title: 'Live UI Preview',
    description: 'See your app evolve visually as you chat'
  },
  {
    title: 'One-Click Deployment',
    description: 'Publish to App Store, Play Store, or even on-chain'
  },
  {
    title: 'Trendy, Optimized Design',
    description: 'Market-standard UI/UX from the start'
  },
  {
    title: 'Niche Use Hosting',
    description: 'Host and share apps for micro-communities (e.g. tutors, trainers)'
  },
  {
    title: 'No Coding or Setup Needed',
    description: 'Just describe — we do the rest'
  }
];

// Steps
const steps = [
  {
    number: 1,
    title: 'Describe your app in plain language'
  },
  {
    number: 2,
    title: 'Watch it come to life with AI-powered live UI preview'
  },
  {
    number: 3,
    title: 'Deploy on App Store, Play Store or Web3 instantly'
  }
];

// Main Landing Page Component
interface LandingPageProps {
  isAuthenticated: boolean;
}
export default function LandingPage({ isAuthenticated }: LandingPageProps) {
  const { logout } = useAuth();
  const [_, navigate] = useLocation();
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  // Handle navigation based on auth state
  const handleBuildNow = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };
  
  // Open waitlist form
  const openWaitlistForm = () => {
    setShowWaitlistForm(true);
  };
  
  // Close waitlist form
  const closeWaitlistForm = () => {
    setShowWaitlistForm(false);
  };
  
  // Handle navigation to FAQ page
  const goToFAQ = () => {
    navigate('/faq');
  };
  
  // Handle navigation to pricing page
  const goToPricing = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Waitlist form modal */}
      {showWaitlistForm && (
        <WaitlistForm onClose={closeWaitlistForm} isDarkMode={false} />
      )}
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/">
                <ZeroCodeLogo className="h-8" />
              </Link>
            </div>
            <div className="hidden sm:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600">How it works?</a>
              <button onClick={goToFAQ} className="text-gray-700 hover:text-blue-600">FAQs</button>
              <button onClick={goToPricing} className="text-gray-700 hover:text-blue-600">Pricing</button>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Link href="/app" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Go to App
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50">
                    Log in
                  </Link>
                  <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">Empowering Ideas, <br />No Code Required</h1>
              <p className="text-lg mb-8">
                Build and launch real mobile apps simply by describing them. ZeroCode turns your ideas into downloadable apps
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={handleBuildNow}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Build now
                </button>
                <button 
                  onClick={openWaitlistForm}
                  className="px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
                >
                  Join the waitlist
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <ZeroCodeMascot className="h-64" />
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-12 bg-white" id="partners">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-xl font-medium mb-8">Trusted Partners across the nation</h2>
          <PartnerLogos />
        </div>
      </section>

      {/* App Builder Steps */}
      <section className="py-12 bg-gray-300" id="how-it-works">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-sm font-medium uppercase mb-2">App Builder</h3>
          <h2 className="text-3xl font-bold mb-8">Your Apps, your way with ZeroCode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="text-3xl font-bold text-blue-500 mr-3">
                    {step.number}.
                  </div>
                  <div>
                    {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-sm font-medium uppercase mb-2">Key Features</h3>
          <h2 className="text-3xl font-bold mb-8">Built for Speed, Scale & Simplicity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white" id="testimonials">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold mb-8">Our Happy Users</h2>
          
          <div className="relative">
            <div className="flex justify-end space-x-2 mb-4">
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-100">
                <ArrowLeft size={16} />
              </button>
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-100">
                <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex text-yellow-400 mb-3">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <span className="font-medium">{testimonial.name}</span>
                    {testimonial.verified && (
                      <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-black text-white" id="newsletter">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">
              STAY UPTO DATE ABOUT<br />
              OUR LATEST OFFERS
            </h2>
            <div className="w-full md:w-auto flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-4 py-2 rounded-lg text-black"
              />
              <button 
                onClick={openWaitlistForm}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
              >
                Subscribe to Newsletter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white" id="footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1">
              <ZeroCodeLogo className="h-8 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                ZeroCode Pvt. Ltd.<br />
                AI-powered platform that lets anyone build and launch full mobile apps using simple natural language
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                ZeroCode Pvt. Ltd. © 2025. All Rights Reserved
              </p>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-gray-500 font-semibold uppercase text-sm mb-4">COMPANY</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">About</a></li>
                <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Works</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Career</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-gray-500 font-semibold uppercase text-sm mb-4">HELP</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Customer Support</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Troubleshoot</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-gray-500 font-semibold uppercase text-sm mb-4">FAQ</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Account</a></li>
                <li><a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How to use?</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Subscription</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Payments</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-gray-500 font-semibold uppercase text-sm mb-4">RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Free eBooks</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Development Tutorial</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">How to - Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Youtube Playlist</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <PaymentMethods />
          </div>
        </div>
      </footer>
    </div>
  );
}