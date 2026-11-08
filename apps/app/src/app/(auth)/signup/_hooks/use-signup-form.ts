'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiError } from '@shared/lib/api-error';

import { register } from '@/domains/auth';
import { usePostAuthRedirect } from '../../_hooks/use-post-auth-redirect';
import {
  signupFormSchema,
  type SignupFormValues,
} from '../_forms/signup.scheme';

export function useSignupForm() {
  const [isVerifyRedirecting, setIsVerifyRedirecting] = useState(false);
  const { redirectAfterAuth } = usePostAuthRedirect({
    fallbackAuthPath: 'signup',
  });
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async () => {
      setIsVerifyRedirecting(true);
      await redirectAfterAuth();
    },
    onError: (error) => {
      setIsVerifyRedirecting(false);
      form.setError('root', {
        message: buildSignupErrorMessage(error),
      });
    },
  });

  function handleSignup(values: SignupFormValues) {
    form.clearErrors('root');
    mutation.mutate(values);
  }

  return {
    form,
    handleSignup,
    isVerifyRedirecting,
    mutation,
  };
}

function buildSignupErrorMessage(error: unknown) {
  const apiError = getApiError(error);

  if (apiError?.code === 'RATE_LIMIT_EXCEEDED') {
    return 'Too many signup attempts. Please wait a moment and try again.';
  }

  if (apiError?.code === 'EMAIL_ALREADY_REGISTERED') {
    return 'This email already has an account. Log in instead.';
  }

  if (error instanceof HTTPError) {
    if (error.response.status === 429) {
      return 'Too many signup attempts. Please wait a moment and try again.';
    }

    if (error.response.status === 409) {
      return 'This email already has an account. Log in instead.';
    }
  }

  return 'Signup failed.';
}
