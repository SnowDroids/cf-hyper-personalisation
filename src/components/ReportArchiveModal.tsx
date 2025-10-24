'use client';

import { useState, useEffect } from 'react';

export interface SafetyReport {
  id: number;
  date_of_inspection: string;
  location: string;
  inspector_name: string;
  observed_hazard: string;
  severity_rating: string;
  recommended_action: string;
  digital_signature: string;
  created_at: string;
}

interface ReportArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportArchiveModal({ isOpen, onClose }: ReportArchiveModalProps) {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json() as { reports?: SafetyReport[] };
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Remove from local state
      setReports(reports.filter(report => report.id !== id));
      
      // Clear selection if deleted report was selected
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Report Archive</h2>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Report List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
            {loading && (
              <div className="text-center py-8 text-gray-500">Loading reports...</div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {!loading && !error && reports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No reports found. Submit your first report!
              </div>
            )}

            {!loading && !error && reports.length > 0 && (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedReport?.id === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {report.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.date_of_inspection).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(
                          report.severity_rating
                        )}`}
                      >
                        {report.severity_rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {report.observed_hazard}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(report.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Report Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedReport ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2">Select a report to view details</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Site Safety Inspection Report
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(
                        selectedReport.severity_rating
                      )}`}
                    >
                      {selectedReport.severity_rating} Severity
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Inspection
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedReport.date_of_inspection).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900">{selectedReport.location}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspector Name
                    </label>
                    <p className="text-gray-900">{selectedReport.inspector_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report ID
                    </label>
                    <p className="text-gray-900 font-mono">#{selectedReport.id}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observed Hazard/Issue
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedReport.observed_hazard}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommended Immediate Action
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedReport.recommended_action}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Digital Signature
                  </label>
                  <p className="text-gray-900 italic">{selectedReport.digital_signature}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted on {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
