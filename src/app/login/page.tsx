import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="y-brand w-12 h-12 text-xl">Y</span>
            <h1 className="font-harabara text-4xl font-black">
              <span className="text-neon drop-shadow-[0_0_20px_rgba(222,255,0,0.6)]">
                The Y
              </span>{" "}
              <span className="text-white drop-shadow-[0_0_10px_rgba(245,244,244,0.3)]">
                CRM
              </span>
            </h1>
          </div>
          <p className="text-white/60 text-sm">Logga in för att fortsätta</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
