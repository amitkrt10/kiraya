"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { signInAction, type SignInState } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import styles from "./LoginForm.module.css";

const initialState: SignInState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>
            <span className={styles.logoMarkText}>K</span>
          </div>
          <span className={styles.wordmark}>KIRAYA</span>
        </div>
        <div className={styles.heading}>Sign in to your organization</div>

        {state.error ? (
          <div className={styles.errorSpacer}>
            <Alert variant="error">{state.error}</Alert>
          </div>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className={styles.fields}>
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@organization.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            className={styles.submit}
          >
            <Mail width={16} height={16} aria-hidden="true" />
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}
