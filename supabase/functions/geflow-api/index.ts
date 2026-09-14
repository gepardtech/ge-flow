// GeFlow unified backend API (port of the former Express server).
// Every former `/api/*` route is served here under `/geflow-api/*`.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { flushStore, loadStore } from "./_lib/kvfs.ts";

// Node compatibility for the ported services.
(globalThis as any).process = (globalThis as any).process ?? {
  env: new Proxy({}, { get: (_t, k: string) => Deno.env.get(k) }),
};

import { generateRequestId, getRecentTraces } from "./_lib/server/ai/tracing.ts";
import { ModelRouter } from "./_lib/server/ai/router/modelRouter.ts";
import { ProductAnalyzer } from "./_lib/server/ai/analyzer/productAnalyzer.ts";
import { ProductVerifier } from "./_lib/server/ai/verifier/productVerifier.ts";
import { extractAuthContext, verifyTenantAccess } from "./_lib/server/ai/auth.ts";
import { AIServiceError, sanitizeError } from "./_lib/server/ai/errors.ts";
import { aiConfigurationService } from "./_lib/server/ai/config/aiConfigurationService.ts";
import { providerConnectionTester } from "./_lib/server/ai/tester/providerConnectionTester.ts";
import { usageLogger } from "./_lib/server/ai/usage/usageLogger.ts";
import { teamService } from "./_lib/server/team/teamService.ts";
import { businessDataSyncService } from "./_lib/server/team/businessDataSyncService.ts";
import { settingsService } from "./_lib/server/settings/settingsService.ts";
import { newsletterService } from "./_lib/server/newsletter/newsletterService.ts";
import { promotionsService } from "./_lib/server/promotions/promotionsService.ts";

const modelRouter = new ModelRouter();
const productVerifier = new ProductVerifier(modelRouter);
const productAnalyzer = new ProductAnalyzer(modelRouter, productVerifier);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Rebuild a service singleton so it picks up the freshly loaded store. */
const fresh = <T>(svc: T): T => new ((svc as any).constructor)() as T;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip the function prefix so routes read like the original API paths.
  const path = url.pathname.replace(/^\/functions\/v1/, "").replace(/^\/geflow-api/, "").replace(/^\/api/, "") || "/";
  const q = url.searchParams;
  const method = req.method.toUpperCase();

  let body: any = {};
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
  const reqLike = { headers };

  await loadStore();
  const team = fresh(teamService);
  const sync = fresh(businessDataSyncService);
  const settings = fresh(settingsService);
  const newsletter = fresh(newsletterService);
  const promos = fresh(promotionsService);

  const respond = async (payload: unknown, status = 200) => {
    await flushStore();
    return json(payload, status);
  };

  try {
    // ---------------- AI ----------------
    if (path === "/ai/health") {
      const views = aiConfigurationService.getAllProviderViews();
      return respond({
        status: "ok",
        service: "GeFlow AI Product Intelligence Layer",
        providers: views.map((pv: any) => ({
          slug: pv.provider.slug,
          name: pv.provider.name,
          isActive: pv.provider.is_active,
          isDefault: pv.provider.is_default,
          healthStatus: pv.provider.health_status,
          isConfigured: pv.isConfigured,
          defaultModel: pv.defaultModel?.model_id,
          maskedKey: pv.maskedKeySummary,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    if (path === "/ai/providers") {
      return respond({ success: true, data: aiConfigurationService.getAllProviderViews() });
    }

    if (path === "/ai/test-provider" && method === "POST") {
      const requestId = generateRequestId();
      const { provider, modelId } = body;
      if (!provider) {
        throw new AIServiceError("AI_VALIDATION_FAILED", "Provider name is required.", { statusCode: 400, requestId });
      }
      const data = await providerConnectionTester.testProvider(provider, modelId);
      return respond({ success: true, requestId, data });
    }

    if (path === "/ai/config/update-status" && method === "POST") {
      const requestId = generateRequestId();
      const { providerSlug, isActive, isDefault, defaultModelId, modelId, modelActive } = body;
      if (providerSlug) {
        if (typeof isActive === "boolean") aiConfigurationService.setProviderStatus(providerSlug, isActive);
        if (isDefault) aiConfigurationService.setDefaultProvider(providerSlug);
        if (defaultModelId) aiConfigurationService.setDefaultModel(providerSlug, defaultModelId);
        if (modelId && typeof modelActive === "boolean") {
          aiConfigurationService.setModelStatus(providerSlug, modelId, modelActive);
        }
      }
      return respond({ success: true, requestId, data: aiConfigurationService.getAllProviderViews() });
    }

    if (path === "/ai/usage") {
      const requestId = generateRequestId();
      const auth = extractAuthContext(reqLike, requestId);
      const businessId = q.get("businessId") || "biz_default";
      verifyTenantAccess(auth, businessId, requestId);
      return respond({
        success: true,
        businessId,
        summaries: usageLogger.getBusinessUsageSummary(businessId),
        recentRequests: usageLogger.getBusinessRecentRequests(businessId),
      });
    }

    if (path === "/ai/analyze-product" && method === "POST") {
      const requestId = generateRequestId();
      const auth = extractAuthContext(reqLike, requestId);
      const { rawInput, businessContext, currentFormState, options } = body;
      if (!businessContext?.businessId) {
        throw new AIServiceError("AI_VALIDATION_FAILED", "businessContext with businessId is required", {
          statusCode: 400,
          requestId,
        });
      }
      verifyTenantAccess(auth, businessContext.businessId, requestId);
      const suggestion = await productAnalyzer.analyze({
        requestId,
        userId: auth.userId,
        businessId: businessContext.businessId,
        rawInput: rawInput || "",
        businessContext,
        currentFormState,
        options,
      });
      return respond({ success: true, requestId, data: suggestion });
    }

    if (path === "/ai/verify-product" && method === "POST") {
      const requestId = generateRequestId();
      const auth = extractAuthContext(reqLike, requestId);
      const { suggestion, businessContext, originalInput, searchEvidence } = body;
      if (!suggestion) {
        throw new AIServiceError("AI_VALIDATION_FAILED", "Suggestion payload is required for verification.", {
          statusCode: 400,
          requestId,
        });
      }
      if (!businessContext?.businessId) {
        throw new AIServiceError("AI_VALIDATION_FAILED", "businessContext with businessId is required", {
          statusCode: 400,
          requestId,
        });
      }
      verifyTenantAccess(auth, businessContext.businessId, requestId);
      const data = await productVerifier.verify(
        suggestion,
        businessContext,
        auth.userId,
        requestId,
        originalInput,
        searchEvidence,
      );
      return respond({ success: true, requestId, data });
    }

    if (path === "/ai/traces") {
      return respond({ traces: getRecentTraces(q.get("businessId") || undefined) });
    }

    // ---------------- Team ----------------
    if (path === "/team/invite" && method === "POST") {
      const { ownerId, ownerName, ownerEmail, businessId, businessName, businessAddress, currency, email, fullName, role, permissions } = body;
      if (!email || !businessId) {
        return respond({ success: false, error: "Email and Business ID are required." }, 400);
      }
      const result = team.createInvitation({
        ownerId: ownerId || "owner",
        ownerName: ownerName || "Store Owner",
        ownerEmail,
        businessId,
        businessName: businessName || "Store",
        businessAddress,
        currency: currency || "USD",
        email,
        fullName,
        role: role || "cashier",
        permissions,
      });
      return respond(result, result.success ? 200 : 400);
    }

    if (path === "/team/invitations") {
      return respond({
        success: true,
        invitations: team.getPendingInvitations(q.get("email") || undefined, q.get("userId") || undefined),
      });
    }

    if (path === "/team/accept" && method === "POST") {
      const { invitationId, userId, userEmail, userName } = body;
      if (!invitationId || !userEmail) {
        return respond({ success: false, error: "Invitation ID and User Email are required." }, 400);
      }
      const result = team.acceptInvitation({
        invitationId,
        userId: userId || "user_" + Date.now(),
        userEmail,
        userName,
      });
      return respond(result, result.success ? 200 : 400);
    }

    if (path === "/team/decline" && method === "POST") {
      const { invitationId, userEmail, userId } = body;
      if (!invitationId || !userEmail) {
        return respond({ success: false, error: "Invitation ID and User Email are required." }, 400);
      }
      return respond(team.declineInvitation({ invitationId, userEmail, userId }));
    }

    if (path === "/team/resend" && method === "POST") {
      const { invitationId, businessId, email, ownerName } = body;
      if (!email || (!invitationId && !businessId)) {
        return respond({ success: false, error: "Email and Business ID/Invitation ID are required." }, 400);
      }
      return respond(team.resendInvitation({ invitationId, businessId, email, ownerName }));
    }

    if (path === "/team/employee-businesses") {
      return respond({
        success: true,
        businesses: team.getEmployeeBusinesses(q.get("userId") || undefined, q.get("email") || undefined),
      });
    }

    if (path === "/team/members") {
      const clean = (v: string | null) => (v && v !== "undefined" && v !== "null" ? v.trim() : undefined);
      return respond({
        success: true,
        members: team.getTeamMembers({ businessId: clean(q.get("businessId")), ownerId: clean(q.get("ownerId")) }),
      });
    }

    if (path === "/team/add-member" && method === "POST") {
      const { businessId, businessName, businessAddress, currency, ownerId, ownerName, email, fullName, role, permissions, userId, status } = body;
      if (!email || (!businessId && !ownerId)) {
        return respond({ success: false, error: "Email and Business ID (or Owner ID) are required." }, 400);
      }
      return respond(team.addDirectMember({
        businessId: businessId || "biz_" + (ownerId || "default"),
        businessName,
        businessAddress,
        currency,
        ownerId: ownerId || "owner",
        ownerName,
        email,
        fullName: fullName || String(email).split("@")[0],
        role: role || "cashier",
        permissions,
        userId,
        status: status || "active",
      }));
    }

    if (path === "/team/remove-member" && method === "POST") {
      const { businessId, memberId, ownerId } = body;
      if ((!businessId && !ownerId) || !memberId) {
        return respond({ success: false, error: "businessId (or ownerId) and memberId are required." }, 400);
      }
      return respond(team.removeMember(businessId, memberId, ownerId));
    }

    if (path === "/team/update-role" && method === "POST") {
      const { businessId, memberId, role, ownerId } = body;
      if ((!businessId && !ownerId) || !memberId || !role) {
        return respond({ success: false, error: "businessId, memberId and role are required." }, 400);
      }
      return respond(team.updateMemberRole(businessId, memberId, role, ownerId));
    }

    if (path === "/team/update-status" && method === "POST") {
      const { businessId, memberId, isActive, ownerId } = body;
      if ((!businessId && !ownerId) || !memberId || isActive === undefined) {
        return respond({ success: false, error: "businessId, memberId and isActive are required." }, 400);
      }
      return respond(team.updateMemberStatus(businessId, memberId, Boolean(isActive), ownerId));
    }

    if (path === "/team/notifications") {
      return respond({
        success: true,
        notifications: team.getNotifications(q.get("email") || undefined, q.get("userId") || undefined),
      });
    }

    // ---------------- Business data sync ----------------
    if (path === "/sync/business-data") {
      const businessId = q.get("businessId");
      if (!businessId) return respond({ success: false, error: "businessId query parameter is required." }, 400);
      return respond(sync.getBusinessData(businessId, q.get("role") || "manager"));
    }

    if (path === "/sync/batch" && method === "POST") {
      const { businessId, products, sales, sale_items, stock_movements, categories, ownerUserId, businessName, replace } = body;
      if (!businessId) return respond({ success: false, error: "businessId is required." }, 400);
      return respond(sync.syncBatch(businessId, {
        products, sales, sale_items, stock_movements, categories, ownerUserId, businessName, replace,
      }));
    }

    if (path === "/sync/product" && method === "POST") {
      const { businessId, product, userId } = body;
      if (!businessId || !product) return respond({ success: false, error: "businessId and product are required." }, 400);
      return respond({ success: true, product: sync.saveProduct(businessId, product, userId) });
    }

    if (path === "/sync/product" && method === "DELETE") {
      const { businessId, productId } = body;
      if (!businessId || !productId) return respond({ success: false, error: "businessId and productId are required." }, 400);
      return respond({ success: sync.deleteProduct(businessId, productId) });
    }

    if (path === "/sync/sale" && method === "POST") {
      const { businessId, sale, items, cashierName, userId } = body;
      if (!businessId || !sale || !items) {
        return respond({ success: false, error: "businessId, sale, and items are required." }, 400);
      }
      return respond(sync.recordSale(businessId, { sale, items, cashierName, userId }));
    }

    if (path === "/sync/adjust-stock" && method === "POST") {
      const { businessId, productId, deltaQuantity, type, reason, note, userId } = body;
      if (!businessId || !productId || deltaQuantity === undefined) {
        return respond({ success: false, error: "businessId, productId, and deltaQuantity are required." }, 400);
      }
      return respond(sync.adjustStock(businessId, productId, Number(deltaQuantity), type || "in", reason || "Manual Adjustment", note, userId));
    }

    if (path === "/sync/held-orders" && method === "GET") {
      const businessId = q.get("businessId");
      if (!businessId) return respond({ success: false, error: "businessId is required." }, 400);
      return respond({ success: true, heldOrders: sync.getBusinessData(businessId).held_orders });
    }

    if (path === "/sync/held-orders" && method === "POST") {
      const { businessId, order } = body;
      if (!businessId || !order) return respond({ success: false, error: "businessId and order are required." }, 400);
      return respond({ success: true, heldOrder: sync.saveHeldOrder(businessId, order) });
    }

    if (path === "/sync/held-orders" && method === "DELETE") {
      const { businessId, orderId } = body;
      if (!businessId || !orderId) return respond({ success: false, error: "businessId and orderId are required." }, 400);
      return respond({ success: sync.deleteHeldOrder(businessId, orderId) });
    }

    if (path === "/sync/returns") {
      const businessId = q.get("businessId");
      if (!businessId) return respond({ success: false, error: "businessId is required." }, 400);
      return respond({ success: true, returns: sync.getReturns(businessId) });
    }

    if (path === "/sync/return" && method === "POST") {
      const { businessId, returnRecord, items, userId } = body;
      if (!businessId || !returnRecord || !Array.isArray(items)) {
        return respond({ success: false, error: "businessId, returnRecord, and items are required." }, 400);
      }
      return respond(sync.recordReturn(businessId, { returnRecord, items, userId }));
    }

    if (path === "/sync/settings" && method === "GET") {
      const businessId = q.get("businessId");
      if (!businessId) return respond({ success: false, error: "businessId query parameter is required." }, 400);
      return respond({ success: true, settings: sync.getSettings(businessId) });
    }

    if (path === "/sync/settings" && method === "POST") {
      const { businessId, settings: s } = body;
      if (!businessId) return respond({ success: false, error: "businessId is required." }, 400);
      return respond(sync.saveSettings(businessId, s || {}));
    }

    // ---------------- Platform general settings ----------------
    if (path === "/settings/general" && method === "GET") {
      return respond({ success: true, settings: settings.getSettings() });
    }

    if (path === "/settings/general" && method === "POST") {
      return respond({ success: true, settings: settings.updateAllSettings(body) });
    }

    if (path === "/settings/general/social-links" && method === "POST") {
      if (!Array.isArray(body.links)) return respond({ success: false, error: "links must be an array" }, 400);
      return respond({ success: true, settings: settings.updateSocialLinks(body.links) });
    }

    if (path === "/settings/general/footer-copyright" && method === "POST") {
      if (!body.copyright || typeof body.copyright.text !== "string") {
        return respond({ success: false, error: "valid copyright object is required" }, 400);
      }
      return respond({ success: true, settings: settings.updateFooterCopyright(body.copyright) });
    }

    if (path === "/settings/general/about-members" && method === "POST") {
      if (!Array.isArray(body.members)) return respond({ success: false, error: "members must be an array" }, 400);
      return respond({ success: true, settings: settings.updateAboutMembers(body.members) });
    }

    // ---------------- Newsletter ----------------
    if (path === "/newsletter/subscribers" && method === "GET") {
      return respond({ success: true, subscribers: newsletter.getSubscribers() });
    }

    if (path === "/newsletter/subscribe" && method === "POST") {
      return respond(newsletter.subscribe(body.email, body.source, body.appName));
    }

    const subStatus = path.match(/^\/newsletter\/subscribers\/([^/]+)\/status$/);
    if (subStatus && method === "POST") {
      return respond(newsletter.toggleStatus(subStatus[1], body.status));
    }

    const subDel = path.match(/^\/newsletter\/subscribers\/([^/]+)$/);
    if (subDel && method === "DELETE") {
      return respond(newsletter.deleteSubscriber(subDel[1]));
    }

    if (path === "/newsletter/send-direct" && method === "POST") {
      const { recipientEmail, subject, body: content } = body;
      if (!recipientEmail || !subject || !content) {
        return respond({ success: false, error: "recipientEmail, subject, and body are required." }, 400);
      }
      return respond(newsletter.sendDirectEmail(body));
    }

    if (path === "/newsletter/templates" && method === "GET") {
      return respond({ success: true, templates: newsletter.getTemplates() });
    }

    const tmpl = path.match(/^\/newsletter\/templates\/([^/]+)$/);
    if (tmpl && (method === "PUT" || method === "PATCH")) {
      return respond({ success: true, template: newsletter.updateTemplate(tmpl[1], body) });
    }

    if (path === "/newsletter/broadcast" && method === "POST") {
      if (!body.title || !body.body) {
        return respond({ success: false, error: "Title and body are required for broadcast" }, 400);
      }
      return respond(newsletter.broadcast(body));
    }

    if (path === "/newsletter/logs") return respond({ success: true, logs: newsletter.getLogs() });
    if (path === "/newsletter/stats") return respond({ success: true, stats: newsletter.getStats() });

    // ---------------- Announcements ----------------
    if (path === "/announcements" && method === "GET") {
      const activeOnly = q.get("activeOnly") === "true" || q.get("active") === "true";
      return respond({
        success: true,
        announcements: promos.getAnnouncements(activeOnly, q.get("audience") || undefined, q.get("position") || undefined),
      });
    }

    if (path === "/announcements" && method === "POST") {
      return respond({ success: true, announcement: promos.createAnnouncement(body) });
    }

    const ann = path.match(/^\/announcements\/([^/]+)$/);
    if (ann && (method === "PATCH" || method === "PUT")) {
      const updated = promos.updateAnnouncement(ann[1], body);
      if (!updated) return respond({ success: false, error: "Announcement not found" }, 404);
      return respond({ success: true, announcement: updated });
    }
    if (ann && method === "DELETE") {
      return respond({ success: true, deleted: promos.deleteAnnouncement(ann[1]) });
    }

    // ---------------- Coupons ----------------
    if (path === "/coupons" && method === "GET") {
      return respond({ success: true, coupons: promos.getCoupons() });
    }
    if (path === "/coupons" && method === "POST") {
      return respond({ success: true, coupon: promos.createCoupon(body) });
    }
    if (path === "/coupons/validate" && method === "POST") {
      const result = promos.validateCoupon(body.code || "", body.plan || "standard", Number(body.subtotal) || 0, body.period || "monthly");
      return respond({ success: true, ...result });
    }
    const coup = path.match(/^\/coupons\/([^/]+)$/);
    if (coup && (method === "PATCH" || method === "PUT")) {
      const updated = promos.updateCoupon(coup[1], body);
      if (!updated) return respond({ success: false, error: "Coupon not found" }, 404);
      return respond({ success: true, coupon: updated });
    }
    if (coup && method === "DELETE") {
      return respond({ success: true, deleted: promos.deleteCoupon(coup[1]) });
    }

    return respond({ success: false, error: `Unknown endpoint: ${path}` }, 404);
  } catch (err: any) {
    await flushStore();
    if (err instanceof AIServiceError) {
      const sanitized = sanitizeError(err, generateRequestId());
      return json(sanitized.toJSON(), sanitized.statusCode);
    }
    console.error("geflow-api error:", err?.message, path);
    return json({ success: false, error: err?.message ?? "Internal error" }, 500);
  }
});
