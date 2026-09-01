'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@shared/components/ui/input-group';
import {
  updateWorkspace,
  updateWorkspaceSchema,
  type UpdateWorkspaceInput,
  type Workspace,
  workspaceKeys,
  workspaceRoutes,
  suggestWorkspaceDomain,
} from '@/domains/workspace';
import { SettingsRow, SettingsSection } from '../settings-section';

export function WorkspaceSettings({
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
    },
  });
  const { isDirty } = form.formState;

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({
      version, name, slug,
    }: UpdateWorkspaceInput) =>
      updateWorkspace(workspaceId, {
        version,
        ...(name ? { name } : {}),
        ...(slug ? { slug } : {}),
      }),
    onSuccess: async (updatedWorkspace) => {
      form.clearErrors('root');
      form.reset({
        version: updatedWorkspace.version,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
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
      toast.success('Workspace saved', {
        position: 'bottom-right',
      });
    },
    onError: (error) => {
      if (isWorkspaceDomainConflict(error)) {
        form.setError('slug', {
          message: 'Domain not available',
        });
        return;
      }

      form.setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Could not update workspace.',
      });
    },
  });

  function handleUpdateWorkspace(values: UpdateWorkspaceInput) {
    form.clearErrors('root');
    updateWorkspaceMutation.mutate({
      ...values,
      version: values.version,
      name: values.name?.trim(),
      slug: values.slug?.trim(),
    });
  }

  function handleWorkspaceFieldBlur() {
    if (
      !canEditWorkspace
      || updateWorkspaceMutation.isPending
      || !isDirty
    ) {
      return;
    }

    void form.handleSubmit(handleUpdateWorkspace)();
  }

  const hasRootError = Boolean(form.formState.errors.root?.message);

  return (
    <SettingsSection title="Workspace settings">
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        noValidate
      >
        <div>
          <SettingsRow
            title="Current role"
            description="Your access level in this workspace"
          >
            <span className="font-mono text-sm">
              {workspace.current_user_role}
            </span>
          </SettingsRow>

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="block gap-0" data-invalid={fieldState.invalid}>
                <SettingsRow
                  title={(
                    <FieldLabel htmlFor="workspace-settings-name">
                      Name
                    </FieldLabel>
                  )}
                  description="The display name for this workspace"
                >
                  <div className="w-48 space-y-2">
                    <InputGroup className="h-9">
                      <InputGroupInput
                        {...field}
                        id="workspace-settings-name"
                        aria-invalid={fieldState.invalid}
                        disabled={
                          !canEditWorkspace || updateWorkspaceMutation.isPending
                        }
                        onBlur={() => {
                          field.onBlur();
                          handleWorkspaceFieldBlur();
                        }}
                        placeholder="Camille Product"
                      />
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </div>
                </SettingsRow>
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="block gap-0" data-invalid={fieldState.invalid}>
                <SettingsRow
                  title={(
                    <FieldLabel htmlFor="workspace-settings-slug">
                      Domain
                    </FieldLabel>
                  )}
                  description="Used in this workspace URL"
                  showDivider={hasRootError || !canEditWorkspace}
                >
                  <div className="w-72 space-y-2">
                    <InputGroup className="h-9">
                      <InputGroupAddon>
                        <InputGroupText>localhost:5102/</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="workspace-settings-slug"
                        aria-invalid={fieldState.invalid}
                        disabled={
                          !canEditWorkspace || updateWorkspaceMutation.isPending
                        }
                        placeholder="camille-product"
                        onChange={(event) => {
                          field.onChange(
                            suggestWorkspaceDomain(event.target.value),
                          );
                        }}
                        onBlur={() => {
                          field.onBlur();
                          handleWorkspaceFieldBlur();
                        }}
                      />
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </div>
                </SettingsRow>
              </Field>
            )}
          />

          {form.formState.errors.root?.message
            ? (
              <Field
                className={canEditWorkspace ? 'p-5' : 'border-b p-5'}
                data-invalid
              >
                <FieldError>{form.formState.errors.root.message}</FieldError>
              </Field>
            )
            : null}
          {canEditWorkspace
            ? null
            : (
              <SettingsRow title="Permissions" showDivider={false}>
                <p className="text-sm text-muted-foreground">
                  Members can view workspace settings, but only admins and
                  owners can update them.
                </p>
              </SettingsRow>
            )}
        </div>
      </form>
    </SettingsSection>
  );
}

function isWorkspaceDomainConflict(error: unknown) {
  if (!(error instanceof HTTPError) || error.response.status !== 409) {
    return false;
  }

  const data = error.data;

  return typeof data === 'object'
    && data !== null
    && 'message' in data
    && typeof data.message === 'string'
    && data.message.toLowerCase().startsWith('workspace domain');
}
