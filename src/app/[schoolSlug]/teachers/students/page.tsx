"use client";

import React from "react";
import AssignedStudents from "./AssignedStudents";
import { useParams } from "next/navigation";

export default function StudentsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  return <AssignedStudents schoolSlug={schoolSlug} />;
}
