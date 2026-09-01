import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AuthFormShellProps = {
  title: ReactNode;
  description?: ReactNode;
  descriptionProps?: ComponentPropsWithoutRef<'p'>;
  children: ReactNode;
};

export function AuthFormShell({
  title,
  description,
  descriptionProps,
  children,
}: AuthFormShellProps) {
  const {
    className: descriptionClassName = 'text-sm text-muted-foreground',
    ...descriptionAttributes
  } = descriptionProps ?? {};

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 px-4 py-28">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        {description
          ? (
            <p className={descriptionClassName} {...descriptionAttributes}>
              {description}
            </p>
          )
          : null}
      </div>
      {children}
    </div>
  );
}
