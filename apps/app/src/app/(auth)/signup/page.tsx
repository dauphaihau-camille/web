import { Suspense } from 'react';

import { SignupForm } from '../login/_components/signup-form';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
