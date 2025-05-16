// client/src/components/WaitlistForm.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WaitlistFormProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function WaitlistForm({ onClose, isDarkMode = true }: WaitlistFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Theme classes
  const themeClasses = isDarkMode 
    ? {
        bg: "bg-gray-900",
        card: "bg-gray-800",
        text: "text-white",
        textSecondary: "text-gray-400",
        border: "border-gray-700",
        input: "bg-gray-700 border-gray-600",
        button: "bg-blue-600 hover:bg-blue-700",
      }
    : {
        bg: "bg-gray-100",
        card: "bg-white",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        border: "border-gray-200",
        input: "bg-white border-gray-300",
        button: "bg-blue-500 hover:bg-blue-600",
      };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !name) {
      toast({
        title: "Error",
        description: "Please provide your name and email",
        variant: "destructive",
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Success!",
        description: "You've been added to our waitlist. We'll notify you when we launch!",
        duration: 5000,
      });
      
      // Close the form after successful submission
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className={`relative w-full max-w-md ${themeClasses.card} rounded-lg shadow-xl p-6 ${themeClasses.text}`}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full ${themeClasses.textSecondary} hover:${themeClasses.text}`}
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Join our Waitlist</h2>
          <p className={`${themeClasses.textSecondary} text-sm`}>
            Be the first to know when we launch. We'll send you an invitation as soon as we're ready.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name<span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2.5 rounded-md border text-sm ${themeClasses.input} ${themeClasses.text}`}
              placeholder="John Doe"
              disabled={isSubmitting}
              required
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2.5 rounded-md border text-sm ${themeClasses.input} ${themeClasses.text}`}
              placeholder="name@example.com"
              disabled={isSubmitting}
              required
            />
          </div>
          
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number (optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-2.5 rounded-md border text-sm ${themeClasses.input} ${themeClasses.text}`}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-3 mt-2 rounded-md text-white font-medium ${themeClasses.button} transition-colors`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting...</span>
              </div>
            ) : (
              <span>Notify Me</span>
            )}
          </button>
          
          <p className={`text-xs ${themeClasses.textSecondary} text-center mt-4`}>
            We respect your privacy and will never share your information with third parties.
          </p>
        </form>
      </div>
    </div>
  );
}