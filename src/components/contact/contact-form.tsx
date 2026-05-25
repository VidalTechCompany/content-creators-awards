"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Send a note</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const subject = encodeURIComponent(String(data.get("subject") ?? "CCA inquiry"));
            const body = encodeURIComponent(String(data.get("message") ?? ""));
            window.location.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required placeholder="Partnership / Press / Support" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" required rows={5} />
          </div>
          <Button type="submit">Open email draft</Button>
        </form>
      </CardContent>
    </Card>
  );
}
