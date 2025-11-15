import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Settings, LogOut, X } from "lucide-react";
import { useIntl } from "react-intl";
import { DASHBOARD_URL, LOGIN_URL } from "@/mock/router";
import { SidebarLinks } from "./details";
import { useModal } from "@/context/modal-context";
import {
  PRIVATEAUTHKEY,
  PRIVATEREFRESHKEY,
  PRIVATEUSERTYPE,
} from "@/mock/keys";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

export default function Sidebar({
  user,
  isOpen,
  closeSidebar,
  mobile = false,
}) {
  const router = useRouter();
  const intl = useIntl();
  const { openModal } = useModal();

  const handleLogout = () => {
    openModal(
      "confirmModal",
      {
        title: "Logout",
        description: intl.formatMessage({
          id: "Are you sure you want to logout?",
        }),
        onConfirm: async () => {
          try {
            await authAxios.post("/accounts/logout/", {
              refresh: localStorage.getItem(PRIVATEREFRESHKEY),
            });

            // localStorage tozalash
            localStorage.removeItem(PRIVATEAUTHKEY);
            localStorage.removeItem(PRIVATEREFRESHKEY);
            localStorage.removeItem(PRIVATEUSERTYPE);

            toast.success(
              intl.formatMessage({ id: "Successfully logged out!" })
            );

            setTimeout(() => {
              router.push(LOGIN_URL);
            }, 750);
          } catch (e) {
            toast.error(intl.formatMessage({ id: "Logout failed!" }));
          }
        },
      },
      "short"
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/40 z-30 sm:hidden`}
          onClick={closeSidebar}
        />
      )}

      <aside
        className={` ${mobile ? "sm:hidden block" : ""}
          bg-white shadow-lg flex flex-col transition-transform duration-300
          fixed top-0 left-0 z-40 h-screen
          ${
            isOpen
              ? "w-64 translate-x-0 sm:translate-x-0 sm:relative"
              : "w-0 overflow-hidden -translate-x-full"
          } 
        `}
      >
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <Link href={DASHBOARD_URL}>
            <img src="/images/logo-light.png" alt="logo" className="w-40" />
          </Link>

          {/* Mobile close button */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 absolute top-3 right-3"
            onClick={closeSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <SidebarLinks userRole={user?.role}/>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 border-t border-gray-200 transition-all duration-200"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>
    </>
  );
}
