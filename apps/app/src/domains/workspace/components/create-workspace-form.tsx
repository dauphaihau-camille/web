'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@shared/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@shared/components/ui/input-group';
import { Input } from '@shared/components/ui/input';
import {
  createWorkspace,
  suggestWorkspaceDomain,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';
import {
  createWorkspaceFormSchema,
  type CreateWorkspaceFormInput,
  type CreateWorkspaceFormValues,
} from '@/domains/workspace/forms/create-workspace-form-schema';

type CreateWorkspaceFormProps = {
  hideFormWhileRedirecting?: boolean;
  onSuccess?: () => void;
  onRedirectingChange?: (isRedirecting: boolean) => void;
  variant?: 'card' | 'plain';
};

export function CreateWorkspaceForm({
  hideFormWhileRedirecting = false,
  onSuccess,
  onRedirectingChange,
  variant = 'card',
}: CreateWorkspaceFormProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDomainManuallyEdited, setIsDomainManuallyEdited] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<
    CreateWorkspaceFormInput,
    undefined,
    CreateWorkspaceFormValues
  >({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });
  const name = useWatch({
    control: form.control,
    name: 'name',
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (workspace) => {
      setIsRedirecting(true);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.lists(),
      });
      onSuccess?.();
      router.push(workspaceRoutes.detail(workspace.slug));
    },
    onError: (error) => {
      setIsRedirecting(false);
      form.setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Could not create workspace.',
      });
    },
  });

  useEffect(() => {
    if (!isDomainManuallyEdited) {
      form.setValue('slug', suggestWorkspaceDomain(name), {
        shouldDirty: true,
      });
    }
  }, [form, isDomainManuallyEdited, name]);

  useEffect(() => {
    onRedirectingChange?.(isRedirecting);
  }, [isRedirecting, onRedirectingChange]);

  function handleSubmit(values: CreateWorkspaceFormValues) {
    setIsRedirecting(false);
    form.clearErrors('root');
    createWorkspaceMutation.mutate(values);
  }

  const isSubmitting =
    createWorkspaceMutation.isPending || form.formState.isSubmitting;
  const shouldHideForm = hideFormWhileRedirecting && isRedirecting;

  const formContent = shouldHideForm
    ? null
    : (
      <form
        className={variant === 'card' ? 'mt-4' : undefined}
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        <FieldGroup className="gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input
                  {...field}
                  id="workspace-name"
                  aria-invalid={fieldState.invalid}
                  disabled={isSubmitting}
                  placeholder="Camille Product"
                  size="lg"
                />
                {fieldState.invalid
                  ? (
                    <FieldError errors={[fieldState.error]} />
                  )
                  : null}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-domain">Domain</FieldLabel>
                <InputGroup className="h-9">
                  <InputGroupAddon>
                    <InputGroupText>localhost:4000/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id="workspace-domain"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                    placeholder="camille-product"
                    onChange={(event) => {
                      setIsDomainManuallyEdited(true);
                      field.onChange(suggestWorkspaceDomain(event.target.value));
                    }}
                  />
                </InputGroup>
                {fieldState.invalid
                  ? (
                    <FieldError errors={[fieldState.error]} />
                  )
                  : null}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="workspace-description"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                    placeholder="Shared docs and planning for the product team."
                    className="min-h-24 px-3 py-2"
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="text-xs text-muted-foreground">
                      {280 - (field.value?.length ?? 0)} characters left
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid
                  ? (
                    <FieldError errors={[fieldState.error]} />
                  )
                  : null}
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
          <Button disabled={isSubmitting} type="submit" size="lg">
            {createWorkspaceMutation.isPending
              ? 'Creating workspace...'
              : 'Create workspace'}
          </Button>
        </FieldGroup>
      </form>
    );

  if (variant === 'plain') {
    return formContent;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Workspace details</h3>
        <p className="text-sm text-muted-foreground">
          Choose a name and slug for your team&apos;s home.
        </p>
      </div>
      {formContent}
    </section>
  );
}
