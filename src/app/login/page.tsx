import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-12 text-center text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
