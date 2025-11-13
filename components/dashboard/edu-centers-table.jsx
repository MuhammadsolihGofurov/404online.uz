import fetcher from "@/utils/fetcher";
import { formatDateToShort } from "@/utils/funcs";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { CentersTableSkeleton } from "../skeleton";
import Pagination from "../custom/pagination";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";

export default function EduCenterTable({ loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentPage = parseInt(findParams("page")) || 1;

  const { data: centers, isLoading } = useSWR(
    ["/owner/centers/", router.locale, currentPage, modalClosed],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page=${page}&page_size=10`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (loading || isLoading) {
    return <CentersTableSkeleton />;
  }
  return (
    <div>
      <div className="w-full overflow-x-hidden overflow-y-hidden min-h-[620px] bg-white rounded-2xl">
        <table className="w-full text-textPrimary rounded-2xl">
          <thead>
            <tr className="border-b border-dashboard-bg">
              <th className="text-sm font-bold text-center p-4 w-[5%]">№</th>
              <th className="text-sm font-bold p-4 w-[30%] text-start">
                {intl.formatMessage({ id: "Users" })}
              </th>
              <th className="text-sm font-bold p-4 w-[25%] text-start">
                {intl.formatMessage({ id: "Admins" })}
              </th>
              <th className="text-sm font-bold p-4 w-[15%] text-start">
                {intl.formatMessage({ id: "Teacher’s count" })}
              </th>
              <th className="text-sm font-bold p-4 w-[20%] text-start">
                {intl.formatMessage({ id: "Date" })}
              </th>
              <th className="text-sm font-bold p-4 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {centers?.results?.map((item, index) => {
              return (
                <tr
                  key={index}
                  className="border-b border-b-dashboardBg last:border-b-transparent"
                >
                  <td className="text-sm p-5 text-center font-medium ">
                    {item?.id}
                  </td>
                  <td className="text-sm p-5 font-medium font-poppins">
                    {item?.name}
                  </td>
                  <td className="text-sm p-5 font-medium"></td>
                  <td className="text-sm p-5 font-medium"></td>
                  <td className="text-sm p-5 font-medium">
                    {formatDateToShort(item?.created_at)}
                  </td>
                  <td>
                    <button type="button">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.0001 10.833C10.4603 10.833 10.8334 10.4599 10.8334 9.99967C10.8334 9.53944 10.4603 9.16634 10.0001 9.16634C9.53984 9.16634 9.16675 9.53944 9.16675 9.99967C9.16675 10.4599 9.53984 10.833 10.0001 10.833Z"
                          stroke="#1D2939"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.0001 4.99967C10.4603 4.99967 10.8334 4.62658 10.8334 4.16634C10.8334 3.7061 10.4603 3.33301 10.0001 3.33301C9.53984 3.33301 9.16675 3.7061 9.16675 4.16634C9.16675 4.62658 9.53984 4.99967 10.0001 4.99967Z"
                          stroke="#1D2939"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.0001 16.6663C10.4603 16.6663 10.8334 16.2932 10.8334 15.833C10.8334 15.3728 10.4603 14.9997 10.0001 14.9997C9.53984 14.9997 9.16675 15.3728 9.16675 15.833C9.16675 16.2932 9.53984 16.6663 10.0001 16.6663Z"
                          stroke="#1D2939"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination count={centers?.count} />
    </div>
  );
}
