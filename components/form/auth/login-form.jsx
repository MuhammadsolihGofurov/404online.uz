import Link from "next/link";
import React from "react";
import { useIntl } from "react-intl";

export default function LoginForm() {
  const intl = useIntl();

  return (
    <form className="w-full flex flex-col gap-8 text-center">
      <h1 className="text-3xl font-semibold text-textPrimary capitalize">
        {intl.formatMessage({ id: "login" })}
      </h1>
      <div className="flex flex-col"></div>
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          className="rounded-xl bg-main text-white w-full p-4 hover:bg-blue-800 transition-colors duration-200"
        >
          Submit
        </button>
        <p className="text-textSecondary text-base">
          Forgot your password:{" "}
          <Link href={"/auth/change-password"} title="change password" className="text-main underline hover:text-blue-800 transition-colors duration-200">
            change password
          </Link>
        </p>
      </div>
    </form>
  );
}
