import React from "react";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/router";
import { MOCKS_URL } from "@/mock/router";
import { formatDate } from "@/utils/funcs";
import { MockViewSkeleton } from "@/components/skeleton";
import Link from "next/link";
import { useModal } from "@/context/modal-context";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

export default function MockView({ mock, loading }) {
  const router = useRouter();
  const { openModal } = useModal();

  if (loading) {
    return <MockViewSkeleton />;
  }

  if (!mock && !loading) {
    return (
      <p className="text-center text-sm text-textSecondary">
        Mock is not found
      </p>
    );
  }

  const handleDelete = (id) => {
    openModal(
      "confirmModal",
      {
        title: "Delete mock",
        description:
          "Are you sure you want to delete this mock? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/mocks/${id}/`);
          toast.success(
            intl.formatMessage({ id: "Mock deleted successfully!" })
          );
          setTimeout(() => {
            router.push(MOCKS_URL);
          }, 300);
        },
      },
      "short"
    );
  };

  return (
    <div className="sm:px-6 lg:px-8 sm:py-12 space-y-12">
      <div className="relative bg-white rounded-3xl p-6 sm:p-10 overflow-hidden transform transition duration-500">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 relative z-10">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-indigo-800 leading-tight">
              {mock.title}
            </h1>
            <p className="text-lg text-indigo-500 pt-1 font-medium">
              {mock.category}
            </p>

            {/* Meta Info Grid */}
            <div className="flex flex-wrap gap-x-10 gap-y-4 mt-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <BookOpen size={16} className="text-main" />
                <span className="font-semibold">Type:</span>{" "}
                <span>{mock.mock_type || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-main" />
                <span className="font-semibold">Author:</span>{" "}
                <span className="font-medium text-main">
                  {mock.created_by?.full_name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-main" />
                <span className="font-semibold">Date:</span>{" "}
                <span>{formatDate(mock.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Mock Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => {
                openModal(
                  "updateMock",
                  { id: mock?.id, initialData: mock },
                  "short"
                );
              }}
              className="flex items-center space-x-2 px-4 py-3 bg-white text-indigo-600 border border-indigo-200 font-semibold rounded-full shadow-md hover:bg-indigo-50 transition-all text-sm"
            >
              <Edit size={15} />
              <span className="hidden sm:inline">Edit Mock</span>
            </button>
            <button
              onClick={() => handleDelete(mock?.id)}
              className="flex items-center space-x-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 text-sm"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Delete Mock</span>
            </button>
            <button
              onClick={() => router.push(MOCKS_URL)}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform text-sm"
            >
              <ArrowLeft size={15} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {mock.sections?.map((section, idx) => (
          <div
            key={section.id || idx}
            className="bg-white rounded-xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 sm:p-6 bg-blue-100 text-textPrimary">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <span className="text-indigo-600">
                  Part {section.part_number}
                </span>
                <span className="text-gray-500">
                  {" "}
                  — {section.title || `Section ${idx + 1}`}
                </span>
              </h2>

              {/* Section Action Buttons */}
              <div className="flex space-x-2">
                {/* <button
                  onClick={() => {}}
                  className="p-2 rounded-full bg-white text-indigo-600 shadow-md hover:bg-indigo-100 transition duration-200"
                  aria-label="Edit Section"
                >
                  <Edit size={18} />
                </button> */}
                {/* <button
                  onClick={() => {}}
                  className="p-2 rounded-full bg-white text-red-500 shadow-md hover:bg-red-50 transition duration-200"
                  aria-label="Delete Section"
                >
                  <Trash2 size={18} />
                </button> */}
              </div>
            </div>

            {/* Section Body (Endi doimiy ochiq) */}
            <div className="p-5 sm:p-6 space-y-8 animate-fadeIn">
              {/* Instructions */}
              {section.instructions && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                  <p className="font-semibold text-blue-800 mb-1">
                    Instructions:
                  </p>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {section.instructions}
                  </p>
                </div>
              )}

              {/* Audio Player */}
              {section.audio_file && (
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800">Audio Resource</h3>
                  <audio
                    controls
                    className="w-full h-12 rounded-lg shadow-inner bg-gray-100"
                  >
                    <source src={section.audio_file} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Images Grid */}
              {section.images && section.images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-1 border-gray-200">
                    Visual Aids ({section.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {section.images
                      .sort((a, b) => a.order - b.order)
                      .map((img) => (
                        <div
                          key={img.id}
                          className="relative group bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                        >
                          <img
                            src={img.image}
                            alt={img.caption || `Image ${img.order}`}
                            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {img.caption && (
                            <p className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {img.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Questions List */}
              {/* {section?.questions && section?.questions?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-1 border-gray-200">
                    Questions ({section.questions.length}):
                  </h3>
                  <ol className="space-y-3 pl-5 text-gray-700">
                    {section.questions.map((q, qIdx) => (
                      <li
                        key={q.id || qIdx}
                        className="relative before:content-[''] before:absolute before:left-[-25px] before:top-1 before:w-1.5 before:h-1.5 before:bg-indigo-500 before:rounded-full before:mt-1.5"
                      >
                        <p className="font-medium text-sm sm:text-base">
                          {q.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )} */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
