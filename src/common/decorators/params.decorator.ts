import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ParamsId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.params.id;
  },
);

// Decorator para pegar o usuário logado completo
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

// Decorator para pegar apenas o ID do usuário logado
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    
    return request.user?.id;
  },
);
