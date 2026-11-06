import { useEffect, useState } from "react";
import { useAdminData } from "@/admin/data/context";
import type { VipAdminLevel, VipReferralAdminSettings } from "@/admin/data/provider";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";

const inputClass = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground";
type ReferralRewardDraft = Omit<
  NonNullable<VipReferralAdminSettings["referralRewardPolicy"]>,
  "value" | "asset" | "minimumFirstDeposit" | "baseAsset"
> & { value: string; asset: string; minimumFirstDeposit: string; baseAsset: string };

export function VipReferralPolicyEditor({
  settings,
  loading,
  error,
  refresh,
}: {
  settings: VipReferralAdminSettings | null | undefined;
  loading: boolean;
  error: Error | undefined;
  refresh: () => void;
}) {
  const provider = useAdminData();
  const session = useAdminSession();
  const [baseAsset, setBaseAsset] = useState("");
  const [levels, setLevels] = useState<VipAdminLevel[]>([]);
  const [benefitsText, setBenefitsText] = useState<Record<number, string>>({});
  const [reward, setReward] = useState<ReferralRewardDraft>({
    enabled: false,
    mode: "FIXED",
    value: "",
    asset: "",
    minimumFirstDeposit: "",
    baseAsset: "",
  });
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setBaseAsset(settings.vipPolicy?.baseAsset ?? "");
    setLevels(settings.levels);
    setBenefitsText(
      Object.fromEntries(
        settings.levels.map((level) => [
          level.level,
          JSON.stringify(level.benefits ?? {}, null, 2),
        ]),
      ),
    );
    if (settings.referralRewardPolicy) {
      setReward({
        ...settings.referralRewardPolicy,
        value: settings.referralRewardPolicy.value ?? "",
        asset: settings.referralRewardPolicy.asset ?? "",
        minimumFirstDeposit: settings.referralRewardPolicy.minimumFirstDeposit ?? "",
        baseAsset: settings.referralRewardPolicy.baseAsset ?? "",
      });
    }
  }, [settings]);

  const canEdit = session.can("users.entitlements");
  const updateLevel = (level: number, patch: Partial<VipAdminLevel>) =>
    setLevels((current) =>
      current.map((item) => (item.level === level ? { ...item, ...patch } : item)),
    );

  async function save(
    action: () => Promise<{ auditId: string }>,
    verify: (readback: VipReferralAdminSettings) => boolean,
  ) {
    if (!reason.trim() || reason.trim().length < 3) {
      setMessage("Enter an audit reason (at least 3 characters).");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await action();
      if (!provider.getVipReferralAdminSettings) {
        setMessage(`Save accepted (audit ${result.auditId}); readback is unavailable.`);
        return;
      }
      const readback = await provider.getVipReferralAdminSettings();
      setBaseAsset(readback.vipPolicy?.baseAsset ?? "");
      setLevels(readback.levels);
      setBenefitsText(Object.fromEntries(
        readback.levels.map((level) => [level.level, JSON.stringify(level.benefits ?? {}, null, 2)]),
      ));
      if (readback.referralRewardPolicy) {
        setReward({
          ...readback.referralRewardPolicy,
          value: readback.referralRewardPolicy.value ?? "",
          asset: readback.referralRewardPolicy.asset ?? "",
          minimumFirstDeposit: readback.referralRewardPolicy.minimumFirstDeposit ?? "",
          baseAsset: readback.referralRewardPolicy.baseAsset ?? "",
        });
      }
      refresh();
      setMessage(verify(readback)
        ? `Saved and confirmed by readback. Audit ID: ${result.auditId}`
        : `Save returned (audit ${result.auditId}), but readback did not match. Refresh before retrying.`);
    } catch (error) {
      setMessage(`Save/readback incomplete: ${error instanceof Error ? error.message : String(error)}. Refresh before retrying.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mb-4 rounded-lg border border-border/70 bg-card px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        VIP and referral policy
      </summary>
      <div className="mt-4 flex flex-col gap-5">
        {loading ? <p className="text-xs text-muted-foreground">Loading policies…</p> : null}
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error.message}
          </p>
        ) : null}
        <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          VIP qualification base asset
          <input
            aria-label="VIP base asset"
            className={inputClass}
            maxLength={20}
            value={baseAsset}
            onChange={(event) => setBaseAsset(event.target.value.toUpperCase())}
          />
          <Button
            size="sm"
            disabled={!canEdit || saving || !provider.saveVipQualificationPolicy || loading || !!error || !settings}
            onClick={() => void save(() => provider.saveVipQualificationPolicy!(baseAsset, reason), (readback) => (readback.vipPolicy?.baseAsset ?? "").toUpperCase() === baseAsset.trim().toUpperCase())}
          >
            Save base asset
          </Button>
        </label>
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tier thresholds and benefits
          </h3>
          {levels.map((level) => (
            <div
              key={level.level}
              className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-6"
            >
              <label className="flex flex-col gap-1 text-xs">
                Level
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="999"
                  disabled={!!level.id || saving || !canEdit}
                  value={level.level}
                  onChange={(event) => {
                    const nextLevel = event.currentTarget.valueAsNumber;
                    if (Number.isInteger(nextLevel) && nextLevel >= 0 && nextLevel <= 999) {
                      updateLevel(level.level, { level: nextLevel });
                    }
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Name
                <input
                  className={inputClass}
                  maxLength={64}
                  value={level.name}
                  onChange={(event) => updateLevel(level.level, { name: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Threshold
                <input
                  className={inputClass}
                  maxLength={128}
                  value={level.threshold}
                  onChange={(event) => updateLevel(level.level, { threshold: event.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={level.enabled}
                  onChange={(event) => updateLevel(level.level, { enabled: event.target.checked })}
                />
                Enabled
              </label>
              <textarea
                aria-label={`VIP level ${level.level} benefits JSON`}
                className="min-h-16 rounded-md border border-input bg-background p-2 font-mono text-xs sm:col-span-2"
                value={benefitsText[level.level] ?? "{}"}
                onChange={(event) =>
                  setBenefitsText((current) => ({ ...current, [level.level]: event.target.value }))
                }
              />
              <Button
                size="sm"
                className="sm:col-span-6 sm:justify-self-end"
                disabled={!canEdit || saving || !provider.saveVipAdminLevel || loading || !!error || !settings}
                onClick={() =>
                  void save(() => {
                    let benefits: Record<string, unknown>;
                    try {
                      const parsed: unknown = JSON.parse(benefitsText[level.level] ?? "{}");
                      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                        throw new Error();
                      benefits = parsed as Record<string, unknown>;
                    } catch {
                      throw new Error("Benefits must be a JSON object.");
                    }
                    return provider.saveVipAdminLevel!({ ...level, benefits, reason });
                  }, (readback) => {
                    const saved = readback.levels.find((item) => item.level === level.level);
                    return !!saved && saved.name === level.name && saved.threshold === level.threshold &&
                      saved.enabled === level.enabled && JSON.stringify(saved.benefits ?? {}) === JSON.stringify(JSON.parse(benefitsText[level.level] ?? "{}"));
                  })
                }
              >
                Save tier
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            disabled={!canEdit || saving || loading || !!error || !settings}
            onClick={() => {
              const level = Math.max(-1, ...levels.map((item) => item.level)) + 1;
              setLevels((current) => [
                ...current,
                { id: "", level, name: "", threshold: "", benefits: {}, enabled: true },
              ]);
              setBenefitsText((current) => ({ ...current, [level]: "{}" }));
            }}
          >
            Add tier
          </Button>
        </div>
        <div className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-3">
            First qualifying deposit referral reward
          </h3>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={reward.enabled}
              onChange={(event) =>
                setReward((value) => ({ ...value, enabled: event.target.checked }))
              }
            />
            Enabled
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Reward mode
            <select
              className={inputClass}
              value={reward.mode}
              onChange={(event) =>
                setReward((value) => ({
                  ...value,
                  mode: event.target.value as "FIXED" | "PERCENT",
                }))
              }
            >
              <option value="FIXED">Fixed amount</option>
              <option value="PERCENT">Percent</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Value
            <input
              className={inputClass}
              value={reward.value}
              onChange={(event) => setReward((value) => ({ ...value, value: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Reward asset
            <input
              className={inputClass}
              value={reward.asset}
              maxLength={20}
              onChange={(event) =>
                setReward((value) => ({ ...value, asset: event.target.value.toUpperCase() }))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Minimum first deposit
            <input
              className={inputClass}
              value={reward.minimumFirstDeposit}
              onChange={(event) =>
                setReward((value) => ({ ...value, minimumFirstDeposit: event.target.value }))
              }
            />
          </label>
          <Button
            size="sm"
            className="self-end"
            disabled={!canEdit || saving || !provider.saveReferralRewardPolicy || loading || !!error || !settings}
            onClick={() =>
              void save(() => provider.saveReferralRewardPolicy!({ ...reward, reason }), (readback) => {
                const saved = readback.referralRewardPolicy;
                return !!saved && saved.enabled === reward.enabled && saved.mode === reward.mode &&
                  (saved.value ?? "") === reward.value && (saved.asset ?? "").toUpperCase() === reward.asset.trim().toUpperCase() &&
                  (saved.minimumFirstDeposit ?? "") === reward.minimumFirstDeposit &&
                  (saved.baseAsset ?? "").toUpperCase() === reward.baseAsset.trim().toUpperCase();
              })
            }
          >
            Save reward policy
          </Button>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Audit reason
          <input
            aria-label="VIP/referral policy audit reason"
            className={inputClass}
            maxLength={500}
            minLength={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        {message ? (
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </details>
  );
}
