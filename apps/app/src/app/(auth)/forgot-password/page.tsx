import { Suspense } from 'react';

import { ForgotPasswordForm } from './_components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
