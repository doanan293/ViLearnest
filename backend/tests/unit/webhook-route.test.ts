import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { build } from "../../src/build-app.js";

describe("stripe webhook route", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("accepts a signed JSON payload without crashing raw body parsing", async () => {
    const app = await build();
    await app.ready();

    const checkoutSession = {
      customer: "cus_test",
      metadata: {
        courseId: "bruno-payment-course",
        enrollmentId: "enrollment-1",
      },
      amount_total: 4900,
    };

    const constructEvent = jest.spyOn(app.services.stripe.webhooks, "constructEvent").mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: checkoutSession,
      },
    } as never);
    const handleCheckoutCompleted = jest
      .spyOn(app.services.courses, "handleCheckoutCompleted")
      .mockResolvedValue(undefined);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/webhooks/stripe",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=test",
      },
      payload: JSON.stringify({ type: "checkout.session.completed" }),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ received: true });
    expect(constructEvent).toHaveBeenCalledWith(expect.any(Buffer), "t=1,v1=test", expect.any(String));
    expect(handleCheckoutCompleted).toHaveBeenCalledWith(expect.objectContaining(checkoutSession));

    await app.close();
  });
});
