import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * 匹配所有需要保护的路由
     * 除了登录页面和 API 路由
     */
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 