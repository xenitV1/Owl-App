import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to Turkish coming-soon page as default
  redirect('/tr/coming-soon');
}