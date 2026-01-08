import { Select } from "@/components/custom/details";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo } from "react"; // useMemo qo'shildi
import { Controller, useForm } from "react-hook-form";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function FilterLeaderboard() {
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

  const { data: examsResults } = useSWR(
    ["/tasks/exams/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  const { data: rawGroups } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
      fetcher(
        `${url}?page_size=all`,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  const formattedExams = useMemo(() => {
    const allOption = {
      id: "all",
      name: intl.formatMessage({ id: "All exams" }),
    };

    if (examsResults && Array.isArray(examsResults)) {
      return [allOption, ...examsResults];
    }
    return [allOption];
  }, [examsResults, intl]);

  const formattedGroups = useMemo(() => {
    const allOption = {
      id: "all",
      name: intl.formatMessage({ id: "All groups" }),
    };

    if (rawGroups && Array.isArray(rawGroups)) {
      return [allOption, ...rawGroups];
    }
    return [allOption];
  }, [rawGroups, intl]);

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Chap taraf: Filtrlar */}
      <div className="flex flex-row items-center gap-5">
        <p className="text-textPrimary text-sm font-semibold whitespace-nowrap">
          {intl.formatMessage({ id: "Filters" })}:
        </p>
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="w-[220px]">
            <Controller
              name="exam_task_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || router.query.exam_task_id}
                  onChange={(val) => {
                    field.onChange(val);
                    updateParams("exam_task_id", val === "all" ? "" : val);
                  }}
                  title={""}
                  placeholder={intl.formatMessage({ id: "Exams" })}
                  options={formattedExams}
                  error={errors.task_id?.message}
                  ui_type="filter"
                />
              )}
            />
          </div>
          <div className="w-[220px]">
            <Controller
              name="group_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || router.query.task_id}
                  onChange={(val) => {
                    field.onChange(val);
                    updateParams("group_id", val === "all" ? "" : val);
                  }}
                  title={""}
                  placeholder={intl.formatMessage({ id: "Groups" })}
                  options={formattedGroups}
                  error={errors.task_id?.message}
                  ui_type="filter"
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
