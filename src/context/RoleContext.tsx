"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, DemoUser, DEMO_USERS } from "@/types";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  nationalId: string;
  fullName: string;
  role: UserRole;
  roleTitleFa: string;
  avatarUrl: string;
  schoolName?: string;
  targetRoute?: string;
}

interface RoleContextType {
  currentRole: UserRole;
  currentUser: DemoUser;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  login: (nationalId: string, password: string) => Promise<{ success: boolean; error?: string; targetRoute?: string }>;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("TEACHER");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // پیش‌فرض فعال برای دمو
  const router = useRouter();

  useEffect(() => {
    // بازخوانی نشست ذخیره‌شده کاربر
    try {
      const savedSession = localStorage.getItem("danatak_auth_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as AuthUser;
        setAuthUser(parsed);
        setCurrentRole(parsed.role);
        setIsAuthenticated(true);
        return;
      }

      // در صورت نبود سشن، نقش ذخیره‌شده پیشین دمو
      const savedRole = localStorage.getItem("demo_active_role") as UserRole;
      if (savedRole && DEMO_USERS[savedRole]) {
        setCurrentRole(savedRole);
        setAuthUser({
          id: DEMO_USERS[savedRole].id,
          nationalId: DEMO_USERS[savedRole].nationalId,
          fullName: DEMO_USERS[savedRole].fullName,
          role: savedRole,
          roleTitleFa: DEMO_USERS[savedRole].roleTitleFa,
          avatarUrl: DEMO_USERS[savedRole].avatarUrl,
          schoolName: DEMO_USERS[savedRole].schoolName,
        });
      }
    } catch (e) {
      console.error("Session restore error:", e);
    }
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("demo_active_role", role);
    const demoUser = DEMO_USERS[role];
    if (demoUser) {
      const updatedAuth: AuthUser = {
        id: demoUser.id,
        nationalId: demoUser.nationalId,
        fullName: demoUser.fullName,
        role: role,
        roleTitleFa: demoUser.roleTitleFa,
        avatarUrl: demoUser.avatarUrl,
        schoolName: demoUser.schoolName,
      };
      setAuthUser(updatedAuth);
      localStorage.setItem("danatak_auth_session", JSON.stringify(updatedAuth));
    }
  };

  const login = async (nationalId: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "ورود ناموفق بود" };
      }

      const loggedUser = data.user as AuthUser;
      setAuthUser(loggedUser);
      setCurrentRole(loggedUser.role);
      setIsAuthenticated(true);
      localStorage.setItem("danatak_auth_session", JSON.stringify(loggedUser));
      localStorage.setItem("demo_active_role", loggedUser.role);

      return {
        success: true,
        targetRoute: loggedUser.targetRoute || "/",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "خطای ارتباط با سرور" };
    }
  };

  const logout = () => {
    localStorage.removeItem("danatak_auth_session");
    setAuthUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  // کاربر فعال جهت حفظ سازگاری با تمام کامپوننت‌های قبلی
  const currentUser: DemoUser = authUser
    ? {
        id: authUser.id,
        nationalId: authUser.nationalId,
        fullName: authUser.fullName,
        role: authUser.role,
        roleTitleFa: authUser.roleTitleFa,
        avatarUrl: authUser.avatarUrl,
        schoolName: authUser.schoolName || "دبیرستان علامه حلی ۱",
        description: authUser.schoolName || "دبیرستان علامه حلی ۱",
      }
    : DEMO_USERS[currentRole] || DEMO_USERS.TEACHER;

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        authUser,
        isAuthenticated,
        setRole,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
