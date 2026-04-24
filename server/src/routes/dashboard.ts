import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { dashboardService } from "../services/dashboard.js";
import { assertCompanyAccess } from "./authz.js";

export function dashboardRoutes(db: Db) {
  const router = Router();
  const svc = dashboardService(db);

  router.get("/companies/:companyId/dashboard", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const summary = await svc.summary(companyId);
    res.json(summary);
  });

  router.get("/companies/:companyId/dashboard/queue-health", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const queueHealth = await svc.queueHealth(companyId);
    res.json(queueHealth);
  });

  router.get("/companies/:companyId/dashboard/performance", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const performance = await svc.performance(companyId, days);
    res.json(performance);
  });

  router.get("/companies/:companyId/dashboard/performance/weekly-report", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const report = await svc.weeklyReport(companyId);
    res.json(report);
  });

  return router;
}
