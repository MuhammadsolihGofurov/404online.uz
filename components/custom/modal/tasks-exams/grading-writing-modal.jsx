import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { useModal } from "@/context/modal-context";
import { Input, Textarea } from "../../details";

export default function GradingWritingModal({ submission_id, initialData }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);

  // Is editing mode?
  const isEdit = !!initialData?.id;

  const {
    handleSubmit,
    formState: { errors },
    register,
    watch,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      submission_id: submission_id,
      task_achievement: initialData?.task_achievement || 0,
      coherence_cohesion: initialData?.coherence_cohesion || 0,
      lexical_resource: initialData?.lexical_resource || 0,
      grammar_range_accuracy: initialData?.grammar_range_accuracy || 0,
      feedback: initialData?.feedback || "",
    },
  });

  // initialData kelsa (tahrirlash rejimi), formani to'ldirish
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        submission_id: submission_id, // ID yo'qolib qolmasligi uchun
      });
    }
  }, [initialData, reset, submission_id]);

  const scores = watch([
    "task_achievement",
    "coherence_cohesion",
    "lexical_resource",
    "grammar_range_accuracy",
  ]);

  const calculateBandScore = () => {
    const total = scores.reduce((acc, curr) => acc + parseFloat(curr || 0), 0);
    return total > 0 ? (total / 4).toFixed(1) : "0.0";
  };

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      const payload = {
        submission_id: submission_id,
        task_achievement: parseFloat(data.task_achievement),
        coherence_cohesion: parseFloat(data.coherence_cohesion),
        lexical_resource: parseFloat(data.lexical_resource),
        grammar_range_accuracy: parseFloat(data.grammar_range_accuracy),
        feedback: data.feedback,
        rubric_data: "rubric_data",
      };

      let response;
      if (isEdit) {
        // Update rejimi
        response = await authAxios.patch(
          `/reviews/${initialData.id}/`,
          payload
        );
        toast.success(intl.formatMessage({ id: "Grade updated successfully" }));
      } else {
        // Create rejimi
        response = await authAxios.post(`/reviews/`, payload);
        toast.success(intl.formatMessage({ id: "Graded successfully" }));
      }

      setTimeout(() => {
        closeModal("gradingWritingModal", response?.data);
      }, 500);
    } catch (e) {
      const errorMsg =
        e.response?.data?.message ||
        intl.formatMessage({ id: "Something went wrong" });
      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  const rubricFields = [
    { name: "task_achievement", label: "Task Achievement" },
    { name: "coherence_cohesion", label: "Coherence and Cohesion" },
    { name: "lexical_resource", label: "Lexical Resource" },
    { name: "grammar_range_accuracy", label: "Grammatical Range and Accuracy" },
  ];

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="text-center">
        <h1 className="text-textPrimary font-bold text-xl mb-2">
          {isEdit
            ? intl.formatMessage({ id: "Edit Writing Grade" })
            : intl.formatMessage({ id: "Grade Writing Submission" })}
        </h1>
        <div className="inline-flex items-center gap-2 bg-blue-50 text-main px-6 py-2 rounded-full font-bold border border-blue-100">
          <span className="text-sm uppercase tracking-wider">
            Estimated Band:
          </span>
          <span className="text-lg">{calculateBandScore()}</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(submitFn)}
        className="w-full flex flex-col gap-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rubricFields.map((field) => (
            <Input
              key={field.name}
              type="number"
              step="0.5"
              min="0"
              max="9"
              register={register}
              name={field.name}
              title={intl.formatMessage({ id: field.label })}
              required
              validation={{
                required: intl.formatMessage({ id: "Required" }),
                min: { value: 0, message: "Min 0" },
                max: { value: 9, message: "Max 9" },
              }}
              error={errors[field.name]?.message}
            />
          ))}
        </div>

        <Textarea
          register={register}
          name="feedback"
          title={intl.formatMessage({ id: "Feedback" })}
          placeholder={intl.formatMessage({ id: "Explain the score..." })}
          required
          validation={{
            required: intl.formatMessage({ id: "Feedback is required" }),
          }}
          error={errors.feedback?.message}
        />

        <div className="col-span-1 md:col-span-2 flex items-center justify-center">
          <button
            type="submit"
            disabled={reqLoading}
            className="bg-main text-white flex items-center justify-center gap-2 px-10 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg sm:shadow-none"
          >
            {reqLoading && <ButtonSpinner />}
            {isEdit
              ? intl.formatMessage({ id: "Update Score" })
              : intl.formatMessage({ id: "Confirm Grade" })}
          </button>
        </div>
      </form>
    </div>
  );
}
