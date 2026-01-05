import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { ButtonSpinner } from "../../loading";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MultiSelect from "../../details/multi-select";
import Select from "../../details/select";
import { MOCK_TEMPLATES, TASK_TYPE, TEMPLATE_D_LEVEL } from "@/mock/data";
import { Input, ToggleSwitch } from "../../details";
import { DateTimePickerField } from "../../details/date-picker-custom";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import HomeworkItemSelector from "./details/homework-selector-item";

export default function TaskHomeworksGeneratorOffcanvas({ id, initialData }) {
  const intl = useIntl();
  const { closeOffcanvas } = useOffcanvas();
  const [reqLoading, setReqLoading] = useState(false);
  const router = useRouter();

  // Homework itemlarini saqlash: [{id, type, title}]
  const [selectedItems, setSelectedItems] = useState([]);

  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      deadline: null,
      show_results_immediately: true,
      assigned_groups: [],
    },
  });

  // Initial Data (Edit rejimi)
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description,
        deadline: initialData.deadline ? new Date(initialData.deadline) : null,
        show_results_immediately: initialData.show_results_immediately,
        assigned_groups: initialData.assigned_groups || [],
      });

      // Itemsni formatlab statega yuklash
      const formattedItems =
        initialData.items?.map((item) => ({
          id:
            item.listening_mock ||
            item.reading_mock ||
            item.writing_mock ||
            item.quiz,
          type: item.quiz
            ? "quiz"
            : item.listening_mock
            ? "listening"
            : item.reading_mock
            ? "reading"
            : "writing",
          title: "", // Title API dan kelmasa editda ko'rinmaydi, lekin ID saqlanadi
        })) || [];
      setSelectedItems(formattedItems);
    }
  }, [initialData, reset]);

  const toggleItem = (item, type) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, { id: item.id, type, title: item.title }];
    });
  };

  const submitFn = async (data) => {
    try {
      setReqLoading(true);

      // JSON Payload formatlash
      const payload = {
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        show_results_immediately: data.show_results_immediately,
        assigned_groups: data.assigned_groups.map((g) => g.id || g),
        items: selectedItems.map((item, index) => ({
          order: index + 1,
          [`${item.type}_mock`]: item.type !== "quiz" ? item.id : undefined,
          quiz: item.type === "quiz" ? item.id : undefined,
        })),
      };

      const url = "/tasks/homeworks/";
      let response;
      if (id) {
        response = await authAxios.patch(`${url}${id}/`, payload);
      } else {
        response = await authAxios.post(url, payload);
      }

      toast.success(intl.formatMessage({ id: "Success" }));
      closeOffcanvas("taskHomeworksGeneratorOffcanvas", response?.data);
    } catch (e) {
      toast.error("Error submitting homework");
    } finally {
      setReqLoading(false);
    }
  };

  // Guruhlarni olish (Select uchun)
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

  return (
    <div className="flex flex-col gap-6 p-1">
      <form onSubmit={handleSubmit(submitFn)} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            register={register}
            name="title"
            title={intl.formatMessage({ id: "Title" })}
            placeholder={"Homework: for today"}
            required
            error={errors?.title?.message}
          />
          <Input
            register={register}
            name="description"
            placeholder={"You should spend about 40 minutes for test"}
            title={intl.formatMessage({ id: "Description" })}
          />

          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DateTimePickerField {...field} title="Deadline" required />
            )}
          />

          <Controller
            name="assigned_groups"
            control={control}
            render={({ field }) => (
              <MultiSelect {...field} options={groups || []} title="Groups" />
            )}
          />
        </div>

        {/* Mocks and Quizzes Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HomeworkItemSelector
            title="Listening"
            type="listening"
            endpoint="/mocks/listening/"
            selectedItems={selectedItems}
            onToggle={toggleItem}
            locale={router.locale}
          />
          <HomeworkItemSelector
            title="Reading"
            type="reading"
            endpoint="/mocks/reading/"
            selectedItems={selectedItems}
            onToggle={toggleItem}
            locale={router.locale}
          />
          <HomeworkItemSelector
            title="Writing"
            type="writing"
            endpoint="/mocks/writing/"
            selectedItems={selectedItems}
            onToggle={toggleItem}
            locale={router.locale}
          />
          <HomeworkItemSelector
            title="Quizzes"
            type="quiz"
            endpoint="/quizzes/"
            selectedItems={selectedItems}
            onToggle={toggleItem}
            locale={router.locale}
          />
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
          <ToggleSwitch
            control={control}
            name="show_results_immediately"
            label="Immediate Results"
          />
          <button
            type="submit"
            className="bg-main text-white px-10 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            {reqLoading && <ButtonSpinner />}{" "}
            {intl.formatMessage({ id: "Save Homework" })}
          </button>
        </div>
      </form>
    </div>
  );
}
