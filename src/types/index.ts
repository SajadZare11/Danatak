export type UserRole = "TEACHER" | "STUDENT" | "PRINCIPAL" | "COUNSELOR" | "PARENT";

export interface DemoUser {
  id: string;
  nationalId: string;
  fullName: string;
  role: UserRole;
  roleTitleFa: string;
  avatarUrl: string;
  description: string;
  schoolName?: string;
}

export const DEMO_USERS: Record<UserRole, DemoUser> = {
  TEACHER: {
    id: "teacher-demo",
    nationalId: "0011223344",
    fullName: "استاد احسان محمدی",
    role: "TEACHER",
    roleTitleFa: "دبیر تخصصی ریاضی و حسابان",
    avatarUrl: "/api/avatar?name=احسان&bg=4338ca",
    description: "دبیرستان علامه حلی ۱ (تیزهوشان)",
    schoolName: "دبیرستان استعدادهای درخشان علامه حلی ۱",
  },
  STUDENT: {
    id: "student-demo",
    nationalId: "0022334455",
    fullName: "علی رضایی",
    role: "STUDENT",
    roleTitleFa: "دانش‌آموز پایه دوازدهم ریاضی الف",
    avatarUrl: "/api/avatar?name=علی&bg=059669",
    description: "معدل نوبت قبل: ۱۹.۴۲ - رشته ریاضی",
    schoolName: "دبیرستان استعدادهای درخشان علامه حلی ۱",
  },
  PRINCIPAL: {
    id: "principal-demo",
    nationalId: "0099887766",
    fullName: "دکتر مسعود حسینی",
    role: "PRINCIPAL",
    roleTitleFa: "مدیریت دبیرستان",
    avatarUrl: "/api/avatar?name=مسعود&bg=7c3aed",
    description: "دبیرستان استعدادهای درخشان علامه حلی ۱",
    schoolName: "دبیرستان استعدادهای درخشان علامه حلی ۱",
  },
  COUNSELOR: {
    id: "counselor-demo",
    nationalId: "0088776655",
    fullName: "خانم مریم صابری",
    role: "COUNSELOR",
    roleTitleFa: "مشاور ارشد تحصیلی و کنکور",
    avatarUrl: "/api/avatar?name=مریم&bg=d97706",
    description: "مرکز مشاوره تحصیلی و هدایت درسی",
    schoolName: "دبیرستان استعدادهای درخشان علامه حلی ۱",
  },
  PARENT: {
    id: "parent-demo",
    nationalId: "0077665544",
    fullName: "مهندس حسین رضایی",
    role: "PARENT",
    roleTitleFa: "ولی دانش‌آموز (پدر علی رضایی)",
    avatarUrl: "/api/avatar?name=حسین&bg=e11d48",
    description: "پورتال اولیا و امور شهریه",
    schoolName: "دبیرستان استعدادهای درخشان علامه حلی ۱",
  },
};
