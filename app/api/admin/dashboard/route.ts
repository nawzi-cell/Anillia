import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin: dashboard overview — stats, 14-day revenue, orders by status,
 * recent orders/customers, low-stock inventory, pending reviews.
 * Revenue = sum(total) of non-cancelled orders.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const nonCancelled = { status: { not: "CANCELLED" as const } };

    const [
      revenueAgg,
      ordersCount,
      customersCount,
      productsCount,
      ordersByStatusRaw,
      recentOrders,
      recentCustomers,
      inventories,
      recentReviews,
      dailyOrders,
    ] = await Promise.all([
      prisma.order.aggregate({ where: nonCancelled, _sum: { total: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.inventory.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: { take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
          variant: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.review.findMany({
        where: { status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: { ...nonCancelled, createdAt: { gte: since } },
        select: { createdAt: true, total: true },
      }),
    ]);

    // Revenue per day for the last 14 days (fill missing days with 0).
    const revenueByDay: { date: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const revenue = dailyOrders
        .filter((o) => o.createdAt.toISOString().slice(0, 10) === key)
        .reduce((s, o) => s + o.total, 0);
      revenueByDay.push({ date: key, revenue });
    }

    const lowStock = inventories
      .map((inv) => {
        const available = Math.max(0, inv.quantity - inv.reserved);
        return {
          id: inv.id,
          quantity: inv.quantity,
          reserved: inv.reserved,
          available,
          lowStockThreshold: inv.lowStockThreshold,
          lowStock: available <= inv.lowStockThreshold,
          product: inv.product,
          variant: inv.variant,
        };
      })
      .filter((inv) => inv.lowStock)
      .slice(0, 10);

    return ok({
      stats: {
        revenue: revenueAgg._sum.total ?? 0,
        orders: ordersCount,
        customers: customersCount,
        products: productsCount,
        lowStockCount: inventories.filter(
          (inv) => Math.max(0, inv.quantity - inv.reserved) <= inv.lowStockThreshold
        ).length,
      },
      revenueByDay,
      ordersByStatus: ordersByStatusRaw.map((r) => ({
        status: r.status,
        count: r._count.status,
      })),
      recentOrders,
      recentCustomers,
      lowStock,
      recentReviews,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
