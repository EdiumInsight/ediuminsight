import { createResource, isApiResource, listResource } from "@/lib/api/resources";

type RouteContext = { params: Promise<{ resource: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { resource } = await context.params;
  if (!isApiResource(resource)) return Response.json({ error: "Unknown API resource", code: "NOT_FOUND" }, { status: 404 });
  return listResource(resource);
}

export async function POST(request: Request, context: RouteContext) {
  const { resource } = await context.params;
  if (!isApiResource(resource)) return Response.json({ error: "Unknown API resource", code: "NOT_FOUND" }, { status: 404 });
  return createResource(resource, request);
}