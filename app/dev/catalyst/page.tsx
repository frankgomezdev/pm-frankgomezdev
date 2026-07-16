"use client";

import { useState } from "react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Field, FieldGroup, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";

/**
 * Throwaway route to verify Catalyst components compile and render.
 * Not linked from the app shell; remove after migration.
 */
export default function CatalystSmokeTestPage() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-dvh bg-white p-8 text-zinc-950 dark:bg-zinc-900 dark:text-white">
        <div className="mx-auto flex max-w-lg flex-col gap-8">
          <div>
            <Heading>Catalyst smoke test</Heading>
            <Text className="mt-2">
              Throwaway page — confirms deps, Link, Inter, and dark mode.{" "}
              <Link href="/" className="underline">
                Back home
              </Link>
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setDark((v) => !v)}>
              Toggle {dark ? "light" : "dark"}
            </Button>
            <Button outline>Outline</Button>
            <Button plain>Plain</Button>
            <Badge color="sky">In progress</Badge>
            <Badge color="amber">Blocked</Badge>
            <Badge color="emerald">Done</Badge>
          </div>

          <Divider />

          <div>
            <Subheading>Form primitives</Subheading>
            <FieldGroup className="mt-4">
              <Field>
                <Label>Title</Label>
                <Input name="title" defaultValue="Sample task" />
              </Field>
              <Field>
                <Label>Status</Label>
                <Select name="status" defaultValue="todo">
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </Select>
              </Field>
              <Field>
                <Label>Notes</Label>
                <Textarea name="notes" rows={3} defaultValue="Looks good." />
              </Field>
            </FieldGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
