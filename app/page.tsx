import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
export default async function Home() {
  if (!process.env.DATABASE_URL) redirect("/setup");
  const user = await getUser();
  redirect(!user ? "/login" : user.role === "admin" ? "/admin" : "/portal");
}
