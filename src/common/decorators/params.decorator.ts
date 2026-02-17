import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ParamsId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.params.id;
  },
);
