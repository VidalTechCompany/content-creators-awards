"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getFingerprint() {
  if (typeof window === "undefined") return "";
  const key = "cca_fp";
  let v = window.localStorage.getItem(key);
  if (!v) {
    v = (function generateUUID() {
      try {
        // Prefer built-in randomUUID when available
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        // Fallback: use getRandomValues to generate RFC4122 v4 UUID
        if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
          const bytes = crypto.getRandomValues(new Uint8Array(16));
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return (
            hex.substring(0, 8) + "-" +
            hex.substring(8, 12) + "-" +
            hex.substring(12, 16) + "-" +
            hex.substring(16, 20) + "-" +
            hex.substring(20)
          );
        }
      } catch (e) {
        void e;
        // ignore and fallback to timestamp-based id below
      }
      // Last-resort fallback (not cryptographically strong)
      return "fp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
    })();
    window.localStorage.setItem(key, v);
  }
  return v;
}

type Props = {
  categoryId: string;
  nomineeId: string;
  nomineeName: string;
  canVote: boolean;
  verifyNote?: string | null;
};

export function VoteWithCaptchaButton({
  categoryId,
  nomineeId,
  nomineeName,
  canVote,
  verifyNote,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fp = useMemo(() => getFingerprint(), []);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId,
          nomineeId,
          fingerprint: fp,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : body.error && typeof body.error === "object"
              ? JSON.stringify(body.error)
              : "Vote failed";
        throw new Error(msg);
      }
      toast.success("Your vote was recorded. Thank you!");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setLoading(false);
    }
  }

  if (!canVote) {
    return (
      <Button disabled variant="secondary" className="w-full">
        {verifyNote ?? "Log in & verify email to vote"}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Vote</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm your vote</DialogTitle>
          <DialogDescription>
            You are voting for <span className="text-amber-200">{nomineeName}</span>. This action is protected by audit logging.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Confirm vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
