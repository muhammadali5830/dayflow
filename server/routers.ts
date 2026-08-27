import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getRoutinePlan, saveRoutinePlan } from "./db";

const planInput = z.object({
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferences: z.record(z.string(), z.unknown()),
  blocks: z.array(z.record(z.string(), z.unknown())),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  routine: router({
    get: protectedProcedure.input(z.object({ planDate: z.string() })).query(({ ctx, input }) => getRoutinePlan(ctx.user.id, input.planDate)),
    save: protectedProcedure.input(planInput).mutation(({ ctx, input }) => saveRoutinePlan(ctx.user.id, input.planDate, input.preferences, input.blocks)),
  }),
});

export type AppRouter = typeof appRouter;
