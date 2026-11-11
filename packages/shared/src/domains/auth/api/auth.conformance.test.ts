import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';
import type { z } from 'zod';

import type {
  currentUserApiSchema,
  emailAuthStartResponseApiSchema,
  loginResponseApiSchema,
} from '../../../../../../apps/app/src/domains/auth/api/auth.schemas';
import type { ApiSchema, paths } from '../../../api/contracts';

type CurrentUserWireInput = z.input<typeof currentUserApiSchema>;
type LoginResponseWireInput = z.input<typeof loginResponseApiSchema>;
type EmailAuthStartResponseWireInput = z.input<typeof emailAuthStartResponseApiSchema>;

type LoginResponse =
  paths['/v1/auth/login']['post']['responses'][200]['content']['application/json'];
type RefreshSessionResponse =
  paths['/v1/auth/refresh']['post']['responses'][200]['content']['application/json'];
type EmailAuthStartResponse =
  paths['/v1/auth/email/start']['post']['responses'][200]['content']['application/json'];
type EmailAuthVerifyResponse =
  paths['/v1/auth/email/verify']['post']['responses'][200]['content']['application/json'];
type ResetPasswordResponse =
  paths['/v1/auth/reset-password']['post']['responses'][200]['content']['application/json'];
type RegisterResponse =
  paths['/v1/auth/register']['post']['responses'][201]['content']['application/json'];
type LogoutNoContent =
  paths['/v1/auth/logout']['post']['responses'][204];

describe('auth contract', () => {
  it('UserProfileResponseDto fits the currentUser wire input', () => {
    // `currentUserApiSchema` coerces ids/status and normalises nullables before
    // transforming to the camelCase domain shape, so its input type accepts a
    // superset of UserProfileResponseDto. The contract -> wire direction is
    // the meaningful one; the reverse would require weakening the coercion.
    expectTypeOf<ApiSchema<'UserProfileResponseDto'>>().toExtend<CurrentUserWireInput>();
  });

  it('AuthResponseDto fits the login wire input', () => {
    expectTypeOf<ApiSchema<'AuthResponseDto'>>().toExtend<LoginResponseWireInput>();
  });

  it('StartEmailAuthResponseDto fits the email auth start wire input', () => {
    expectTypeOf<ApiSchema<'StartEmailAuthResponseDto'>>()
      .toExtend<EmailAuthStartResponseWireInput>();
  });

  it('session operations resolve to the auth DTOs', () => {
    expectTypeOf<LoginResponse>().toEqualTypeOf<ApiSchema<'AuthResponseDto'>>();
    expectTypeOf<RefreshSessionResponse>().toEqualTypeOf<ApiSchema<'AuthResponseDto'>>();
    expectTypeOf<EmailAuthVerifyResponse>().toEqualTypeOf<ApiSchema<'AuthResponseDto'>>();
    expectTypeOf<ResetPasswordResponse>().toEqualTypeOf<ApiSchema<'AuthResponseDto'>>();
  });

  it('register resolves to AuthResponseDto', () => {
    expectTypeOf<RegisterResponse>().toEqualTypeOf<ApiSchema<'AuthResponseDto'>>();
  });

  it('email auth start resolves to StartEmailAuthResponseDto', () => {
    expectTypeOf<EmailAuthStartResponse>()
      .toEqualTypeOf<ApiSchema<'StartEmailAuthResponseDto'>>();
  });

  it('logout resolves to a 204 without a JSON body', () => {
    expectTypeOf<LogoutNoContent>().not.toEqualTypeOf<never>();
    expectTypeOf<LogoutNoContent['headers']>()
      .toEqualTypeOf<{ [name: string]: unknown }>();
  });
});
