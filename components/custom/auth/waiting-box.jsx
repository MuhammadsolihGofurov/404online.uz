import Link from "next/link";
import { Loader2 } from "lucide-react"; // loading icon
import { useIntl } from "react-intl";
import { LOGIN_URL } from "@/mock/router";

export default function WaitingBox() {
  const intl = useIntl();
  return (
    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 rounded-3xl w-full sm:w-[432px] text-white overflow-hidden">
      {/* Animated gradient background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-main/20 via-blue-500/10 to-transparent animate-pulse rounded-3xl"></div>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center z-10">
        <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center mb-5 animate-spin-slow">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>

        <h1 className="text-2xl font-semibold tracking-wide">
          {intl.formatMessage({ id: "Waiting..." })}
        </h1>

        <p className="pt-3 pb-6 text-sm text-white/80 max-w-xs leading-relaxed">
          {intl.formatMessage({
            id: "Your request is sending. Please wait a bit, then you can login to the platform.",
          })}
        </p>

        <Link
          href={LOGIN_URL}
          title="Login"
          className="px-6 py-2 rounded-full bg-gradient-to-r from-main to-blue-500 text-white text-sm font-medium shadow-lg hover:opacity-90 transition-all duration-300"
        >
          {intl.formatMessage({ id: "Login" })}
        </Link>
      </div>
    </div>
  );
}
