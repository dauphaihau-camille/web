import { LoginForm } from './_components/login-form';

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 px-4 py-28">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-5xl font-medium tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your email and continue in Camille.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
