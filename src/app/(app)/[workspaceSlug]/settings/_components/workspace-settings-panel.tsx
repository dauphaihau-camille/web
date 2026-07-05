'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
} from '@/components/ui/input-group';
import {
  updateWorkspace,
  updateWorkspaceSchema,
  type UpdateWorkspaceInput,
  type Workspace,
  workspaceKeys,
  workspaceRoutes,
} from '@/domains/workspace';
import { suggestWorkspaceDomain } from '@/domains/workspace/api/workspace-domain';

export function WorkspaceSettingsPanel({
  workspace,
}: {
  workspace: Workspace;
}) {
  const workspaceId = workspace.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const canEditWorkspace =
    workspace.current_user_role === 'owner'
    || workspace.current_user_role === 'admin';

  const form = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      version: workspace.version,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description ?? '',
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({
      version, name, description, slug, 
    }: UpdateWorkspaceInput) =>
      updateWorkspace(workspaceId, {
        version,
        ...(name ? { name } : {}),
        ...(slug ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
      }),
    onSuccess: async (updatedWorkspace) => {
      form.clearErrors('root');
      form.reset({
        version: updatedWorkspace.version,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
        description: updatedWorkspace.description ?? '',
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceKeys.detail(workspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceKeys.lists(),
        }),
      ]);
      router.replace(workspaceRoutes.settings(updatedWorkspace.slug));
    },
    onError: (error) => {
      form.setError('root', {
        message:
          error instanceof Error ? error.message : 'Could not update workspace.',
      });
    },
  });

  function handleUpdateWorkspace(values: UpdateWorkspaceInput) {
    form.clearErrors('root');
    updateWorkspaceMutation.mutate({
      ...values,
      version: workspace.version,
      name: values.name?.trim(),
      slug: values.slug?.trim(),
      description: values.description?.trim(),
    });
  }

  const description = useWatch({
    control: form.control,
    name: 'description',
  });

  return (
    <section className="rounded-2xl border bg-muted/20 p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">General</p>
        <p className="text-sm text-muted-foreground">
          Current role: <span className="font-mono">{workspace.current_user_role}</span>
        </p>
      </div>
      <form
        className="mt-4"
        onSubmit={form.handleSubmit(handleUpdateWorkspace)}
        noValidate
      >
        <FieldGroup className="gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-settings-name">Name</FieldLabel>
                <InputGroup className="h-9">
                  <InputGroupInput
                    {...field}
                    id="workspace-settings-name"
                    aria-invalid={fieldState.invalid}
                    disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
                    placeholder="Camille Product"
                  />
                </InputGroup>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-settings-slug">Domain</FieldLabel>
                <InputGroup className="h-9">
                  <InputGroupAddon>
                    <InputGroupText>localhost:4000/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id="workspace-settings-slug"
                    aria-invalid={fieldState.invalid}
                    disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
                    placeholder="camille-product"
                    onChange={(event) => {
                      field.onChange(suggestWorkspaceDomain(event.target.value));
                    }}
                  />
                </InputGroup>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-settings-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="workspace-settings-description"
                    aria-invalid={fieldState.invalid}
                    disabled={!canEditWorkspace || updateWorkspaceMutation.isPending}
                    placeholder="Shared docs and planning for the product team."
                    className="min-h-24 px-3 py-2"
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="text-xs text-muted-foreground">
                      {280 - (description?.length ?? 0)} characters left
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
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
          {canEditWorkspace
            ? (
              <Button
                size="lg"
                disabled={
                  updateWorkspaceMutation.isPending || form.formState.isSubmitting
                }
                type="submit"
              >
                {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save workspace'}
              </Button>
            )
            : (
              <p className="text-sm text-muted-foreground">
                Members can view workspace settings, but only admins and owners can update them.
              </p>
            )}
        </FieldGroup>
      </form>
    </section>
  );
}
