import { StudentProfileClient } from "@/features/eleves/student-profile-client";

type Props = { params: Promise<{ id: string }> };

export default async function StudentProfilePage({ params }: Props) {
  const { id } = await params;
  return <StudentProfileClient studentId={id} />;
}
