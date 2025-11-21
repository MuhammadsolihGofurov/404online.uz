import React from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import Select from "@/components/custom/details/select";

// Task type options
const TASK_TYPES = [
  { value: "EXAM_MOCK", name: "Exam Mock" },
  { value: "PRACTICE_MOCK", name: "Practice Mock" },
  { value: "CUSTOM_MOCK", name: "Custom Mock" },
  { value: "QUIZ", name: "Quiz" },
];

export default function TasksFilter({ filter, setFilter }) {
  const intl = useIntl();
  const router = useRouter();

  // Fetch groups for filter
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

  // Fetch students for filter
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

  // Format options for Select component
  const taskTypeOptions = [
    { value: "", name: intl.formatMessage({ id: "All Task Types" }) },
    ...TASK_TYPES,
  ];

  const groupSelectOptions = [
    { value: "", name: intl.formatMessage({ id: "All Groups" }) },
    ...groupOptions.map((group) => ({
      value: group.id,
      name: group.name || group.id,
    })),
  ];

  const studentSelectOptions = [
    { value: "", name: intl.formatMessage({ id: "All Students" }) },
    ...studentOptions.map((student) => ({
      value: student.id,
      name: student.full_name || student.email || student.id,
    })),
  ];

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col sm:flex-row flex-wrap sm:items-center gap-5">
      <p className="text-textPrimary text-sm font-semibold">
        {intl.formatMessage({ id: "Filters" })}:
      </p>

      {/* Task Type Filter */}
      <div className="w-full sm:w-auto sm:min-w-[180px]">
        <Select
          title=""
          placeholder={intl.formatMessage({ id: "Task Type" })}
          options={taskTypeOptions}
          value={filter?.task_type || ""}
          onChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              task_type: value || undefined,
            }))
          }
        />
      </div>

      {/* Assigned Group Filter */}
      <div className="w-full sm:w-auto sm:min-w-[180px]">
        <Select
          title=""
          placeholder={intl.formatMessage({ id: "Assigned Group" })}
          options={groupSelectOptions}
          value={filter?.assigned_group || ""}
          onChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              assigned_group: value || undefined,
            }))
          }
        />
      </div>

      {/* Assigned Student Filter */}
      <div className="w-full sm:w-auto sm:min-w-[180px]">
        <Select
          title=""
          placeholder={intl.formatMessage({ id: "Assigned Student" })}
          options={studentSelectOptions}
          value={filter?.assigned_student || ""}
          onChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              assigned_student: value || undefined,
            }))
          }
        />
      </div>
    </div>
  );
}

