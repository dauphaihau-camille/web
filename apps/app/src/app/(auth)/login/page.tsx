import { Suspense } from 'react';

import { AuthForm } from './_components/auth-form/auth-form';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
