"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseTenantFormData } from "@/lib/validation/tenant";
import { createTenant, updateTenant } from "@/lib/mutations/tenants";

export interface TenantActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createTenantAction(
  _prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseTenantFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createTenant(access.organizationId, parsed.data);
  if (result.error || !result.data) {
    return { error: result.error ?? "Something went wrong saving this. Please try again." };
  }

  revalidatePath("/app/tenants");
  redirect(`/app/tenants/${result.data.id}`);
}

export async function updateTenantAction(
  tenantId: string,
  _prevState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseTenantFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateTenant(tenantId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/tenants");
  revalidatePath(`/app/tenants/${tenantId}`);
  redirect(`/app/tenants/${tenantId}`);
}
