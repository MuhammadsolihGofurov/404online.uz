import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";
import Select from "../../details/select";
import { Input, ToggleSwitch } from "../../details";
import { DateTimePickerField } from "../../details/date-picker-custom";
import { Plus, X, Trash2 } from "lucide-react";

// Task type options
const TASK_TYPES = [
  { value: "EXAM_MOCK", name: "Exam Mock" },
  { value: "PRACTICE_MOCK", name: "Practice Mock" },
  { value: "CUSTOM_MOCK", name: "Custom Mock" },
  { value: "QUIZ", name: "Quiz" },
];

// Section type options for CUSTOM_MOCK
const SECTION_TYPES = [
  { value: "LISTENING", name: "Listening" },
  { value: "READING", name: "Reading" },
  { value: "WRITING", name: "Writing" },
];

// Quiz Builder Component (Internal)
function QuizBuilder({ value, onChange, error }) {
  const intl = useIntl();
  const [questions, setQuestions] = useState(() => {
    if (value && Array.isArray(value.questions)) {
      return value.questions;
    }
    return [];
  });

  useEffect(() => {
    onChange({
      questions,
      total_questions: questions.length,
    });
  }, [questions, onChange]);

  const addQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      number: questions.length + 1,
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, val) => {
    const updated = [...questions];
    if (field === "options") {
      updated[index].options = val;
    } else if (field === "correct_answer") {
      updated[index].correct_answer = parseInt(val);
    } else {
      updated[index][field] = val;
    }
    // Update question numbers
    updated.forEach((q, i) => {
      q.number = i + 1;
    });
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => {
      q.number = i + 1;
    });
    setQuestions(updated);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <label className="text-textSecondary font-semibold text-sm">
          {intl.formatMessage({ id: "Quiz Questions" })}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <Plus size={16} />
          {intl.formatMessage({ id: "Add Question" })}
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          {intl.formatMessage({ id: "No questions added yet. Click 'Add Question' to start." })}
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">
                  {intl.formatMessage({ id: "Question" })} {q.number}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    {intl.formatMessage({ id: "Question Text" })}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(index, "question", e.target.value)
                    }
                    placeholder={intl.formatMessage({ id: "Enter question text" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {intl.formatMessage({ id: "Options" })}
                  </label>
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <span className="w-6 text-sm font-medium text-gray-600">
                        {String.fromCharCode(65 + optIndex)}:
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...q.options];
                          newOptions[optIndex] = e.target.value;
                          updateQuestion(index, "options", newOptions);
                        }}
                        placeholder={intl.formatMessage({
                          id: `Option ${String.fromCharCode(65 + optIndex)}`,
                        })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct_answer === optIndex}
                        onChange={() =>
                          updateQuestion(index, "correct_answer", optIndex)
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs text-gray-500">
                        {intl.formatMessage({ id: "Correct" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
}

export default function TaskModal({
  id,
  old_data, // Accept old_data prop like templates-modal pattern
}) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  // Extract old values from old_data or use defaults
  const old_title = old_data?.title || "";
  const old_task_type = old_data?.task_type || "";
  const old_mocks = old_data?.mocks || [];
  const old_custom_content = old_data?.custom_content || null;
  const old_deadline = old_data?.deadline || null;
  const old_start_time = old_data?.start_time || null;
  const old_end_time = old_data?.end_time || null;
  const old_duration_minutes = old_data?.duration_minutes || 0;
  const old_assigned_groups = old_data?.assigned_groups || [];
  const old_assigned_students = old_data?.assigned_students || [];
  const old_max_attempts = old_data?.max_attempts || 0;
  const old_is_visible = old_data?.is_visible !== undefined ? old_data.is_visible : true;
  const old_allow_audio_pause = old_data?.allow_audio_pause !== undefined ? old_data.allow_audio_pause : true;
  const old_hide_results_from_student = old_data?.hide_results_from_student || false;
  const old_selected_section_types = old_data?.selected_section_types || [];
  const old_max_questions = old_data?.max_questions || null;
  const old_source_template = old_data?.source_template || null;

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    watch,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: old_title,
      task_type: old_task_type,
      practice_template: old_source_template || null,
      mocks: old_mocks,
      custom_content: old_custom_content || { questions: [] },
      deadline: old_deadline ? new Date(old_deadline) : null,
      start_time: old_start_time ? new Date(old_start_time) : null,
      end_time: old_end_time ? new Date(old_end_time) : null,
      duration_minutes: old_duration_minutes,
      assigned_groups: old_assigned_groups,
      assigned_students: old_assigned_students,
      max_attempts: old_max_attempts,
      is_visible: old_is_visible,
      allow_audio_pause: old_allow_audio_pause,
      hide_results_from_student: old_hide_results_from_student,
      selected_section_types: old_selected_section_types,
      max_questions: old_max_questions || "",
    },
  });

  const taskType = watch("task_type");
  const practiceTemplate = watch("practice_template");

  // Fetch task details if editing
  const { data: taskData } = useSWR(
    id ? ["/tasks/", router.locale, id] : null,
    ([url, locale]) =>
      fetcher(
        `${url}${id}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Reset form when taskData loads or old_data changes
  useEffect(() => {
    if (id && taskData) {
      reset({
        title: taskData.title || "",
        task_type: taskData.task_type || "",
        practice_template: taskData.source_template || null,
        mocks: taskData.mocks || [],
        custom_content: taskData.custom_content || { questions: [] },
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        start_time: taskData.start_time ? new Date(taskData.start_time) : null,
        end_time: taskData.end_time ? new Date(taskData.end_time) : null,
        duration_minutes: taskData.duration_minutes || 0,
        assigned_groups: taskData.assigned_groups || [],
        assigned_students: taskData.assigned_students || [],
        max_attempts: taskData.max_attempts || 0,
        is_visible: taskData.is_visible !== undefined ? taskData.is_visible : true,
        allow_audio_pause: taskData.allow_audio_pause !== undefined ? taskData.allow_audio_pause : true,
        hide_results_from_student: taskData.hide_results_from_student || false,
        selected_section_types: taskData.selected_section_types || [],
        max_questions: taskData.max_questions || "",
      });
    } else if (old_data && Object.keys(old_data).length > 0) {
      reset({
        title: old_title,
        task_type: old_task_type,
        practice_template: old_source_template || null,
        mocks: old_mocks,
        custom_content: old_custom_content || { questions: [] },
        deadline: old_deadline ? new Date(old_deadline) : null,
        start_time: old_start_time ? new Date(old_start_time) : null,
        end_time: old_end_time ? new Date(old_end_time) : null,
        duration_minutes: old_duration_minutes,
        assigned_groups: old_assigned_groups,
        assigned_students: old_assigned_students,
        max_attempts: old_max_attempts,
        is_visible: old_is_visible,
        allow_audio_pause: old_allow_audio_pause,
        hide_results_from_student: old_hide_results_from_student,
        selected_section_types: old_selected_section_types,
        max_questions: old_max_questions || "",
      });
    }
  }, [id, taskData, old_data, reset]);

  // Auto-populate mocks when practice template is selected
  useEffect(() => {
    if (taskType === "PRACTICE_MOCK" && practiceTemplate) {
      // Fetch template details to get mocks
      fetcher(
        `/material-templates/${practiceTemplate.id || practiceTemplate}/`,
        {
          headers: {
            "Accept-Language": router.locale,
          },
        },
        {},
        true
      )
        .then((template) => {
          if (template.mocks && template.mocks.length > 0) {
            setValue("mocks", template.mocks);
          }
        })
        .catch((err) => {
          console.error("Error fetching template mocks:", err);
        });
    }
  }, [practiceTemplate, taskType, setValue, router.locale]);

  // Fetch practice templates (for PRACTICE_MOCK)
  const { data: practiceTemplatesData } = useSWR(
    taskType === "PRACTICE_MOCK"
      ? ["/material-templates/", router.locale, "PRACTICE_TEMPLATE"]
      : null,
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&category=PRACTICE_TEMPLATE`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Fetch mocks based on task type and category
  const mockCategory =
    taskType === "EXAM_MOCK"
      ? "EXAM_TEMPLATE"
      : taskType === "CUSTOM_MOCK"
      ? "CUSTOM"
      : null;

  const { data: mocksData } = useSWR(
    (taskType === "EXAM_MOCK" || taskType === "CUSTOM_MOCK") && mockCategory
      ? ["/mocks/", router.locale, mockCategory]
      : null,
    ([url, locale, category]) =>
      fetcher(
        `${url}?page_size=all&category=${category}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Fetch groups for assignment
  const { data: groupsData } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Fetch students for assignment
  const { data: studentsData } = useSWR(
    ["/users/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all&role=STUDENT`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const practiceTemplateOptions = Array.isArray(practiceTemplatesData?.results)
    ? practiceTemplatesData.results
    : Array.isArray(practiceTemplatesData)
    ? practiceTemplatesData
    : [];

  const mockOptions = Array.isArray(mocksData?.results)
    ? mocksData.results
    : Array.isArray(mocksData)
    ? mocksData
    : [];

  const groupOptions = Array.isArray(groupsData?.results)
    ? groupsData.results
    : Array.isArray(groupsData)
    ? groupsData
    : [];

  const studentOptions = Array.isArray(studentsData?.results)
    ? studentsData.results
    : Array.isArray(studentsData)
    ? studentsData
    : [];

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      // Prepare payload (JSON, not FormData since we're not uploading files)
      const payload = {
        title: data.title,
        task_type: data.task_type,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : 0,
        max_attempts: data.max_attempts ? parseInt(data.max_attempts) : 0,
        is_visible: data.is_visible,
        allow_audio_pause: data.allow_audio_pause,
        hide_results_from_student: data.hide_results_from_student,
      };

      // Task type specific fields
      if (data.task_type === "EXAM_MOCK" || data.task_type === "CUSTOM_MOCK") {
        if (data.mocks && data.mocks.length > 0) {
          payload.mocks = data.mocks.map((item) => item?.id || item);
        }
      }

      if (data.task_type === "PRACTICE_MOCK") {
        // For PRACTICE_MOCK, mocks come from the selected template
        if (data.mocks && data.mocks.length > 0) {
          payload.mocks = data.mocks.map((item) => item?.id || item);
        }
      }

      if (data.task_type === "EXAM_MOCK") {
        if (data.start_time) {
          payload.start_time = data.start_time.toISOString();
        }
        if (data.end_time) {
          payload.end_time = data.end_time.toISOString();
        }
      }

      if (data.task_type === "CUSTOM_MOCK") {
        if (data.selected_section_types && data.selected_section_types.length > 0) {
          payload.selected_section_types = data.selected_section_types.map(
            (item) => item?.value || item
          );
        }
        if (data.max_questions) {
          payload.max_questions = parseInt(data.max_questions);
        }
      }

      if (data.task_type === "QUIZ") {
        // For QUIZ, custom_content should be provided
        if (data.custom_content && data.custom_content.questions) {
          payload.custom_content = data.custom_content;
        }
      }

      // Assignment fields
      if (data.assigned_groups && data.assigned_groups.length > 0) {
        payload.assigned_groups = data.assigned_groups.map((item) => item?.id || item);
      }

      if (data.assigned_students && data.assigned_students.length > 0) {
        payload.assigned_students = data.assigned_students.map(
          (item) => item?.id || item
        );
      }

      let response;
      const baseUrl = "/tasks/";

      if (id) {
        response = await authAxios.patch(`${baseUrl}${id}/`, payload);
        toast.success(intl.formatMessage({ id: "Task updated successfully!" }));
      } else {
        response = await authAxios.post(baseUrl, payload);
        toast.success(intl.formatMessage({ id: "Task created successfully!" }));
      }

      setTimeout(() => {
        closeModal("taskModal", response?.data);
      }, 500);
    } catch (e) {
      const errorData = e?.response?.data;
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      // Handle different error formats
      if (errorData?.error) {
        const errorKeys = Object.keys(errorData.error);
        if (errorKeys.length > 0) {
          const firstError = errorData.error[errorKeys[0]];
          errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      } else if (typeof errorData === "string") {
        errorMsg = errorData;
      }

      toast.error(errorMsg);
      console.error("Task submission error:", e);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-textPrimary text-center font-bold text-xl">
        {id
          ? intl.formatMessage({ id: "Edit Task" })
          : intl.formatMessage({ id: "Create Task" })}
      </h1>
      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-8 text-center font-poppins"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Title */}
          <Input
            type="text"
            register={register}
            name="title"
            title={intl.formatMessage({ id: "Title" })}
            placeholder="Task title"
            required
            validation={{
              required: intl.formatMessage({ id: "Title is required" }),
            }}
            error={errors?.title?.message}
          />

          {/* Task Type */}
          <Controller
            name="task_type"
            control={control}
            rules={{ required: intl.formatMessage({ id: "Required" }) }}
            render={({ field }) => (
              <Select
                {...field}
                title={intl.formatMessage({ id: "Task Type" })}
                placeholder={intl.formatMessage({ id: "Select task type" })}
                options={TASK_TYPES}
                error={errors.task_type?.message}
                disabled={!!id} // Disable task_type when editing (immutability)
              />
            )}
          />

          {/* PRACTICE_MOCK: Select Practice Template */}
          {taskType === "PRACTICE_MOCK" && (
            <div className="sm:col-span-2 col-span-1">
              <Controller
                name="practice_template"
                control={control}
                rules={{
                  required: intl.formatMessage({
                    id: "Practice template is required",
                  }),
                }}
                render={({ field }) => (
                  <Select
                    {...field}
                    title={intl.formatMessage({ id: "Select Practice Template" })}
                    placeholder={intl.formatMessage({
                      id: "Select a practice template",
                    })}
                    options={practiceTemplateOptions}
                    error={errors.practice_template?.message}
                    disabled={!!id} // Disable when editing
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                {intl.formatMessage({
                  id: "Mocks from the selected template will be automatically added to this task.",
                })}
              </p>
            </div>
          )}

          {/* EXAM_MOCK: Mocks MultiSelect */}
          {taskType === "EXAM_MOCK" && (
            <>
              <div className="sm:col-span-2 col-span-1">
                <Controller
                  name="mocks"
                  control={control}
                  rules={{
                    required: intl.formatMessage({
                      id: "At least one mock is required",
                    }),
                  }}
                  render={({ field }) => (
                    <MultiSelect
                      {...field}
                      title={intl.formatMessage({ id: "Mocks" })}
                      placeholder={intl.formatMessage({ id: "Select mocks" })}
                      options={mockOptions}
                      error={errors.mocks?.message}
                      value={field.value || []}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </div>
              <div className="sm:col-span-2 col-span-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-left">
                  {intl.formatMessage({
                    id: "This exam will appear on student dashboards during the specified time window.",
                  })}
                </p>
              </div>
            </>
          )}

          {/* CUSTOM_MOCK: Mocks MultiSelect + Section Types */}
          {taskType === "CUSTOM_MOCK" && (
            <>
              <div className="sm:col-span-2 col-span-1">
                <Controller
                  name="mocks"
                  control={control}
                  rules={{
                    required: intl.formatMessage({
                      id: "At least one mock is required",
                    }),
                  }}
                  render={({ field }) => (
                    <MultiSelect
                      {...field}
                      title={intl.formatMessage({ id: "Mocks" })}
                      placeholder={intl.formatMessage({ id: "Select mocks" })}
                      options={mockOptions}
                      error={errors.mocks?.message}
                      value={field.value || []}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </div>
              <div className="sm:col-span-2 col-span-1">
                <Controller
                  name="selected_section_types"
                  control={control}
                  rules={{
                    required: intl.formatMessage({
                      id: "At least one section type is required",
                    }),
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return intl.formatMessage({
                          id: "At least one section type must be selected",
                        });
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-textSecondary font-semibold text-sm">
                        {intl.formatMessage({ id: "Section Types" })}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {SECTION_TYPES.map((section) => {
                          const isSelected = (field.value || []).some(
                            (v) => (v?.value || v) === section.value
                          );
                          return (
                            <label
                              key={section.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([
                                      ...current,
                                      section,
                                    ]);
                                  } else {
                                    field.onChange(
                                      current.filter(
                                        (v) => (v?.value || v) !== section.value
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm text-gray-700">
                                {section.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.selected_section_types && (
                        <span className="text-red-500 text-xs">
                          {errors.selected_section_types.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
              <Input
                type="number"
                register={register}
                name="max_questions"
                title={intl.formatMessage({ id: "Max Questions (Optional)" })}
                placeholder="e.g., 20"
                error={errors?.max_questions?.message}
              />
            </>
          )}

          {/* QUIZ: Quiz Builder */}
          {taskType === "QUIZ" && (
            <div className="sm:col-span-2 col-span-1">
              <Controller
                name="custom_content"
                control={control}
                rules={{
                  validate: (value) => {
                    if (
                      !value ||
                      !value.questions ||
                      value.questions.length === 0
                    ) {
                      return intl.formatMessage({
                        id: "At least one question is required for Quiz",
                      });
                    }
                    // Validate each question has required fields
                    for (const q of value.questions) {
                      if (!q.question || q.question.trim() === "") {
                        return intl.formatMessage({
                          id: "All questions must have question text",
                        });
                      }
                      if (!q.options || q.options.length < 2) {
                        return intl.formatMessage({
                          id: "All questions must have at least 2 options",
                        });
                      }
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <QuizBuilder
                    value={field.value || { questions: [] }}
                    onChange={field.onChange}
                    error={errors.custom_content?.message}
                  />
                )}
              />
            </div>
          )}

          {/* EXAM_MOCK specific: Start Time and End Time */}
          {taskType === "EXAM_MOCK" && (
            <>
              <Controller
                name="start_time"
                control={control}
                rules={{
                  required: intl.formatMessage({
                    id: "Start time is required for Exam Mock",
                  }),
                }}
                render={({ field }) => (
                  <DateTimePickerField
                    title={intl.formatMessage({ id: "Start Time" })}
                    placeholder={intl.formatMessage({ id: "Select start time" })}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.start_time?.message}
                    required
                    minDate={new Date()}
                  />
                )}
              />
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <DateTimePickerField
                    title={intl.formatMessage({ id: "End Time (Optional)" })}
                    placeholder={intl.formatMessage({ id: "Select end time" })}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.end_time?.message}
                    minDate={watch("start_time") || new Date()}
                  />
                )}
              />
            </>
          )}

          {/* Deadline - Available for all task types */}
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DateTimePickerField
                title={intl.formatMessage({ id: "Deadline (Optional)" })}
                placeholder={intl.formatMessage({ id: "Select deadline" })}
                value={field.value}
                onChange={field.onChange}
                error={errors.deadline?.message}
                minDate={new Date()}
              />
            )}
          />

          {/* Duration Minutes */}
          <Input
            type="number"
            register={register}
            name="duration_minutes"
            title={intl.formatMessage({ id: "Duration (Minutes)" })}
            placeholder="e.g., 120"
            error={errors?.duration_minutes?.message}
          />

          {/* Max Attempts */}
          <Input
            type="number"
            register={register}
            name="max_attempts"
            title={intl.formatMessage({
              id: "Max Attempts (0 = unlimited)",
            })}
            placeholder="0"
            error={errors?.max_attempts?.message}
          />

          {/* Assignment: Groups */}
          <div className="sm:col-span-2 col-span-1">
            <Controller
              name="assigned_groups"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  title={intl.formatMessage({
                    id: "Assign to Groups (Optional)",
                  })}
                  placeholder={intl.formatMessage({ id: "Select groups" })}
                  options={groupOptions}
                  error={errors.assigned_groups?.message}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>

          {/* Assignment: Students */}
          <div className="sm:col-span-2 col-span-1">
            <Controller
              name="assigned_students"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  title={intl.formatMessage({
                    id: "Assign to Students (Optional)",
                  })}
                  placeholder={intl.formatMessage({ id: "Select students" })}
                  options={studentOptions}
                  error={errors.assigned_students?.message}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>
        </div>

        {/* Settings Toggles */}
        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ToggleSwitch
              control={control}
              name="is_visible"
              label={intl.formatMessage({ id: "Visible to students" })}
            />
            <ToggleSwitch
              control={control}
              name="allow_audio_pause"
              label={intl.formatMessage({ id: "Allow audio pause" })}
            />
            <ToggleSwitch
              control={control}
              name="hide_results_from_student"
              label={intl.formatMessage({
                id: "Hide results from student",
              })}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-main flex items-center justify-center sm:w-auto w-full text-white p-4 hover:bg-blue-800 transition-colors duration-200"
          >
            {reqLoading ? (
              <ButtonSpinner />
            ) : (
              intl.formatMessage({ id: "Submit" })
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
