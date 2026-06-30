'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  createWorkspace,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';
import { suggestWorkspaceDomain } from '@/domains/workspace/api/workspace-domain';

import {
  createWorkspaceFormSchema,
  type CreateWorkspaceFormInput,
  type CreateWorkspaceFormValues,
} from '../_forms/create-workspace.scheme';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDomainManuallyEdited, setIsDomainManuallyEdited] = useState(false);

  const form = useForm<CreateWorkspaceFormInput, undefined, CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });
  const name = form.watch('name');
  const slug = form.watch('slug');

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.lists(),
      });
      router.push(workspaceRoutes.detail(workspace.slug));
    },
    onError: (error) => {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Could not create workspace.',
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

  function handleSubmit(values: CreateWorkspaceFormValues) {
    form.clearErrors('root');
    createWorkspaceMutation.mutate(values);
  }

  return (
    <div className="rounded-2xl border p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">Create a workspace</p>
        <p className="text-sm text-muted-foreground">
          Phase 1 moves workspace creation into the v2 API and uses this shell as the first entry
          point.
        </p>
      </div>
      <form className="mt-4" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
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
                  className="h-11 px-3"
                  placeholder="Camille Product"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-domain">Domain</FieldLabel>
                <Input
                  {...field}
                  id="workspace-domain"
                  aria-invalid={fieldState.invalid}
                  className="h-11 px-3"
                  placeholder="camille-product"
                  onChange={(event) => {
                    setIsDomainManuallyEdited(true);
                    field.onChange(suggestWorkspaceDomain(event.target.value));
                  }}
                />
                <FieldDescription>
                  Opens at <span className="font-mono">/{slug || 'your-domain'}</span>
                </FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-description">Description</FieldLabel>
                <textarea
                  {...field}
                  id="workspace-description"
                  aria-invalid={fieldState.invalid}
                  placeholder="Shared docs and planning for the product team."
                  className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <FieldDescription>Optional, up to 280 characters.</FieldDescription>
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
            disabled={createWorkspaceMutation.isPending || form.formState.isSubmitting}
            type="submit"
          >
            {createWorkspaceMutation.isPending ? 'Creating workspace...' : 'Create workspace'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
