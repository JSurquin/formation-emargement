import { SessionEmargementClient } from "./session-emargement-client";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  return <SessionEmargementClient sessionId={id} />;
}
