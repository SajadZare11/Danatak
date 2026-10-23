"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ZeroCheatExamRoom } from "@/components/exam/ZeroCheatExamRoom";

export default function StudentExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<{
    exam: any;
    questions: any[];
    attempt: any;
    studentInfo: any;
  } | null>(null);

  const fetchExam = async () => {
    try {
      const studentRes = await fetch("/api/student/dashboard");
      const studentData = await studentRes.json();
      const studentId = studentData?.student?.id || "";

      const res = await fetch(`/api/exams/${id}?studentId=${studentId}`);
      const data = await res.json();
      setExamData(data);
    } catch (err) {
      console.error("Failed to load exam:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchExam();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">در حال آماده‌سازی و اعتبارسنجی اتاق آزمون...</p>
      </div>
    );
  }

  if (!examData || !examData.exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-lg font-black text-slate-800">آزمون مورد نظر یافت نشد</h2>
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
    <ZeroCheatExamRoom
      exam={examData.exam}
      questions={examData.questions}
      studentId={examData.studentInfo?.id || "student-demo"}
      studentName={examData.studentInfo?.fullName || "علی رضایی"}
      studentNationalId={examData.studentInfo?.nationalId || "۰۰۲۲۳۳۴۴۵۵"}
      schoolName={examData.studentInfo?.schoolName || "دبیرستان علامه حلی ۱"}
      initialAttempt={examData.attempt}
      onExit={() => router.push("/student")}
    />
  );
}
