"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Wand2,
  Lock,
  Sparkles,
  ShieldCheck,
  Check,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { useProStore, type ProPlan } from "@/stores/pro-store";
import { useUiStore } from "@/stores/ui-store";
import { Sheet } from "@/components/ui/sheet";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const PERKS: { Icon: LucideIcon; title: string; sub: string }[] = [
  { Icon: Crown, title: "Full pet wardrobe", sub: "crown, scarf & future drops" },
  { Icon: Wand2, title: "Unlimited animations", sub: "every studio motion preset" },
  { Icon: Lock, title: "Pro-only routines", sub: "elite plans, zero blur" },
  { Icon: Sparkles, title: "Evolution tracks", sub: "your pet keeps growing" },
];

const PLANS: { key: ProPlan; price: string; per: string; note: string; badge?: string }[] = [
  { key: "monthly", price: "$7.99", per: "/mo", note: "flexible, cancel anytime" },
  { key: "yearly", price: "$59.99", per: "/yr", note: "$5.00/mo billed yearly", badge: "best value" },
];

type CheckoutStage = "cart" | "processing" | "done";

function ProPanel() {
  const isPro = useProStore((s) => s.isPro);
  const plan = useProStore((s) => s.plan);
  const purchasedAt = useProStore((s) => s.purchasedAt);
  const purchase = useProStore((s) => s.purchase);
  const restore = useProStore((s) => s.restore);
  const cancel = useProStore((s) => s.cancel);
  const pushToast = useUiStore((s) => s.pushToast);

  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<ProPlan>("yearly");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stage, setStage] = useState<CheckoutStage>("cart");
  useEffect(() => setHydrated(true), []);

  const chosen = PLANS.find((p) => p.key === selected) ?? PLANS[1];

  const openCheckout = useCallback(() => {
    haptic("light");
    setStage("cart");
    setSheetOpen(true);
  }, []);

  /** Mock secure gateway — mirrors RevenueCat's purchaseSheet resolving an
   *  entitlement. Real build: RC `Purchases.purchasePackage()` → webhook → DB. */
  const confirmPurchase = useCallback(() => {
    if (stage !== "cart") return;
    setStage("processing");
    haptic("medium");
    setTimeout(() => {
      purchase(selected);
      setStage("done");
      haptic("success");
      setTimeout(() => {
        setSheetOpen(false);
        pushToast({ title: "Welcome to vyay pro", message: "everything unlocked", tone: "grape" });
      }, 1000);
    }, 1400);
  }, [stage, purchase, selected, pushToast]);

  const onRestore = useCallback(() => {
    haptic("light");
    if (isPro) {
      pushToast({ title: "Purchase restored", message: plan ?? "yearly", tone: "mint" });
    } else {
      pushToast({ title: "No purchases found", message: "to restore in this demo", tone: "grape" });
    }
    restore(); // demo: restore grants entitlement the way RC would
  }, [isPro, plan, restore, pushToast]);

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-grape dark:text-amethyst">
          {hydrated && isPro ? "membership" : "upgrade"}
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-[1.02] text-ink dark:text-snow">
          {hydrated && isPro ? (
            <>
              you&apos;re<span className="text-grape dark:text-amethyst"> pro.</span>
            </>
          ) : (
            <>
              unlock <span className="text-grape dark:text-amethyst">everything.</span>
            </>
          )}
        </h1>
      </div>

      {/* hero panel */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2b1246] via-[#4c1d95] to-[#7c3aed] p-5 text-white shadow-[0_24px_50px_-20px_rgba(124,58,237,0.65)]">
        <div aria-hidden className="animate-aurora absolute -right-14 -top-16 size-52 rounded-full bg-amethyst/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-10 size-44 rounded-full bg-grape/35 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <motion.span
            initial={{ rotate: -8, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
            className="flex size-13 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/25 backdrop-blur"
          >
            <Crown className="size-6 text-[#ffdf8e]" aria-hidden />
          </motion.span>
          {hydrated && isPro && (
            <span className="flex items-center gap-1 rounded-full bg-white/14 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ring-1 ring-white/25">
              <BadgeCheck className="size-3.5" aria-hidden /> active
            </span>
          )}
        </div>
        <p className="font-display relative mt-4 text-[26px] italic leading-tight">
          {hydrated && isPro ? "Full access, forever-ish." : "One plan. Every feature."}
        </p>
        <p className="relative mt-1 max-w-[26ch] text-[12px] text-white/70">
          {hydrated && isPro
            ? `Plan: ${plan ?? "yearly"}${purchasedAt ? ` · since ${new Date(purchasedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}`
            : "Wardrobe, animations, elite routines and evolution tracks — gated by one entitlement."}
        </p>
      </div>

      {/* perks */}
      <div className="flex flex-col gap-2">
        {PERKS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 320, damping: 30, delay: i * 0.05 }}
            className="surface-solid flex items-center gap-3 rounded-[1.4rem] p-3.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grape/12 text-grape dark:bg-amethyst/15 dark:text-amethyst">
              <p.Icon className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink dark:text-snow">{p.title}</p>
              <p className="text-[11px] text-ink/50 dark:text-snow/45">{p.sub}</p>
            </div>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full",
                hydrated && isPro
                  ? "bg-gradient-to-br from-grape to-iris text-white"
                  : "bg-ink/6 text-ink/30 dark:bg-white/10 dark:text-snow/30",
              )}
            >
              {hydrated && isPro ? <Check className="size-3.5" aria-hidden /> : <Lock className="size-3" aria-hidden />}
            </span>
          </motion.div>
        ))}
      </div>

      {!(hydrated && isPro) ? (
        <>
          {/* plan picker */}
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setSelected(p.key);
                }}
                aria-pressed={selected === p.key}
                className={cn(
                  "relative cursor-pointer rounded-[1.4rem] border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grape/60 dark:focus-visible:ring-amethyst/70",
                  selected === p.key
                    ? "border-grape/60 bg-grape/10 dark:border-amethyst/70 dark:bg-amethyst/10"
                    : "surface-solid",
                )}
              >
                {p.badge && (
                  <span className="absolute -top-2 left-3 rounded-full bg-gradient-to-r from-grape to-iris px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                    {p.badge}
                  </span>
                )}
                <p className="text-[19px] font-black tracking-tight text-ink dark:text-snow">
                  {p.price}
                  <span className="text-[11px] font-bold text-ink/45 dark:text-snow/40">{p.per}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-semibold capitalize text-ink/50 dark:text-snow/45">
                  {p.key}
                </p>
                <p className="text-[9.5px] text-ink/40 dark:text-snow/35">{p.note}</p>
              </button>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={openCheckout}
            className="relative flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-grape via-iris to-grape bg-[length:200%_100%] text-[14.5px] font-bold text-white shadow-[0_18px_38px_-14px_rgba(139,92,246,0.85)] outline-none focus-visible:ring-2 focus-visible:ring-amethyst/70"
          >
            <span aria-hidden className="shimmer absolute inset-0" />
            <Crown className="relative size-4" aria-hidden />
            <span className="relative">
              Go Pro — {chosen.price}
              <span className="font-semibold text-white/75">{chosen.per}</span>
            </span>
          </motion.button>

          <button
            type="button"
            onClick={onRestore}
            className="mx-auto cursor-pointer py-1 text-[11.5px] font-bold text-ink/45 underline decoration-ink/20 underline-offset-4 outline-none transition-colors hover:text-ink dark:text-snow/40 dark:decoration-snow/20 dark:hover:text-snow"
          >
            Restore purchases
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink/35 dark:text-snow/30">
            <ShieldCheck className="size-3.5" aria-hidden /> Secured checkout · demo gateway, no card charged
          </p>
        </>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="surface-solid flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full text-[12.5px] font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-grape/50 dark:text-snow dark:focus-visible:ring-amethyst/60"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              cancel();
              pushToast({ title: "Membership paused", message: "demo entitlement cleared", tone: "grape" });
            }}
            className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full bg-ink text-[12.5px] font-bold text-paper outline-none focus-visible:ring-2 focus-visible:ring-grape/50 dark:bg-white dark:text-ink dark:focus-visible:ring-amethyst/60"
          >
            Manage
          </button>
        </div>
      )}

      {/* secure checkout sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => stage === "cart" && setSheetOpen(false)}
        label="Secure checkout"
        z={85}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-grape dark:text-amethyst">
          secure checkout
        </p>
        <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">vyay pro · {chosen.key}</h3>

        <div className="surface-solid mt-4 flex items-center justify-between rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-[13px] font-bold text-ink dark:text-snow">Pro membership</p>
            <p className="text-[11px] text-ink/50 dark:text-snow/45">{chosen.note}</p>
          </div>
          <p className="text-[17px] font-black text-ink dark:text-snow">
            {chosen.price}
            <span className="text-[11px] font-bold text-ink/45 dark:text-snow/40">{chosen.key === "monthly" ? "/mo" : "/yr"}</span>
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={stage === "cart" ? { scale: 0.97 } : undefined}
          onClick={confirmPurchase}
          disabled={stage !== "cart"}
          className={cn(
            "mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-amethyst/70",
            stage === "done"
              ? "bg-gradient-to-r from-mint-deep to-mint-strong"
              : "bg-gradient-to-r from-grape to-iris shadow-[0_16px_34px_-14px_rgba(139,92,246,0.9)]",
            stage === "processing" && "opacity-85",
          )}
          aria-live="polite"
        >
          {stage === "cart" && (
            <>
              <ShieldCheck className="size-4" aria-hidden /> Pay {chosen.price} securely
            </>
          )}
          {stage === "processing" && (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Contacting store…
            </>
          )}
          {stage === "done" && (
            <motion.span
              className="flex items-center gap-2"
              // success check: overshooting scale spring reads as a "stamp"
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 15 }}
            >
              <Check className="size-5" aria-hidden /> Unlocked
            </motion.span>
          )}
        </motion.button>
        <p className="mt-3 text-center text-[10px] text-ink/40 dark:text-snow/35">
          Encrypted end-to-end · cancel anytime · demo gateway
        </p>
      </Sheet>
    </div>
  );
}

/**
 * Global Pro paywall. Mounted once at the shell so any screen (feed lock,
 * wardrobe lock, settings row) can open it without a tab change.
 */
export function ProSheet() {
  const proOpen = useUiStore((s) => s.proOpen);
  const closePro = useUiStore((s) => s.closePro);

  return (
    <Sheet open={proOpen} onClose={closePro} label="vyay Pro">
      <ProPanel />
    </Sheet>
  );
}
