'use client';

import { useState, FormEvent, useEffect } from 'react';
import ReportArchiveModal from '@/components/ReportArchiveModal';
// ========== WORKSHOP: AI RECOMMENDATION FEATURE - IMPORTS START ==========
import RecommendationButton from '@/components/RecommendationButton';
import RecommendationModal from '@/components/RecommendationModal';
// ========== WORKSHOP: AI RECOMMENDATION FEATURE - IMPORTS END ==========

// Predefined locations with a cheeky twist
const LOCATIONS = [
  'The Danger Zone (aka Loading Dock)',
  'Sketchy Stairwell #3',
  'That One Hallway Everyone Avoids',
  'The "Temporary" Storage Area (Est. 2015)',
  'Break Room of Broken Dreams',
  'Parking Lot Pothole Paradise',
  'The Mysterious Basement',
  'Roof Access (Authorized Personnel Only... Sure)',
  'Conference Room B (The Wobbly One)',
  'Main Entrance (Where the Floor Tiles Go to Die)',
];

// Predefined inspector names with personality
const INSPECTORS = [
  'Safety Steve (The Stickler)',
  'Cautious Carol',
  'Hazard Harry',
  'Vigilant Veronica',
  'Meticulous Mike',
  'Observant Olivia',
  'Thorough Theodore',
  'Perceptive Patricia',
  'Diligent Dave',
  'Watchful Wendy',
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
    digitalSignature: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - STATE START ==========
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [currentInspector, setCurrentInspector] = useState<string | null>(null);
  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - STATE END ==========

  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - FETCH LOGIC START ==========
  // Fetch recommendations when the page loads or when inspector changes
  useEffect(() => {
    const fetchRecommendation = async () => {
      // Get inspector from localStorage
      const storedInspector = localStorage.getItem('currentInspector');
      if (!storedInspector) {
        return;
      }

      setCurrentInspector(storedInspector);

      try {
        const response = await fetch(
          `/api/recommendations?inspector=${encodeURIComponent(storedInspector)}`
        );
        const data = await response.json() as { recommendation: string | null };
        
        if (data.recommendation) {
          setRecommendation(data.recommendation);
        }
      } catch (error) {
        console.error('Error fetching recommendation:', error);
      }
    };

    fetchRecommendation();
  }, []);

  // Handle ignoring a recommendation
  const handleIgnoreRecommendation = async () => {
    if (!currentInspector) return;

    try {
      await fetch('/api/recommendations/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspector: currentInspector }),
      });

      // Clear the recommendation from state
      setRecommendation(null);
      setShowRecommendationModal(false);
    } catch (error) {
      console.error('Error ignoring recommendation:', error);
    }
  };
  // ========== WORKSHOP: AI RECOMMENDATION FEATURE - FETCH LOGIC END ==========

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-populate digital signature when inspector name is selected
    if (name === 'inspectorName') {
      setFormData((prev) => ({
        ...prev,
        digitalSignature: value,
      }));
      // ========== WORKSHOP: AI RECOMMENDATION FEATURE - INSPECTOR TRACKING START ==========
      // Store inspector name in localStorage for recommendation tracking
      if (value) {
        localStorage.setItem('currentInspector', value);
        setCurrentInspector(value);
      }
      // ========== WORKSHOP: AI RECOMMENDATION FEATURE - INSPECTOR TRACKING END ==========
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

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
        digitalSignature: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred while submitting the report',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="bg-white rounded-xl shadow-lg p-8 space-y-8"
        >
          {/* Section 1: Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              Section 1: Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="dateOfInspection"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date of Inspection <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="dateOfInspection"
                  name="dateOfInspection"
                  value={formData.dateOfInspection}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a location</option>
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inspectorName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Inspector Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="inspectorName"
                  name="inspectorName"
                  value={formData.inspectorName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select an inspector</option>
                  {INSPECTORS.map((inspector) => (
                    <option key={inspector} value={inspector}>
                      {inspector}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Observation Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-orange-500">
              Section 2: Observation Details
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="observedHazard"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Observed Hazard/Issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="observedHazard"
                  name="observedHazard"
                  value={formData.observedHazard}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe the hazard or safety issue in detail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="severityRating"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Severity Rating <span className="text-red-500">*</span>
                </label>
                <select
                  id="severityRating"
                  name="severityRating"
                  value={formData.severityRating}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select severity level</option>
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="recommendedAction"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Recommended Immediate Action <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="recommendedAction"
                  name="recommendedAction"
                  value={formData.recommendedAction}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe the recommended corrective actions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Sign-Off */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
              Section 3: Sign-Off
            </h2>
            <div>
              <label
                htmlFor="digitalSignature"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Digital Signature <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="digitalSignature"
                name="digitalSignature"
                value={formData.digitalSignature}
                onChange={handleInputChange}
                required
                placeholder="Your name as digital signature"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-serif italic"
              />
              <p className="mt-2 text-sm text-gray-500">
                This will be auto-populated when you select an inspector name
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Open Report Archive
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Safety First, Always. Report any hazards immediately.</p>
        </div>
      </div>

      {/* Report Archive Modal */}
      <ReportArchiveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ========== WORKSHOP: AI RECOMMENDATION FEATURE - UI COMPONENTS START ========== */}
      {/* Recommendation Button - Only show if we have a recommendation */}
      {recommendation && (
        <RecommendationButton onClick={() => setShowRecommendationModal(true)} />
      )}

      {/* Recommendation Modal */}
      <RecommendationModal
        isOpen={showRecommendationModal}
        recommendation={recommendation}
        onClose={() => setShowRecommendationModal(false)}
        onIgnore={handleIgnoreRecommendation}
      />
      {/* ========== WORKSHOP: AI RECOMMENDATION FEATURE - UI COMPONENTS END ========== */}
    </div>
  );
}
