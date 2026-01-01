import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { ExamInterface } from "@/components/dashboard/student-tasks/exam-interface";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useEffect } from "react";

function StudentTaskDetailPage({ info, user, loading }) {
  const router = useRouter();
  const { id } = router.query;

  const { data: task, isLoading } = useSWR(
    id ? [`/students/tasks/${id}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Prevent leaving the page during exam/homework
  useEffect(() => {
    if (!task || isLoading) return;

    const handleBeforeUnload = (e) => {
      if (task?.submission_status === "IN_PROGRESS") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handleRouteChange = (url) => {
      if (task?.submission_status === "IN_PROGRESS") {
        const confirmLeave = window.confirm(
          "You are currently taking an exam/homework. Are you sure you want to leave? Your progress may be lost."
        );
        if (!confirmLeave) {
          router.events.emit("routeChangeError");
          throw new Error("Route change aborted by user");
        }
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [task, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${task?.title} - ${info?.seo_home_title}`}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <ExamInterface task={task} user={user} />
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Task",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(StudentTaskDetailPage, ["STUDENT"]);
