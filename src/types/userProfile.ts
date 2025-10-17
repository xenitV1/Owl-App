export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string; // Add username field
  avatar?: string;
  role: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  bio?: string;
  country?: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
    likes: number;
    pools: number;
    followers: number;
    following: number;
  };
}

export interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  subject?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    school?: string;
    grade?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

export interface UserProfileProps {
  userId?: string;
  username?: string;
}

export interface EditForm {
  name: string;
  username: string; // Add username field
  role: string;
  school: string;
  grade: string;
  favoriteSubject: string;
  bio: string;
  avatar: string | undefined;
  country?: string;
}
