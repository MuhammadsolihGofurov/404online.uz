import { Dropdown } from "@/components/custom/details";
import { useModal } from "@/context/modal-context";
import { DASHBOARD_URL } from "@/mock/router";
import { Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { FilterButtonItem } from "./filters";

export default function WrapperHeader({
  title,
  body,
  isLink = false,
  url = DASHBOARD_URL,
  isButton = false,
  name = "Muhammadsolih",
  buttonText = "",
  buttonFunc,
  modalType,
  isIcon = false,
  isDropdown = false,
  dropdownList = [],
}) {
  const intl = useIntl();
  const { openModal } = useModal();

  return (
    <div
      className={`w-full flex items-end ${
        isButton || isDropdown ? "justify-between" : "justify-start"
      }`}
    >
      <div className="flex flex-col sm:gap-1">
        <Link href={url} className="text-menu font-normal text-sm sm:text-base">
          {isLink
            ? intl.formatMessage({ id: body })
            : `${intl.formatMessage({ id: "Hi" })} ${name}`}
        </Link>
        <h1 className="font-semibold text-xl sm:text-2xl text-textPrimary">
          {intl.formatMessage({ id: title })}
        </h1>
      </div>
      {isButton ? (
        <button
          type="button"
          onClick={() =>
            modalType ? openModal(buttonFunc, {}, modalType) : buttonFunc()
          }
          className="flex items-center gap-1 border border-[#E5E7EB] py-2 px-4 rounded-md bg-white text-xs sm:text-sm text-textPrimary font-normal"
        >
          {!isIcon ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.99992 3.33301V12.6663M3.33325 7.99967H12.6666"
                stroke="#364749"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <CheckCheck className="w-4 text-textPrimary" />
          )}

          <span>{intl.formatMessage({ id: buttonText })}</span>
        </button>
      ) : (
        <></>
      )}

      {isDropdown && (
        <Dropdown
          buttonContent={
            <div className="flex items-center gap-1 border border-[#E5E7EB] py-2 px-4 rounded-md bg-white text-xs sm:text-sm text-textPrimary font-normal">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.99992 3.33301V12.6663M3.33325 7.99967H12.6666"
                  stroke="#364749"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{intl.formatMessage({ id: buttonText })}</span>
            </div>
          }
        >
          {dropdownList?.map((item) => {
            return (
              <Link href={item?.url} key={item?.id} className="w-full p-3 text-sm">
                {item?.title}
              </Link>
            );
          })}
        </Dropdown>
      )}
    </div>
  );
}
