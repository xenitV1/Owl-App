import { UserProfile } from '@/components/user/UserProfile';

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
    locale: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;
  return <UserProfile userId={userId} />;
}

