// src/utils/withAuthGuard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { LOGIN_URL } from "@/mock/router";

export function withAuthGuard(WrappedComponent, allowedRoles = []) {
  return function GuardedPage(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const accessToken = localStorage.getItem(PRIVATEAUTHKEY);
          //   if (!accessToken) {
          //     router.replace(LOGIN_URL);
          //     return;
          //   }

          // 🔹 /accounts/me/ orqali foydalanuvchini olish
          const { data } = await authAxios.get("/accounts/me/");

          setUser(data);

          // 🔹 Agar allowedRoles belgilangan bo‘lsa, tekshirish
          if (allowedRoles.length > 0 && !allowedRoles.includes(data.role)) {
            router.replace("/unauthorized");
            return;
          }
        } catch (error) {
          console.error("Auth guard error:", error);
          //   router.replace(LOGIN_URL);
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    // if (loading) {
    //   return (
    //     <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-700">
    //       <div className="flex flex-col items-center gap-3">
    //         <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    //         <p>Checking authorization...</p>
    //       </div>
    //     </div>
    //   );
    // }

    return <WrappedComponent {...props} user={user} />;
  };
}
