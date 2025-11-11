import React from "react";
import {
  ForgotPasswordUpdate,
  ForgotPasswordUsername,
  LoginForm,
  RegisterForm,
  WaitingBox,
} from ".";
import { useIntl } from "react-intl";
import Link from "next/link";
import { LOGIN_URL } from "@/mock/router";

export default function AuthWrapper({ image = "", page = "login" }) {
  const intl = useIntl();
  const renderPage = () => {
    switch (page) {
      case "login":
        return <LoginForm />;
      case "register":
        return <RegisterForm />;
      case "forgot-password-username":
        return <ForgotPasswordUsername />;
      case "forgot-password-password":
        return <ForgotPasswordUpdate />;
      default:
        return <></>;
    }
  };

  return (
    <main
      className={`relative w-full min-h-screen bg-cover bg-center flex ${
        page !== "register" ? "items-center" : ""
      } justify-center p-5`}
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* login, register, forgot password form box */}
      {page !== "waiting" ? (
        <div className="bg-white relative z-[1] rounded-3xl p-5 sm:p-8 w-full sm:w-[432px]">
          {renderPage()}
        </div>
      ) : (
        <WaitingBox />
      )}
    </main>
  );
}
