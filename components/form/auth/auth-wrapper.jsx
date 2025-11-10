import React from "react";
import { LoginForm } from ".";

export default function AuthWrapper({ image = "", page = "login" }) {
  return (
    <main
      className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* login or register */}
      <div className="bg-white relative z-[1] rounded-3xl p-8 w-[432px]">
        {page === "login" ? <LoginForm /> : <></>}
      </div>
    </main>
  );
}
