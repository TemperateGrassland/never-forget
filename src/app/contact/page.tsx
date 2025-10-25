"use client";

import { useState } from "react";
import TurnstileComponent from "@/components/Turnstile";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    type: "",
    feedback: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
      setFormData({ type: "", feedback: "" });
      setTurnstileToken("");
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    setError('CAPTCHA verification failed. Please try again.');
    setTurnstileToken("");
  };

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-28">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="bg-[#25d366] text-white px-6 py-2 rounded-md hover:bg-[#128C7E] transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-28">
      <h1 className="text-2xl font-bold text-center text-black mb-6">Contact Us</h1>
      <p className="text-gray-600 text-center mb-6">
        We would love to hear from you! Share your thoughts and help us improve.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
            Feedback Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md text-black bg-white focus:ring-2 focus:ring-[#25d366] focus:border-transparent"
            required
          >
            <option value="">Select feedback type</option>
            <option value="complement">Complement - Something you love</option>
            <option value="criticism">Criticism - Something to improve</option>
          </select>
        </div>

        <div>
          <label htmlFor="feedback" className="block text-gray-700 font-medium mb-2">
            Your Feedback
          </label>
          <textarea
            id="feedback"
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md text-black bg-white focus:ring-2 focus:ring-[#25d366] focus:border-transparent resize-vertical"
            placeholder="Share your thoughts..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Security Verification
          </label>
          <TurnstileComponent
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            className="mb-4"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.type || !formData.feedback || !turnstileToken}
          className="w-full bg-[#25d366] text-white py-3 px-6 rounded-md font-semibold hover:bg-[#128C7E] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}