import { redirect } from "next/navigation";

/**
 * P6.3-E: retired — creating an occupancy now starts from Unit Detail's
 * "Assign Tenant" drawer (P6.3-C), which calls the same atomic RPC this
 * form's submit ultimately relied on. No in-app link has pointed here
 * since P6.3-C shipped; this redirect just closes the last direct-URL
 * path. LeaseCreateForm itself is untouched.
 */
export default function NewLeasePage() {
  redirect("/app/units");
}
