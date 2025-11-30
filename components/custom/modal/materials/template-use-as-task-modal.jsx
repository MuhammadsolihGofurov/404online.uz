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

// CATEGORY --> EXAM_TEMPLATE, PRACTICE_TEMPLATE

export default function TemplateUseAsTaskModal({ template_id, category }) {
  const intl = useIntl();
  const { closeModal } = useModal();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  const isExam = category === "EXAM_TEMPLATE";
  const isPractice = category === "PRACTICE_TEMPLATE";

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      title: "",
      // EXAM fieldlari
      start_time: null,
      end_time: null,
      duration_minutes: "",
      // PRACTICE fieldlari
      deadline: null,
      // Umumiy fieldlar
      allow_audio_pause: isPractice ? true : false,
      hide_results_from_student: isPractice ? false : true,
      max_attempts: isPractice ? 0 : 1,
      is_visible: true,
      assigned_groups: [],
      assigned_students: [],
    },
  });

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      // Asosiy payload
      const basePayload = {
        title: data.title || undefined, // Bo'sh bo'lsa undefined
        assigned_groups:
          data.assigned_groups?.map((item) => item?.id || item) || [],
        assigned_students:
          data.assigned_students?.map((item) => item?.id || item) || [],
        is_visible: data.is_visible !== undefined ? data.is_visible : true,
      };

      let payload;

      if (isExam) {
        // EXAM uchun payload
        payload = {
          ...basePayload,
          start_time: data.start_time ? data.start_time.toISOString() : null,
          end_time: null, // Backend calculates this
          duration_minutes: null, // Backend calculates this
          assigned_students: [], // Exams are group-only
          is_visible: true, // Always visible
          allow_audio_pause: false, // Exam uchun static
          hide_results_from_student: true, // Exam uchun static
          max_attempts: 1, // Exam uchun static
        };
      } else if (isPractice) {
        // PRACTICE uchun payload
        payload = {
          ...basePayload,
          deadline: data.deadline ? data.deadline.toISOString() : null,
          allow_audio_pause: true, // Practice uchun static
          hide_results_from_student: false, // Practice uchun static
          max_attempts: 0, // Practice uchun static (cheksiz)
        };
      } else {
        // Umumiy holat (eski variant)
        payload = {
          ...basePayload,
          deadline: data.deadline ? data.deadline.toISOString() : null,
          start_time: data.start_time ? data.start_time.toISOString() : null,
          end_time: data.end_time ? data.end_time.toISOString() : null,
          duration_minutes: parseInt(data.duration_minutes) || 0,
          allow_audio_pause: data.allow_audio_pause || false,
          hide_results_from_student: data.hide_results_from_student || false,
          max_attempts: parseInt(data.max_attempts) || 1,
        };
      }

      const baseUrl = `/material-templates/${template_id}/use-as-task/`;

      const response = await authAxios.post(baseUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success(
        intl.formatMessage({
          id: isExam
            ? "Exam created successfully!"
            : isPractice
              ? "Practice created successfully!"
              : "Task created successfully!",
        })
      );

      setTimeout(() => {
        closeModal("templateUseAsTaskModal", response?.data);
      }, 500);
    } catch (e) {
      const errorData = e?.response?.data;
      let errorMsg = intl.formatMessage({ id: "Something went wrong" });

      // Xatolarni tekshirish
      if (errorData?.title) {
        errorMsg = Array.isArray(errorData.title)
          ? errorData.title[0]
          : errorData.title;
      } else if (errorData?.assigned_groups) {
        errorMsg = Array.isArray(errorData.assigned_groups)
          ? errorData.assigned_groups[0]
          : errorData.assigned_groups;
      } else if (errorData?.deadline) {
        errorMsg = Array.isArray(errorData.deadline)
          ? errorData.deadline[0]
          : errorData.deadline;
      } else if (errorData?.start_time) {
        errorMsg = Array.isArray(errorData.start_time)
          ? errorData.start_time[0]
          : errorData.start_time;
      } else if (errorData?.end_time) {
        errorMsg = Array.isArray(errorData.end_time)
          ? errorData.end_time[0]
          : errorData.end_time;
      } else if (errorData?.duration_minutes) {
        errorMsg = Array.isArray(errorData.duration_minutes)
          ? errorData.duration_minutes[0]
          : errorData.duration_minutes;
      }

      toast.error(errorMsg);
      console.error("Submission Error:", e);
    } finally {
      setReqLoading(false);
    }
  };

  const { data: groups } = useSWR(
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

  const { data: students } = useSWR(
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

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-textPrimary font-bold text-xl mb-2">
          {intl.formatMessage({
            id: isExam
              ? "Create Exam"
              : isPractice
                ? "Create Practice"
                : "Use as Task",
          })}
        </h1>
        {isExam && (
          <p className="text-sm text-gray-600">
            📝{" "}
            {intl.formatMessage({
              id: "Exam: Time limited, 1 attempt, result hidden",
            })}
          </p>
        )}
        {isPractice && (
          <p className="text-sm text-gray-600">
            📚 {intl.formatMessage({ id: "Exercise: With a deadline, unlimited attempts, the result is visible" })}
          </p>
        )}
      </div>

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
            placeholder={intl.formatMessage({
              id: "Enter title (optional, template name will be used)",
            })}
            error={errors?.title?.message}
          />

          {/* EXAM FIELDLARI */}
          {isExam && (
            <>
              {/* Start Time */}
              <Controller
                name="start_time"
                control={control}
                rules={{
                  required: intl.formatMessage({
                    id: "Start time is required",
                  }),
                }}
                render={({ field }) => (
                  <DateTimePickerField
                    {...field}
                    title={intl.formatMessage({
                      id: "Start time (Exam opens)",
                    })}
                    placeholder={intl.formatMessage({
                      id: "Select start time",
                    })}
                    error={errors.start_time?.message}
                    minDate={new Date()}
                    required
                  />
                )}
              />

              {/* Exam Settings Info */}
              <div className="sm:col-span-2 col-span-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>⚙️ {intl.formatMessage({ id: "Exam Settings" })}:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  <li>
                    • {intl.formatMessage({ id: "Duration" })}: <strong>{intl.formatMessage({ id: "Auto-calculated from Mock" })}</strong>
                  </li>
                  <li>
                    • {intl.formatMessage({ id: "End Time" })}: <strong>{intl.formatMessage({ id: "Auto-calculated" })}</strong>
                  </li>
                  <li>
                    • {intl.formatMessage({ id: "Audio Pause" })}: <strong>{intl.formatMessage({ id: "Disabled" })}</strong>
                  </li>
                  <li>
                    • {intl.formatMessage({ id: "Results" })}: <strong>{intl.formatMessage({ id: "Hidden from students" })}</strong>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* PRACTICE FIELDLARI */}
          {isPractice && (
            <>
              {/* Deadline */}
              <Controller
                name="deadline"
                control={control}
                rules={{
                  required: intl.formatMessage({
                    id: "Deadline is required",
                  }),
                }}
                render={({ field }) => (
                  <DateTimePickerField
                    {...field}
                    title={intl.formatMessage({
                      id: "Deadline (Submit before)",
                    })}
                    placeholder={intl.formatMessage({
                      id: "Select deadline",
                    })}
                    error={errors.deadline?.message}
                    minDate={new Date()}
                    required
                  />
                )}
              />
            </>
          )}

          {/* UMUMIY FIELDLAR (agar category yo'q bo'lsa) */}
          {!isExam && !isPractice && (
            <>
              {/* Deadline */}
              <Controller
                name="deadline"
                control={control}
                rules={{
                  required: intl.formatMessage({
                    id: "Deadline is required",
                  }),
                }}
                render={({ field }) => (
                  <DateTimePickerField
                    {...field}
                    title={intl.formatMessage({ id: "Deadline" })}
                    placeholder={intl.formatMessage({ id: "Select deadline" })}
                    error={errors.deadline?.message}
                    minDate={new Date()}
                    required
                  />
                )}
              />

              {/* Duration Minutes */}
              <Input
                type="number"
                register={register}
                name="duration_minutes"
                title={intl.formatMessage({ id: "Duration (minutes)" })}
                placeholder="60"
                validation={{
                  required: intl.formatMessage({ id: "Duration is required" }),
                  min: {
                    value: 1,
                    message: intl.formatMessage({ id: "Minimum 1 minute" }),
                  },
                }}
                error={errors?.duration_minutes?.message}
              />

              {/* Start Time */}
              <Controller
                name="start_time"
                control={control}
                render={({ field }) => (
                  <DateTimePickerField
                    {...field}
                    title={intl.formatMessage({ id: "Start time" })}
                    placeholder={intl.formatMessage({
                      id: "Select start time",
                    })}
                    error={errors.start_time?.message}
                    minDate={new Date()}
                  />
                )}
              />

              {/* End Time */}
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <DateTimePickerField
                    {...field}
                    title={intl.formatMessage({ id: "End time" })}
                    placeholder={intl.formatMessage({ id: "Select end time" })}
                    error={errors.end_time?.message}
                    minDate={new Date()}
                  />
                )}
              />

              {/* Max Attempts */}
              <div className="sm:col-span-2 col-span-1">
                <Input
                  type="number"
                  register={register}
                  name="max_attempts"
                  title={intl.formatMessage({ id: "Max attempts" })}
                  placeholder="1"
                  validation={{
                    required: intl.formatMessage({
                      id: "Max attempts is required",
                    }),
                    min: {
                      value: 1,
                      message: intl.formatMessage({ id: "Minimum 1 attempt" }),
                    },
                  }}
                  error={errors?.max_attempts?.message}
                />
              </div>

              {/* Toggle Switches */}
              <div className="sm:col-span-2 col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <ToggleSwitch
                    control={control}
                    name="allow_audio_pause"
                    label={intl.formatMessage({ id: "Allow audio pause" })}
                  />
                </div>
                <div className="flex items-center">
                  <ToggleSwitch
                    control={control}
                    name="hide_results_from_student"
                    label={intl.formatMessage({
                      id: "Hide results from students",
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Assigned Groups */}
          <div className="sm:col-span-2 col-span-1">
            <Controller
              name="assigned_groups"
              control={control}
              rules={{
                required: intl.formatMessage({
                  id: "Please select at least one group",
                }),
              }}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  title={intl.formatMessage({ id: "Assign groups" })}
                  placeholder={intl.formatMessage({ id: "Select groups" })}
                  options={groups || []}
                  error={errors.assigned_groups?.message}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>

          {/* Assigned Students - Hide for Exams */}
          {!isExam && (
            <div className="sm:col-span-2 col-span-1">
              <Controller
                name="assigned_students"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    {...field}
                    title={intl.formatMessage({
                      id: "Assign students (optional)",
                    })}
                    placeholder={intl.formatMessage({ id: "Select students" })}
                    options={students || []}
                    error={errors.assigned_students?.message}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val)}
                  />
                )}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            {!isExam && (
              <ToggleSwitch
                control={control}
                name="is_visible"
                label={intl.formatMessage({ id: "Is visible" })}
              />
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => closeModal("templateUseAsTaskModal")}
              className="rounded-xl border border-gray-300 flex items-center justify-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              {intl.formatMessage({ id: "Cancel" })}
            </button>
            <button
              type="submit"
              disabled={reqLoading}
              className="rounded-xl bg-main flex items-center justify-center text-white px-6 py-3 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reqLoading ? (
                <ButtonSpinner />
              ) : (
                intl.formatMessage({
                  id: isExam
                    ? "Create Exam"
                    : isPractice
                      ? "Create Practice"
                      : "Create Task",
                })
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
