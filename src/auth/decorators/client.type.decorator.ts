import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ClientType = createParamDecorator(
    (data:unknown, ctx:ExecutionContext)=>{
        const request = ctx.switchToHttp().getRequest();
        return request.clientType;
    }
)