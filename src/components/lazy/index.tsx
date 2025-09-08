'use client';

import { createLazyComponent } from '@/lib/lazyLoading';
import { CardSkeleton } from '@/lib/lazyLoading';

// Lazy load heavy admin components
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/components/admin/AdminDashboard'),
  () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
);

export const LazyUserManagement = createLazyComponent(
  () => import('@/components/admin/UserManagement'),
  CardSkeleton
);

export const LazyContentModeration = createLazyComponent(
  () => import('@/components/admin/ContentModeration'),
  CardSkeleton
);

export const LazyAnalytics = createLazyComponent(
  () => import('@/components/admin/Analytics'),
  () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
);

// Lazy load community components
export const LazyCommunityFeed = createLazyComponent(
  () => import('@/components/communities/CommunityFeed'),
  CardSkeleton
);

export const LazyGroupFeed = createLazyComponent(
  () => import('@/components/communities/GroupFeed'),
  CardSkeleton
);

export const LazyCommunityCreateDialog = createLazyComponent(
  () => import('@/components/communities/CommunityCreateDialog'),
  () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>
);

export const LazyGroupCreateDialog = createLazyComponent(
  () => import('@/components/communities/GroupCreateDialog'),
  () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>
);

// Lazy load moderation components
export const LazyModerationDashboard = createLazyComponent(
  () => import('@/components/moderation/ModerationDashboard'),
  CardSkeleton
);

export const LazyAppealsManager = createLazyComponent(
  () => import('@/components/moderation/AppealsManager'),
  CardSkeleton
);

export const LazyContentFilterManager = createLazyComponent(
  () => import('@/components/moderation/ContentFilterManager'),
  CardSkeleton
);

// Lazy load pool components
export const LazyPoolManagement = createLazyComponent(
  () => import('@/components/pools/PoolManagement'),
  CardSkeleton
);

export const LazySavedPosts = createLazyComponent(
  () => import('@/components/pools/SavedPosts'),
  CardSkeleton
);

// Lazy load auth components
export const LazyUserProfile = createLazyComponent(
  () => import('@/components/auth/UserProfile'),
  () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mt-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mt-1"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
);

export const LazyTwoFactorSetup = createLazyComponent(
  () => import('@/components/auth/TwoFactorSetup'),
  () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
);

// Lazy load privacy components
export const LazyConsentManager = createLazyComponent(
  () => import('@/components/privacy/ConsentManager'),
  CardSkeleton
);

export const LazyDataControls = createLazyComponent(
  () => import('@/components/privacy/DataControls'),
  CardSkeleton
);

// Lazy load notification components
export const LazyNotificationDropdown = createLazyComponent(
  () => import('@/components/notifications/NotificationDropdown'),
  () => (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  )
);

// Utility function to prefetch components when needed
export const prefetchComponents = {
  // Prefetch admin components when user has admin role
  prefetchAdminComponents: async () => {
    const promises = [
      import('@/components/admin/AdminDashboard'),
      import('@/components/admin/UserManagement'),
      import('@/components/admin/ContentModeration'),
      import('@/components/admin/Analytics')
    ];
    
    await Promise.all(promises);
  },

  // Prefetch community components when navigating to communities page
  prefetchCommunityComponents: async () => {
    const promises = [
      import('@/components/communities/CommunityFeed'),
      import('@/components/communities/GroupFeed'),
      import('@/components/communities/CommunityCreateDialog'),
      import('@/components/communities/GroupCreateDialog')
    ];
    
    await Promise.all(promises);
  },

  // Prefetch moderation components when user has moderator role
  prefetchModerationComponents: async () => {
    const promises = [
      import('@/components/moderation/ModerationDashboard'),
      import('@/components/moderation/AppealsManager'),
      import('@/components/moderation/ContentFilterManager')
    ];
    
    await Promise.all(promises);
  },

  // Prefetch pool components when navigating to saved page
  prefetchPoolComponents: async () => {
    const promises = [
      import('@/components/pools/PoolManagement'),
      import('@/components/pools/SavedPosts')
    ];
    
    await Promise.all(promises);
  }
};