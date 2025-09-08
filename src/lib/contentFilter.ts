import { db } from '@/lib/db';

// Note: Using string literals to avoid Prisma client issues
type FilterType = 'KEYWORD' | 'PATTERN' | 'URL' | 'EMAIL' | 'PHONE';
type FilterAction = 'FLAG' | 'BLOCK' | 'REMOVE' | 'ESCALATE';

interface FilterResult {
  matched: boolean;
  filter?: any;
  action?: FilterAction;
  confidence: number;
}

export class ContentFilterService {
  static async checkContent(content: string, type: 'POST' | 'COMMENT' = 'POST'): Promise<FilterResult> {
    try {
      // Get all active filters
      const filters = await db.contentFilter.findMany({
        where: { isActive: true }
      });

      if (!filters.length) {
        return { matched: false, confidence: 0 };
      }

      // Check each filter against the content
      for (const filter of filters) {
        const result = this.testFilter(content, filter);
        if (result.matched) {
          return {
            matched: true,
            filter,
            action: filter.action,
            confidence: result.confidence
          };
        }
      }

      return { matched: false, confidence: 0 };
    } catch (error) {
      console.error('Error checking content against filters:', error);
      return { matched: false, confidence: 0 };
    }
  }

  private static testFilter(content: string, filter: any): { matched: boolean; confidence: number } {
    const lowerContent = content.toLowerCase();
    const lowerPattern = filter.pattern.toLowerCase();

    switch (filter.type) {
      case 'KEYWORD':
        // Exact keyword match
        if (lowerContent.includes(lowerPattern)) {
          return { matched: true, confidence: 0.9 };
        }
        break;

      case 'PATTERN':
        // Simple pattern matching (could be enhanced with regex)
        try {
          const regex = new RegExp(lowerPattern, 'i');
          if (regex.test(content)) {
            return { matched: true, confidence: 0.8 };
          }
        } catch (error) {
          // Invalid regex, treat as keyword
          if (lowerContent.includes(lowerPattern)) {
            return { matched: true, confidence: 0.7 };
          }
        }
        break;

      case 'URL':
        // URL detection
        const urlRegex = /https?:\/\/[^\s]+/gi;
        const urls = content.match(urlRegex);
        if (urls && urls.some(url => url.toLowerCase().includes(lowerPattern))) {
          return { matched: true, confidence: 0.85 };
        }
        break;

      case 'EMAIL':
        // Email detection
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = content.match(emailRegex);
        if (emails && emails.some(email => email.toLowerCase().includes(lowerPattern))) {
          return { matched: true, confidence: 0.85 };
        }
        break;

      case 'PHONE':
        // Phone number detection (basic pattern)
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = content.match(phoneRegex);
        if (phones && phones.some(phone => phone.includes(lowerPattern))) {
          return { matched: true, confidence: 0.8 };
        }
        break;
    }

    return { matched: false, confidence: 0 };
  }

  static async applyFilterAction(
    result: FilterResult,
    contentId: string,
    contentType: 'POST' | 'COMMENT',
    moderatorId: string
  ): Promise<void> {
    if (!result.matched || !result.action) {
      return;
    }

    try {
      switch (result.action) {
        case 'FLAG':
          // Create a report for moderator review
          await db.report.create({
            data: {
              type: 'INAPPROPRIATE_CONTENT',
              reason: 'Automated flag by content filter',
              description: `Content matched filter pattern: ${result.filter.pattern}`,
              priority: 'MEDIUM',
              reporterId: moderatorId,
              targetId: contentId,
              targetType: contentType,
              ...(contentType === 'POST' ? { postId: contentId } : { commentId: contentId })
            }
          });
          break;

        case 'BLOCK':
          // Block the content (delete it)
          if (contentType === 'POST') {
            await db.post.delete({
              where: { id: contentId }
            });
          } else {
            await db.comment.delete({
              where: { id: contentId }
            });
          }
          break;

        case 'REMOVE':
          // Remove the content (delete it)
          if (contentType === 'POST') {
            await db.post.delete({
              where: { id: contentId }
            });
          } else {
            await db.comment.delete({
              where: { id: contentId }
            });
          }
          break;

        case 'ESCALATE':
          // Create an urgent report for admin review
          await db.report.create({
            data: {
              type: 'INAPPROPRIATE_CONTENT',
              reason: 'Automated escalation by content filter',
              description: `Content matched filter pattern: ${result.filter.pattern}. Requires immediate review.`,
              priority: 'URGENT',
              reporterId: moderatorId,
              targetId: contentId,
              targetType: contentType,
              ...(contentType === 'POST' ? { postId: contentId } : { commentId: contentId })
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error applying filter action:', error);
    }
  }

  static async getFilterStats(): Promise<{
    totalFilters: number;
    activeFilters: number;
    filterTypes: Record<string, number>;
  }> {
    try {
      const filters = await db.contentFilter.findMany();
      const activeFilters = filters.filter(f => f.isActive);

      const filterTypes = filters.reduce((acc, filter) => {
        acc[filter.type] = (acc[filter.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalFilters: filters.length,
        activeFilters: activeFilters.length,
        filterTypes
      };
    } catch (error) {
      console.error('Error getting filter stats:', error);
      return {
        totalFilters: 0,
        activeFilters: 0,
        filterTypes: {}
      };
    }
  }

  static async createDefaultFilters(): Promise<void> {
    const defaultFilters = [
      {
        type: 'KEYWORD' as FilterType,
        pattern: 'spam',
        action: 'FLAG' as FilterAction,
        description: 'Detect spam content'
      },
      {
        type: 'KEYWORD' as FilterType,
        pattern: 'scam',
        action: 'ESCALATE' as FilterAction,
        description: 'Detect scam content'
      },
      {
        type: 'KEYWORD' as FilterType,
        pattern: 'hate',
        action: 'FLAG' as FilterAction,
        description: 'Detect hate speech'
      },
      {
        type: 'EMAIL' as FilterType,
        pattern: '@',
        action: 'FLAG' as FilterAction,
        description: 'Detect email addresses'
      },
      {
        type: 'PHONE' as FilterType,
        pattern: 'phone',
        action: 'FLAG' as FilterAction,
        description: 'Detect phone numbers'
      },
      {
        type: 'URL' as FilterType,
        pattern: 'bit.ly',
        action: 'FLAG' as FilterAction,
        description: 'Detect shortened URLs'
      }
    ];

    try {
      for (const filterData of defaultFilters) {
        const existing = await db.contentFilter.findFirst({
          where: {
            type: filterData.type,
            pattern: filterData.pattern
          }
        });

        if (!existing) {
          await db.contentFilter.create({
            data: filterData
          });
        }
      }
    } catch (error) {
      console.error('Error creating default filters:', error);
    }
  }
}