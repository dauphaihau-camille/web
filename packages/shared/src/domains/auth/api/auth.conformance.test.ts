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
import type { ApiSchema } from '../../../api/contracts';

type CurrentUserWireInput = z.input<typeof currentUserApiSchema>;
type LoginResponseWireInput = z.input<typeof loginResponseApiSchema>;
type EmailAuthStartResponseWireInput = z.input<typeof emailAuthStartResponseApiSchema>;

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
});
