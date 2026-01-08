import { Select } from "@/components/custom/details";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo } from "react"; // useMemo qo'shildi
import { Controller, useForm } from "react-hook-form";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function FilterMyResults() {
  const { updateParams, findParams } = useParams();
  const intl = useIntl();
  const router = useRouter();

  const {
    control,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      task_id: router.query.task_id || "",
    },
  });

  const type = findParams("type");

  const queries = [
    { id: 1, title: "Homeworks", type: "HOMEWORK" },
    { id: 2, title: "Exams", type: "EXAM" },
  ];

  const handleTabChange = (type) => {
    updateParams("type", type);
  };

  const { data: examsResults } = useSWR(
    ["/tasks/", type, router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}${type === "EXAM" ? "exams" : "homeworks/"}?page_size=all`,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Groups ma'lumotiga "All" variantini qo'shish
  const formattedExams = useMemo(() => {
    const allOption = {
      id: "all",
      name: intl.formatMessage({ id: "All" }),
    };

    if (examsResults && Array.isArray(examsResults)) {
      return [allOption, ...examsResults];
    }
    return [allOption];
  }, [examsResults, intl]);

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Chap taraf: Filtrlar */}
      <div className="flex flex-row items-center gap-5">
        <p className="text-textPrimary text-sm font-semibold whitespace-nowrap">
          {intl.formatMessage({ id: "Filters" })}:
        </p>
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {queries.map((item) => {
            const currentQueryType = router.query.type;
            const isActive = currentQueryType == item.type;

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleTabChange(item.type)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-xl border text-xs sm:text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-main text-white border-main"
                    : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
        <div className="w-[220px]">
          <Controller
            name="task_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || router.query.task_id}
                onChange={(val) => {
                  field.onChange(val);
                  updateParams("task_id", val === "all" ? "" : val);
                }}
                title={""}
                placeholder={type == "EXAM" ? "Exams" : "Homeworks"}
                options={formattedExams}
                error={errors.task_id?.message}
                ui_type="filter"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
