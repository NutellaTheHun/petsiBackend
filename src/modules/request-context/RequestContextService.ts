import { HttpStatus, Injectable } from "@nestjs/common";
import { createNamespace, getNamespace, Namespace } from 'cls-hooked'
import { AppHttpException } from "../../util/exceptions/AppHttpException";

export const REQUEST_NAMESPACE = 'request';

@Injectable()
export class RequestContextService {
    run(callback: (...args: any[]) => void, context: Record<string, any>) {
        const ns = getRequestNamespace();
        ns.run(() => {
            for (const key in context) {
                ns.set(key, context[key]);
            }
            callback();
        });
    }

    get<T = any>(key: string): T | undefined {
        return getRequestNamespace().get(key);
    }

    getRequestId(): string {
        const result = this.get('requestId');
        if(!result){
            throw new AppHttpException('RequestContextService getRequestID is null', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return result
    }


}

export function getRequestNamespace(): Namespace {
  return (
    getNamespace(REQUEST_NAMESPACE) ??
    createNamespace(REQUEST_NAMESPACE)
  );
}