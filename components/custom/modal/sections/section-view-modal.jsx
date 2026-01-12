import React from "react";
import { Calendar, Clock, Edit, Hash, ListOrdered, X } from "lucide-react";
import { useRouter } from "next/router";
import { SECTIONS_CREATE_URL, SECTIONS_PARTS_URL } from "@/mock/router";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";

// Takrorlanuvchi ma'lumot qatorlari uchun kichik komponent
const InfoField = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start space-x-3 ${className}`}>
    <div className="mt-1 text-gray-400">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-none mb-1">
        {label}
      </p>
      <p className="text-gray-700 font-semibold leading-tight">{value}</p>
    </div>
  </div>
);

const formatDate = (dadataring) => {
  return new Date(dadataring).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SectionViewModal({ data, onClose }) {
  if (!data) return null;
  const router = useRouter();
  const { findParams } = useParams();
  const type = findParams("section") || "";
  const { closeModal } = useModal();

  const editHandler = (id) => {
    router.push(`${SECTIONS_CREATE_URL}?section=${type}&id=${id}`);
    closeModal("sectionView");
  };

  const questionHandler = (id) => {
    router.push(`${SECTIONS_PARTS_URL}?section=${type}&sectionId=${id}`);
    closeModal("sectionView");
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50">
        <h3 className="text-lg font-bold text-gray-800 italic">
          Listening Section
        </h3>
      </div>

      {/* Content Body */}
      <div className="space-y-6">
        <InfoField icon={Edit} label="Section Title" value={data.title} />

        <div className="grid grid-cols-2 gap-2 rounded-xl">
          <InfoField icon={Clock} label="Duration" value={data.duration} />
          <InfoField
            icon={Hash}
            label="Questions"
            value={`${data.questions_count} items`}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-4 text-sm">
          <div className="flex items-center text-gray-500 font-medium">
            <Calendar size={14} className="mr-2" />
            {formatDate(data?.created_at)}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              data.status === "DRAFT"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* Action Buttons */}

      {/* {data?.status == "DRAFT" && ( */}
        <div className=" bg-gray-50 flex gap-3">
          <button
            onClick={() => editHandler(data?.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm shadow-sm"
          >
            <Edit size={16} />
            Edit Section
          </button>

          <button
            onClick={() => questionHandler(data?.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-sm shadow-lg shadow-indigo-100"
          >
            <ListOrdered size={16} />
            Questions
          </button>
        </div>
      {/* )} */}
    </div>
  );
}
