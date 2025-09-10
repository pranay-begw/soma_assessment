"use client";
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Send, Building, User, Mail, Globe, Briefcase, MessageSquare, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  linkedinUrl: string;
  companyWebsite: string;
  message: string;
  fundingStage: string;
  fundingAmount: string;
  industry: string;
};

type FormErrors = {
  [key: string]: string;
};

type SubmitStatus = {
  type: 'success' | 'error';
  message: string;
} | null;

const UserForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    position: '',
    linkedinUrl: '',
    companyWebsite: '',
    message: '',
    fundingStage: '',
    fundingAmount: '',
    industry: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

  const fundingStages = [
    { value: 'pre-seed', label: 'Pre-Seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'series-a', label: 'Series A' },
    { value: 'series-b', label: 'Series B' },
    { value: 'later-stage', label: 'Later Stage' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Fintech', 'E-commerce', 'SaaS', 'AI/ML',
    'Biotech', 'CleanTech', 'EdTech', 'Gaming', 'Media', 'Real Estate',
    'Manufacturing', 'Consumer Goods', 'Other'
  ];

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.position.trim()) newErrors.position = 'Position is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    if (!formData.fundingStage) newErrors.fundingStage = 'Funding stage is required';
    if (!formData.industry.trim()) newErrors.industry = 'Industry is required';
    
    // Validate URLs if provided
    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }
    if (formData.companyWebsite && !isValidUrl(formData.companyWebsite)) {
      newErrors.companyWebsite = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/form/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({ type: 'success', message: result.message });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          position: '',
          linkedinUrl: '',
          companyWebsite: '',
          message: '',
          fundingStage: '',
          fundingAmount: '',
          industry: ''
        });
      } else {
        setSubmitStatus({ 
          type: 'error', 
          message: result.message || 'Something went wrong. Please try again.' 
        });
        
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          result.errors.forEach((error: { path: string[]; message: string }) => {
            if (error.path && error.path.length > 0) {
              fieldErrors[error.path[0]] = error.message;
            }
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 mb-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      </div>

      {submitStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          submitStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          <span>{submitStatus.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} method="post" autoComplete="off" className="space-y-6 text-gray-600">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="w-4 h-4 inline mr-1" />
              Company Name *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.company ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Co."
            />
            {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
          </div>
          
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Your Position *
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.position ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Founder"
            />
            {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry *
          </label>
          <select
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.industry ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select your industry</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
        </div>

        {/* Funding Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fundingStage" className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Funding Stage *
            </label>
            <select
              id="fundingStage"
              name="fundingStage"
              value={formData.fundingStage}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fundingStage ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select funding stage</option>
              {fundingStages.map(stage => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            {errors.fundingStage && <p className="mt-1 text-sm text-red-600">{errors.fundingStage}</p>}
          </div>
          
          <div>
            <label htmlFor="fundingAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Funding Amount (Optional)
            </label>
            <input
              type="text"
              id="fundingAmount"
              name="fundingAmount"
              value={formData.fundingAmount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0, 10K, 1M, 1B, etc."
            />
          </div>
        </div>

        {/* Optional Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile (Optional)
            </label>
            <input
              type="url"
              id="linkedinUrl"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://linkedin.com/in/yourprofile"
            />
            {errors.linkedinUrl && <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl}</p>}
          </div>
          
          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Company Website (Optional)
            </label>
            <input
              type="url"
              id="companyWebsite"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.companyWebsite ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://yourcompany.com"
            />
            {errors.companyWebsite && <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>}
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Tell us about yourself *
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Please describe your company..."
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
          <p className="mt-1 text-sm text-gray-500">Minimum 10 characters</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UserForm;