/**
 * Editor Layout — no sidebar, full-screen document editing experience.
 * The document editor manages its own header via EditorHeader component.
 * We only need a minimal shell that removes the dashboard sidebar layout.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
