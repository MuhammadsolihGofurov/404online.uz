import { Select } from "@/components/custom/details";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo } from "react"; // useMemo qo'shildi
import { Controller, useForm } from "react-hook-form";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function FilterExams() {
  const { updateParams } = useParams();
  const intl = useIntl();
  const router = useRouter();

  const {
    control,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      group_id: router.query.group_id || "", // URL dagi qiymatni default olish
    },
  });

  const queries = [
    { id: 1, title: "Graded", is_graded: "graded" },
    { id: 2, title: "Not graded", is_graded: "not_graded" },
  ];

  const handleTabChange = (type) => {
    updateParams("is_graded", type);
  };

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

  // Groups ma'lumotiga "All" variantini qo'shish
  const formattedGroups = useMemo(() => {
    const allOption = {
      id: "all",
      name: intl.formatMessage({ id: "All" }),
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
          {queries.map((item) => {
            const currentQueryType = router.query.is_graded;
            const isActive = currentQueryType === item.is_graded;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.is_graded)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-xl border text-xs sm:text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-main text-white border-main"
                    : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
                }`}
              >
                {intl.formatMessage({ id: item.title })}
              </button>
            );
          })}
        </div>
      </div>

      {/* o'ng tomon select groups */}
      <div className="w-[230px]">
        <Controller
          name="group_id"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              value={field.value || router.query.group_id} // Sync with URL
              onChange={(val) => {
                field.onChange(val);
                // Agar 'all' tanlansa, paramsdan o'chirib yuborish yoki 'all' deb yuborish
                updateParams("group_id", val === "all" ? "" : val);
              }}
              title={""}
              placeholder={intl.formatMessage({ id: "Groups" })}
              options={formattedGroups} // Yangilangan array
              error={errors.group_id?.message}
            />
          )}
        />
      </div>
    </div>
  );
}
