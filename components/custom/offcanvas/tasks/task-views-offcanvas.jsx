import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { useOffcanvas } from "@/context/offcanvas-context";

export default function TaskViewsOffcanvas({}) {
  const intl = useIntl();
  const { closeOffcanvas } = useOffcanvas();

  return <div className="flex flex-col gap-6 p-1"></div>;
}
