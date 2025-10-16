import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthenticatedUser } from '@/common/types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
