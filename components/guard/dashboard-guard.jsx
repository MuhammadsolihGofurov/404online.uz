// src/utils/withAuthGuard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { PRIVATEAUTHKEY } from "@/mock/keys";
import { ROLES } from "@/utils/constants/roles";

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
          setTimeout(() => {
            setLoading(false);
          }, 750)
        }
      };

      checkAuth();
    }, [router]);

    return <WrappedComponent {...props} user={user} loading={loading}/>;
  };
}
