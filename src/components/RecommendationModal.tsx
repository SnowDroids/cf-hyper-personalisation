/**
 * RecommendationModal Component
 * 
 * A modal dialog that displays AI-generated writing recommendations
 * when a user tries to submit a report.
 * 
 * Includes two action buttons:
 * - Edit Report: Closes the modal so user can edit their report
 * - Submit Anyway: Submits the report despite the recommendations
 * 
 * Props:
 * - isOpen: Whether the modal is visible
 * - recommendation: The AI-generated recommendation text
 * - onEdit: Function to call when user wants to edit the report
 * - onSubmitAnyway: Function to call when user wants to submit anyway
 */

'use client';

import { useEffect } from 'react';

// ========== WORKSHOP: RECOMMENDATION MODAL COMPONENT START ==========
interface RecommendationModalProps {
  isOpen: boolean;
  recommendation: string;
  onEdit: () => void;
  onSubmitAnyway: () => void;
}

export default function RecommendationModal({
  isOpen,
  recommendation,
  onEdit,
  onSubmitAnyway,
}: RecommendationModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onEdit();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onEdit]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !recommendation) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onEdit}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* AI Icon */}
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">AI Writing Suggestions</h2>
              </div>
              
              {/* Close button */}
              <button
                onClick={onEdit}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-amber-800">
                  Before submitting, consider these suggestions to improve your report:
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {recommendation}
              </p>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3 justify-end">
            <button
              onClick={onEdit}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Edit Report
            </button>
            <button
              onClick={onSubmitAnyway}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
// ========== WORKSHOP: RECOMMENDATION MODAL COMPONENT END ==========
