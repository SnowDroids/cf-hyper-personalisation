/**
 * RecommendationButton Component
 * 
 * A floating button that appears in the bottom-right corner when
 * AI recommendations are available. Clicking it opens the recommendation modal.
 * 
 * Props:
 * - onClick: Function to call when the button is clicked
 */

'use client';

// ========== WORKSHOP: RECOMMENDATION BUTTON COMPONENT START ==========
interface RecommendationButtonProps {
  onClick: () => void;
}

export default function RecommendationButton({ onClick }: RecommendationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="View AI writing recommendations"
    >
      {/* Lightbulb Icon */}
      <svg
        className="w-8 h-8"
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
      
      {/* Badge indicator */}
      <span className="absolute -top-1 -right-1 flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center text-xs font-bold">
          !
        </span>
      </span>
      
      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        AI Writing Tips Available
      </span>
    </button>
  );
}
// ========== WORKSHOP: RECOMMENDATION BUTTON COMPONENT END ==========
