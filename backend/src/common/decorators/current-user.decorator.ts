import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Return the authenticated user injected by the JWT strategy on `request.user`.
    // This replaces the temporary `x-user-id` header mechanism.
    return request.user;
  },
);
