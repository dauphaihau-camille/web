'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  authKeys,
  authRoutes,
  currentUserQueryOptions,
  getPostLoginRedirectTarget,
  login,
} from '@/domains/auth';
import {
  myWorkspaceListQueryOptions,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';

import { loginFormSchema, type LoginFormValues } from '../_forms/login.scheme';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const redirectTarget = getPostLoginRedirectTarget(
    searchParams.get('redirectTo') ?? searchParams.get('from'),
  );

  async function resolvePostLoginPath() {
    const currentUser = await queryClient.fetchQuery(currentUserQueryOptions());

    if (!currentUser) {
      return authRoutes.login();
    }

    if (redirectTarget !== workspaceRoutes.entry()) {
      return redirectTarget;
    }

    const workspaces = await queryClient.fetchQuery(myWorkspaceListQueryOptions());

    return workspaces[0]
      ? workspaceRoutes.detail(workspaces[0].slug)
      : workspaceRoutes.entry();
  }

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: 'member@example.com',
      password: 'password123',
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.all,
      });
      const postLoginPath = await resolvePostLoginPath();
      window.location.assign(postLoginPath);
    },
    onError: (error) => {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Login failed.',
      });
    },
  });

  function handleSubmit(values: LoginFormValues) {
    form.clearErrors('root');
    loginMutation.mutate(values);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <FieldGroup className="gap-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  className="h-11 px-3"
                  placeholder="Enter your email address..."
                />
                <FieldDescription>Use the seeded demo account or your local test user.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  className="h-11 px-3"
                />
                <FieldDescription>Passwords shorter than 8 characters are blocked client-side.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {form.formState.errors.root?.message
            ? (
              <Field data-invalid>
                <FieldError>{form.formState.errors.root.message}</FieldError>
              </Field>
            )
            : null}
          <Button
            type="submit"
            disabled={loginMutation.isPending || form.formState.isSubmitting}
            className="h-11 w-full font-medium"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Continue with email'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
