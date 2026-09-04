import httpStatus from "http-status";
import type Stripe from "stripe";
import config from "../../config/index.js";
import { PaymentStatus, type Prisma, SubscriptionPlan, SubscriptionStatus } from "../../../generated/prisma/index.js";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../lib/stripe.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership, getActiveOrganizationOrThrow } from "../../utils/orgAccess.js";
import type { ICreateCheckoutPayload } from "./payment.interface.js";
 
const PLAN_PRICE_MAP: Record<"PRO" | "BUSINESS", string> = {
  PRO: config.stripe_pro_price_id,
  BUSINESS: config.stripe_business_price_id,
};
 
const PLAN_AMOUNT_MAP: Record<"PRO" | "BUSINESS", number> = {
  PRO: 19,
  BUSINESS: 49,
};

const createCheckoutSession = async (payload: ICreateCheckoutPayload, user: RequestUser) => {
  await assertOrganizationOwnership(payload.organizationId, user);
 
  const organization = await getActiveOrganizationOrThrow(payload.organizationId);
 
  let stripeCustomerId = organization.stripeCustomerId;
 
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: organization.name,
      email: user.email,
      metadata: { organizationId: organization.id },
    });
    stripeCustomerId = customer.id;
 
    await prisma.organization.update({
      where: { id: organization.id },
      data: { stripeCustomerId },
    });
  }
 
  const priceId = PLAN_PRICE_MAP[payload.plan];
 
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.frontend_url}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/billing/cancel`,
    metadata: { organizationId: organization.id, plan: payload.plan },
  });
 
  await prisma.payment.create({
    data: {
      organizationId: organization.id,
      plan: payload.plan as SubscriptionPlan,
      amount: PLAN_AMOUNT_MAP[payload.plan],
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId,
    },
  });
 
  await logActivity({
    organizationId: organization.id,
    userId: user.userId,
    action: "CHECKOUT_SESSION_CREATED",
    entityType: "PAYMENT",
    entityId: session.id,
    metadata: { plan: payload.plan },
  });
 
  return { checkoutUrl: session.url };
};
 

const handleWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
 
      const payment = await prisma.payment.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });
 
      if (!payment) break;
 
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            stripeSubscriptionId: session.subscription as string,
            gatewayResponse: session as unknown as Prisma.InputJsonValue,
          },
        });
 
        await tx.organization.update({
          where: { id: payment.organizationId },
          data: {
            subscriptionPlan: payment.plan,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            stripeSubscriptionId: session.subscription as string,
          },
        });
      });
 
      break;
    }
 
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
 
      const organization = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
 
      if (organization) {
        await prisma.organization.update({
          where: { id: organization.id },
          data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
        });
      }
 
      break;
    }
 
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
 
      const organization = await prisma.organization.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
 
      if (organization) {
        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            subscriptionStatus: SubscriptionStatus.CANCELLED,
            subscriptionPlan: SubscriptionPlan.FREE,
          },
        });
      }
 
      break;
    }
 
    default:

      break;
  }
};
 
const getPaymentHistory = async (organizationId: string, query: IQuery, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const where = { organizationId };
 
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      omit: { gatewayResponse: true },
    }),
    prisma.payment.count({ where }),
  ]);
 
  return { data: payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
export const PaymentService = {
  createCheckoutSession,
  handleWebhookEvent,
  getPaymentHistory,
};
