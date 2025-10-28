'use client';

import { useState, FormEvent } from 'react';
import ReportArchiveModal from '@/components/ReportArchiveModal';
// ========== WORKSHOP: AI RECOMMENDATION FEATURE - IMPORTS START ==========
import RecommendationModal from '@/components/RecommendationModal';
// ========== WORKSHOP: AI RECOMMENDATION FEATURE - IMPORTS END ==========

// Predefined locations with a cheeky twist
const LOCATIONS = [
  'The Danger Zone (aka Loading Dock)',
  'Sketchy Stairwell #3',
  'That One Hallway Everyone Avoids',
];

// Predefined inspector names with personality
const INSPECTORS = [
  'Safety Steve',
  'Cautious Carol',
  'Hazard Harry',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function Home() {
  const [formData, setFormData] = useState({
    dateOfInspection: '',
    location: '',
    inspectorName: '',
    observedHazard: '',
    severityRating: '',
    recommendedAction: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - STATE START ==========
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - STATE END ==========

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - SUBMIT LOGIC START ==========
  /**
   * Handle form submission
   * This now checks with AI before actually saving the report
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Step 1: Send the new report to the Durable Object for AI analysis
      const response = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { recommendation?: string | null; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze report');
      }

      // Step 2: If AI has recommendations, show the modal
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        setShowRecommendationModal(true);
        setIsSubmitting(false);
        return;
      }

      // Step 3: If no recommendations, submit directly
      await submitReport();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
      setIsSubmitting(false);
    }
  };

  /**
   * Actually submit the report to the database
   * Called either after AI analysis (no recommendations) or when user clicks "Submit Anyway"
   */
  const submitReport = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { error?: string; id?: number };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setMessage({
        type: 'success',
        text: `Report submitted successfully! Report ID: #${data.id || 'N/A'}`,
      });

      // Clear form
      setFormData({
        dateOfInspection: '',
        location: '',
        inspectorName: '',
        observedHazard: '',
        severityRating: '',
        recommendedAction: '',
      });

      // Close modal if open
      setShowRecommendationModal(false);
      setRecommendation(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred while submitting the report',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle when user wants to edit the report after seeing recommendations
   */
  const handleEditReport = () => {
    setShowRecommendationModal(false);
    setRecommendation(null);
    setIsSubmitting(false);
    // Form data is preserved, user can edit
  };

  /**
   * Handle when user wants to submit anyway despite recommendations
   */
  const handleSubmitAnyway = async () => {
    setIsSubmitting(true);
    await submitReport();
  };
  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - SUBMIT LOGIC END ==========

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-yellow-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Site Safety Inspection Report
          </h1>
          <p className="text-gray-600">
            Document hazards and ensure workplace safety compliance
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-6"
        >
          {/* Date of Inspection */}
          <div>
            <label
              htmlFor="dateOfInspection"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date of Inspection *
            </label>
            <input
              type="date"
              id="dateOfInspection"
              name="dateOfInspection"
              value={formData.dateOfInspection}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location *
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select a location...</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Inspector Name */}
          <div>
            <label
              htmlFor="inspectorName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Inspector Name *
            </label>
            <select
              id="inspectorName"
              name="inspectorName"
              value={formData.inspectorName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select an inspector...</option>
              {INSPECTORS.map((inspector) => (
                <option key={inspector} value={inspector}>
                  {inspector}
                </option>
              ))}
            </select>
          </div>

          {/* Observed Hazard */}
          <div>
            <label
              htmlFor="observedHazard"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Observed Hazard *
            </label>
            <textarea
              id="observedHazard"
              name="observedHazard"
              value={formData.observedHazard}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Describe the hazard in detail..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Severity Rating */}
          <div>
            <label
              htmlFor="severityRating"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Severity Rating *
            </label>
            <select
              id="severityRating"
              name="severityRating"
              value={formData.severityRating}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select severity...</option>
              {SEVERITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Recommended Action */}
          <div>
            <label
              htmlFor="recommendedAction"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Recommended Action *
            </label>
            <textarea
              id="recommendedAction"
              name="recommendedAction"
              value={formData.recommendedAction}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="What actions should be taken to address this hazard?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              View Archive
            </button>
          </div>
        </form>

        {/* Report Archive Modal */}
        <ReportArchiveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* ========== WORKSHOP: AI RECOMMENDATION FEATURE - MODAL START ========== */}
        {/* AI Recommendation Modal */}
        <RecommendationModal
          isOpen={showRecommendationModal}
          recommendation={recommendation || ''}
          onEdit={handleEditReport}
          onSubmitAnyway={handleSubmitAnyway}
        />
        {/* ========== WORKSHOP: AI RECOMMENDATION FEATURE - MODAL END ========== */}
      </div>
    </div>
  );
}
