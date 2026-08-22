'use client';

import React, { useState } from 'react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  CheckCircle2,
  Loader2,
  Headphones,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

// ============================================
// Contact Page
// ============================================

const contactMethods = [
  {
    icon: Headphones,
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    action: 'Start Chat',
    available: '24/7',
    primary: true,
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'support@oasismarketpro.com',
    action: 'Send Email',
    available: 'Response within 2 hours',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: '+1 (908) -0199',
    action: 'Call Now',
    available: 'VIP clients only',
  },
];

const offices = [
  {
    city: "USA",
    address: "1266 East Main Street Suite 603",
    region: "Stamford CT 06902. USA",
    phone: "+1 (908) 279-9340",
    email: "newyork@oasismarketpro.com",
  },
  {
    city: "London",
    address: "45 Canary Wharf Tower",
    region: "London E14 5AB, UK",
    phone: "+44 20 7946 0958",
    email: "london@oasismarketpro.com",
  },
  {
    city: "Singapore",
    address: "1 Raffles Place, Tower 2",
    region: "Singapore 048616",
    phone: "+65 6521 0100",
    email: "singapore@oasismarketpro.com",
  },
];

const departments = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'account', label: 'Account Issues' },
  { value: 'verification', label: 'Verification Help' },
  { value: 'trading', label: 'Trading Questions' },
  { value: 'partnership', label: 'Partnership & Business' },
  { value: 'press', label: 'Press & Media' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'general',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto text-center">
            <MessageCircle className="h-16 w-16 text-[#22c55e] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-[#6b7a90]">
              Our team is here to help. Reach out through any of our support channels 
              and we'll get back to you as quickly as possible.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-xl p-6 border',
                    method.primary
                      ? 'bg-[#22c55e]/10 border-[#22c55e]'
                      : 'bg-[#0f1419] border-[#1e2733]'
                  )}
                >
                  <div className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center mb-4',
                    method.primary ? 'bg-[#22c55e]' : 'bg-[#1e2733]'
                  )}>
                    <method.icon className={cn(
                      'h-6 w-6',
                      method.primary ? 'text-white' : 'text-[#22c55e]'
                    )} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
                  <p className="text-[#6b7a90] mb-4">{method.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b7a90]">{method.available}</span>
                    <button className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      method.primary
                        ? 'bg-[#22c55e] text-white hover:bg-[#1ea550]'
                        : 'bg-[#1e2733] text-white hover:bg-[#2a3441]'
                    )}>
                      {method.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Offices */}
        <section className="py-16 px-6 bg-[#0f1419]">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                
                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#22c55e]/10 border border-[#22c55e] rounded-xl p-8 text-center"
                    >
                      <CheckCircle2 className="h-16 w-16 text-[#22c55e] mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                      <p className="text-[#6b7a90] mb-6">
                        Thank you for contacting us. Our team will respond within 2 hours.
                      </p>
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            name: '',
                            email: '',
                            department: 'general',
                            subject: '',
                            message: '',
                          });
                        }}
                        className="px-6 py-2 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors"
                      >
                        Send Another Message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#6b7a90] mb-2">Full Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#6b7a90] mb-2">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-2">Department</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        >
                          {departments.map(dept => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-2">Subject *</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                          placeholder="How can we help?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-2">Message *</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e] resize-none"
                          placeholder="Please describe your inquiry in detail..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Office Locations */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Our Offices</h2>
                <div className="space-y-6">
                  {offices.map((office, index) => (
                    <div
                      key={index}
                      className="bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733]"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Globe className="h-5 w-5 text-[#22c55e]" />
                        <h3 className="text-xl font-semibold text-white">{office.city}</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-[#6b7a90] mt-1 shrink-0" />
                          <div>
                            <p className="text-white">{office.address}</p>
                            <p className="text-[#6b7a90]">{office.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-[#6b7a90]" />
                          <p className="text-[#6b7a90]">{office.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-[#6b7a90]" />
                          <a href={`mailto:${office.email}`} className="text-[#22c55e] hover:underline">
                            {office.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Hours */}
                <div className="mt-8 bg-[#0a0e14] rounded-xl p-6 border border-[#1e2733]">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-[#22c55e]" />
                    <h3 className="text-xl font-semibold text-white">Support Hours</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Live Chat & Email</span>
                      <span className="text-white">24/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Phone Support (VIP)</span>
                      <span className="text-white">24/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7a90]">Office Hours</span>
                      <span className="text-white">Mon-Fri 9AM-6PM (Local)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
