"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentAssignmentView, AssignmentDetail, QuestionDetail } from "@/components/student/StudentAssignmentView";

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [assignmentData, setAssignmentData] = useState<{
    assignment: AssignmentDetail;
    questions: QuestionDetail[];
    submission: any;
  } | null>(null);

  const fetchAssignment = async () => {
    try {
      // استفاده از شناسه دانش‌آموز نمونه علی رضایی
      const studentRes = await fetch("/api/student/dashboard");
      const studentData = await studentRes.json();
      const studentId = studentData?.student?.id || "";

      const res = await fetch(`/api/assignments/${id}?studentId=${studentId}`);
      const data = await res.json();
      setAssignmentData(data);
    } catch (err) {
      console.error("Failed to load assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAssignment();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال بارگذاری تکلیف...</p>
      </div>
    );
  }

  if (!assignmentData || !assignmentData.assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-black text-slate-800">تکلیف مورد نظر یافت نشد</h2>
        <button
          type="button"
          onClick={() => router.push("/student")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          بازگشت به پنل دانش‌آموز
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <StudentAssignmentView
        assignment={assignmentData.assignment}
        questions={assignmentData.questions}
        studentId="student-demo"
        studentName="علی رضایی"
        initialSubmission={assignmentData.submission}
        onBack={() => router.push("/student")}
        onSubmittedSuccess={() => fetchAssignment()}
      />
    </div>
  );
}
