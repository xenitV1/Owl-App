import { UserProfile } from "@/components/user/UserProfile";

interface UserByUsernamePageProps {
  params: Promise<{
    username: string;
    locale: string;
  }>;
}

export default async function UserByUsernamePage({
  params,
}: UserByUsernamePageProps) {
  const { username } = await params;
  // Fetch by username via /api/users?username=...
  return <UserProfile username={username} />;
}
