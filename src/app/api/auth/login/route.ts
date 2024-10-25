import { Login } from "@/zodSchema/authSchema";
import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { apiClient } from "../../apiClient";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const loginData: Login = await request.json();
    // Taskify API를 통해 로그인 시도
    const response = await apiClient.post("/auth/login", loginData);

    if (response.data.accessToken) {
      // 로그인 성공 시 쿠키에 accessToken 설정
      cookies().set("accessToken", response.data.accessToken, {
        httpOnly: true, // 브라우저에서 접근 불가
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // CSRF 방지
        maxAge: 60 * 3000, // 30분 동안 유효
        path: "/",
      });

      // 사용자 정보 반환
      return NextResponse.json({ user: response.data.user }, { status: 200 });
    }

    return NextResponse.json({ message: "로그인 실패" }, { status: 401 });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error(error);
      if (error.response) {
        return NextResponse.json({ message: error.response.data.message }, { status: error.response.status });
      }
    }
    return NextResponse.json({ message: "로그인 실패" }, { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {
  try {
    // 쿠키에서 accessToken 가져오기
    const accessToken = cookies().get("accessToken");

    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // user/profile API를 호출하여 사용자 정보 가져오기
    const response = await axios.get(`${request.nextUrl.origin}/api/user/profile`, {
      headers: {
        Cookie: `accessToken=${accessToken.value}`,
      },
    });

    if (response.status === 200) {
      return NextResponse.json({ user: response.data.user }, { status: 200 });
    } else {
      // user/profile API에서 오류 발생 시
      return NextResponse.json({ user: null }, { status: 200 });
    }
  } catch (error) {
    console.error("사용자 정보 조회 실패:", error);
    if (axios.isAxiosError(error)) {
      // axios 에러 처리
      return NextResponse.json(
        { message: error.response?.data?.message || "사용자 정보 조회 실패" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json({ message: "사용자 정보 조회 실패" }, { status: 500 });
  }
};
