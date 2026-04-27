import { CustomerController, handleDomainError, HttpRequestLike, HttpResponseLike } from "./customer.controller";

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>;
type AppLike = {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  patch(path: string, handler: Handler): void;
  delete(path: string, handler: Handler): void;
};

export function registerCustomerRoutes(app: AppLike, controller: CustomerController): void {
  const wrap = (handler: Handler): Handler => async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleDomainError(error, res, req.context?.correlationId);
    }
  };

  app.get("/api/customers", wrap(controller.list));
  app.post("/api/customers", wrap(controller.create));
  app.get("/api/customers/:customerId", wrap(controller.get));
  app.patch("/api/customers/:customerId", wrap(controller.update));
  app.post("/api/customers/:customerId/status", wrap(controller.changeStatus));
  app.delete("/api/customers/:customerId", wrap(controller.softDelete));
}
