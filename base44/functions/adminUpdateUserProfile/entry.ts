import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { profileId, data } = await req.json();

  if (!profileId || !data) {
    return Response.json({ error: 'Missing profileId or data' }, { status: 400 });
  }

  await base44.asServiceRole.entities.UserProfile.update(profileId, data);
  return Response.json({ success: true });
});