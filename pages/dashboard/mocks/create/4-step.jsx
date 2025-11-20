import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { StepsWrapper } from "@/components/dashboard/mocks/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useParams } from "@/hooks/useParams";
import { MOCK_CREATE_STEPS } from "@/mock/data";
import { MOCKS_CREATE_THIRD_STEP_URL, MOCKS_URL } from "@/mock/router";
import { useRouter } from "next/router";
import fetcher from "@/utils/fetcher";
import { QuestionEditor } from "@/components/dashboard/mocks/fourth-step";
import {
  Layers,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ListChecks,
  FileQuestion,
} from "lucide-react";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

const QUESTION_TYPE_BADGES = {
  MCQ_SINGLE: {
    label: "MCQ • single",
    color: "bg-emerald-50 text-emerald-600",
  },
  MCQ_MULTIPLE: {
    label: "MCQ • multi",
    color: "bg-teal-50 text-teal-600",
  },
  TFNG: { label: "TF / NG", color: "bg-orange-50 text-orange-600" },
  SHORT_ANSWER: {
    label: "Short answer",
    color: "bg-indigo-50 text-indigo-600",
  },
  MATCHING_DRAG_DROP: {
    label: "Matching",
    color: "bg-sky-50 text-sky-600",
  },
  MATCHING_TABLE_CLICK: {
    label: "Matching table",
    color: "bg-blue-50 text-blue-600",
  },
  SUMMARY_FILL_BLANKS: {
    label: "Summary (text)",
    color: "bg-purple-50 text-purple-600",
  },
  SUMMARY_DRAG_DROP: {
    label: "Summary (drag)",
    color: "bg-purple-50 text-purple-600",
  },
  MAP_LABELLING: {
    label: "Map labelling",
    color: "bg-pink-50 text-pink-600",
  },
  FLOWCHART_COMPLETION: {
    label: "Flowchart",
    color: "bg-yellow-50 text-yellow-600",
  },
  TABLE_COMPLETION: {
    label: "Table",
    color: "bg-lime-50 text-lime-600",
  },
};

function stripHtml(value) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function SectionSidebar({ sections, selectedId, onSelect, loading }) {
  return (
    <div className="p-4 bg-white border rounded-3xl border-slate-200">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Layers size={18} className="text-main" />
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
            Sections
          </p>
          <p className="text-sm text-slate-500">
            {sections.length} configured parts
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2 overflow-x-auto md:max-h-[calc(100vh-280px)]">
        {loading ? (
          [...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))
        ) : sections.length ? (
          sections.map((section) => {
            const isActive = section.id === selectedId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-main bg-main/10 text-main shadow-sm"
                    : "border-slate-200 hover:border-main/40 text-slate-600"
                }`}
              >
                <p className="text-sm font-semibold">
                  Part {section.part_number}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {section.questions?.length || 0} questions
                </p>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-sm text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50 text-slate-500">
            <AlertTriangle size={16} />
            No sections yet. Complete step 3 first.
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ question, onEdit, onDelete }) {
  const badge = QUESTION_TYPE_BADGES[question.question_type];
  return (
    <div className="p-5 space-y-4 transition bg-white border shadow-sm rounded-3xl border-slate-200 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Question range
          </p>
          <p className="text-lg font-bold text-slate-900">
            Q{question.question_number_start}
            {question.question_number_end > question.question_number_start && (
              <span> – {question.question_number_end}</span>
            )}
          </p>
        </div>
        {badge && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600 line-clamp-3">
        {stripHtml(question.prompt) || "No prompt yet"}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(question)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border rounded-2xl border-slate-200 text-slate-600 hover:border-main hover:text-main"
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(question)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 border border-red-100 rounded-2xl bg-red-50 hover:bg-red-100"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyQuestions() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center border border-dashed rounded-3xl border-slate-200 bg-slate-50">
      <FileQuestion size={40} className="text-slate-400" />
      <p className="text-base font-semibold text-slate-600">
        No questions in this section yet
      </p>
      <p className="max-w-sm text-sm text-slate-500">
        Start by adding your first question. You can mix different question
        types and preview them before saving.
      </p>
    </div>
  );
}

function FourthPage({ info, user, loading }) {
  const router = useRouter();
  const { findParams } = useParams();
  const mockId = findParams("mock_id");
  const mockType = findParams("mock_type");

  useEffect(() => {
    if (!mockId) {
      router.replace(MOCKS_CREATE_THIRD_STEP_URL);
    }
  }, [mockId, router]);

  const { data, isLoading, mutate, isValidating } = useSWR(
    mockId ? [`/mocks/${mockId}/`, mockId] : null,
    ([url]) => fetcher(url, {}, {}, true)
  );

  const sections = useMemo(() => data?.sections || [], [data]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (sections.length && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const activeSection = sections.find(
    (section) => section.id === selectedSectionId
  );

  const canFinish =
    sections.length > 0 &&
    sections.every((section) => (section.questions?.length || 0) > 0);

  const handleAddQuestion = () => {
    if (!activeSection) {
      toast.error("Select a section first");
      return;
    }
    setEditingQuestion(null);
    setEditorOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setEditorOpen(true);
  };

  const handleDeleteQuestion = async (question) => {
    const confirmed = window.confirm(
      "Delete this question? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      await authAxios.delete(`/mock-questions/${question.id}/`);
      toast.success("Question removed");
      mutate();
    } catch (e) {
      const message =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Unable to delete question";
      toast.error(message);
    }
  };

  const questionList = activeSection?.questions || [];

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <StepsWrapper
          description={
            "Design questions for each section, preview them instantly, and save to your mock."
          }
          steps={MOCK_CREATE_STEPS}
          currentStep={4}
          alert_type="info"
        >
          <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
            <SectionSidebar
              sections={sections}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
              loading={isLoading}
            />
            <div className="flex flex-col gap-6">
              <div className="p-5 bg-white border rounded-3xl border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                      Active section
                    </p>
                    {activeSection ? (
                      <>
                        <p className="text-2xl font-black text-slate-900">
                          Part {activeSection.part_number}
                        </p>
                        <p className="text-sm text-slate-500">
                          {mockType ? `${mockType.toLowerCase()} mock • ` : ""}
                          {questionList.length} questions
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Select a section to manage questions.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      disabled={!activeSection}
                      className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-main shadow-main/30 hover:bg-main/90 disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Add new question
                    </button>
                    <button
                      type="button"
                      disabled={!canFinish}
                      onClick={() => router.push(MOCKS_URL)}
                      className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Finish & go to mocks
                    </button>
                  </div>
                </div>
                {activeSection?.instructions && (
                  <div className="p-4 mt-4 text-sm rounded-2xl bg-slate-50 text-slate-600">
                    <p className="mb-1 text-xs font-semibold tracking-widest uppercase text-slate-400">
                      Instructions
                    </p>
                    {activeSection.instructions}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-slate-400">
                  <ListChecks size={16} />
                  Questions
                  {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={idx}
                        className="h-40 animate-pulse rounded-3xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : questionList.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {questionList.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyQuestions />
                )}
              </div>
            </div>
          </div>
        </StepsWrapper>
      </DashboardLayout>
      {editorOpen && activeSection && (
        <QuestionEditor
          isOpen={editorOpen}
          section={activeSection}
          question={editingQuestion}
          onClose={() => setEditorOpen(false)}
          onSuccess={() => mutate()}
        />
      )}
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Mocks Create || Fourth step",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(FourthPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
]);
