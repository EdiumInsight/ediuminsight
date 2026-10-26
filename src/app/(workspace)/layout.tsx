import { QueryProvider } from "@/components/query-provider";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <QueryProvider><WorkspaceShell>{children}</WorkspaceShell></QueryProvider>;
}